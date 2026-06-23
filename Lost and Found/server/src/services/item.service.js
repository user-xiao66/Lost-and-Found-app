/**
 * 物品信息业务逻辑层
 * 处理物品发布、查询、状态更新等核心业务
 */

const itemModel = require('../models/item.model')
const matchService = require('./match.service')
const { paginatedResult } = require('../utils/pagination')

/**
 * 发布物品信息
 * 创建物品后自动触发匹配逻辑
 *
 * @param {Object} data - 物品数据（含 user_id）
 * @returns {Promise<Object>} 创建后的物品详情
 */
async function publish(data) {
  // 1. 创建物品记录
  const { id } = await itemModel.create(data)

  // 2. 查询完整信息（含发布者昵称）
  const item = await itemModel.findById(id)

  // 3. 异步触发匹配（不阻塞发布响应）
  setImmediate(() => {
    matchService.tryMatch(item).catch(err => {
      console.error('匹配失败:', err.message)
    })
  })

  return item
}

/**
 * 获取物品详情
 * 非发布者查看时会脱敏联系方式
 *
 * @param {number} id      - 物品 ID
 * @param {number} [userId] - 当前登录用户 ID（可选，用于判断是否为发布者）
 * @param {boolean} [isAdmin=false] - 是否管理员（管理员不脱敏）
 * @returns {Promise<Object>} 物品详情
 */
async function getDetail(id, userId, isAdmin = false) {
  const item = await itemModel.findById(id)
  if (!item) {
    throw { code: 404, message: '物品信息不存在' }
  }

  // 联系方式脱敏：管理员或发布者本人可见原始联系方式
  if (item.contact && !isAdmin && String(item.user_id) !== String(userId)) {
    item.contact = maskContact(item.contact)
  }

  return item
}

/**
 * 分页查询物品列表
 * 支持按类型、关键词、分类、地点、状态筛选
 *
 * @param {Object} query - 筛选参数
 * @returns {Promise<Object>} 分页结果 { list, total, page, page_size, total_pages }
 */
async function getList(query) {
  const { type, keyword, category, location, status, page = 1, pageSize = 10, isAdmin = false } = query
  const { list, total } = await itemModel.findList({
    type,
    keyword,
    category,
    location,
    status: status || undefined,  // 不传则查全部，非管理员默认active由controller控制
    page: parseInt(page),
    pageSize: parseInt(pageSize)
  })

  // 管理员不脱敏，普通用户脱敏
  const maskedList = isAdmin
    ? list
    : list.map(item => ({
        ...item,
        contact: maskContact(item.contact)
      }))

  return paginatedResult(maskedList, total, page, pageSize)
}

/**
 * 查询当前用户发布的物品（分页）
 *
 * @param {number} userId - 用户 ID
 * @param {string} [type]   - 按类型筛选 'lost' | 'found'
 * @param {string} [status] - 按状态筛选
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @returns {Promise<Object>} 分页结果
 */
async function getMyItems(userId, type, status, page = 1, pageSize = 10) {
  const { list, total } = await itemModel.findByUserId(userId, type, status, page, pageSize)
  // 自己的物品不脱敏联系方式
  return paginatedResult(list, total, page, pageSize)
}

/**
 * 标记物品为"已找到"
 * 仅发布者本人可操作
 *
 * @param {number} id     - 物品 ID
 * @param {number} userId - 操作用户 ID
 */
async function markAsFound(id, userId) {
  const item = await itemModel.findById(id)
  if (!item) {
    throw { code: 404, message: '物品信息不存在' }
  }
  // 仅发布者可标记
  if (String(item.user_id) !== String(userId)) {
    throw { code: 403, message: '仅发布者可标记已找到' }
  }
  await itemModel.updateStatus(id, 'found')
}

/**
 * 更新物品信息（仅发布者本人）
 */
async function updateItem(id, userId, data) {
  const item = await itemModel.findById(id)
  if (!item) throw { code: 404, message: '物品信息不存在' }
  if (String(item.user_id) !== String(userId)) throw { code: 403, message: '仅发布者可编辑' }

  const updates = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.category !== undefined) updates.category = data.category
  if (data.location !== undefined) updates.location = data.location
  if (data.occur_time !== undefined) updates.occur_time = data.occur_time
  if (data.contact !== undefined) updates.contact = data.contact
  if (data.description !== undefined) updates.description = data.description
  if (data.images !== undefined) updates.images = data.images

  await itemModel.updateItem(id, updates)
  return await itemModel.findById(id)
}

/**
 * 删除物品（发布者或管理员）
 */
async function deleteItem(id, userId, isAdmin) {
  const item = await itemModel.findById(id)
  if (!item) throw { code: 404, message: '物品信息不存在' }
  if (!isAdmin && String(item.user_id) !== String(userId)) {
    throw { code: 403, message: '仅发布者或管理员可删除' }
  }
  await itemModel.updateStatus(id, 'closed')
}

/**
 * 联系方式脱敏
 * 手机号中间 4 位替换为 ****，其他类型仅保留首尾字符
 *
 * @param {string} contact - 原始联系方式
 * @returns {string} 脱敏后的联系方式
 */
function maskContact(contact) {
  if (!contact) return ''
  // 手机号：138****5678
  if (/^1\d{10}$/.test(contact)) {
    return contact.slice(0, 3) + '****' + contact.slice(7)
  }
  // 其他格式（如微信号）：只显示前 2 位 + ****
  if (contact.length > 4) {
    return contact.slice(0, 2) + '****' + contact.slice(-2)
  }
  return '****'
}

module.exports = { publish, getDetail, getList, getMyItems, markAsFound, updateItem, deleteItem }
