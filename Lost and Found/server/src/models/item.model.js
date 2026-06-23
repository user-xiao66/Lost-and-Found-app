/**
 * 物品信息数据模型
 * 封装 item 表的所有数据库操作，支持失物和招领两类信息
 */

const { query } = require('../config/db')

/**
 * 创建物品信息
 * @param {Object} data - 物品字段对象
 * @returns {Promise<Object>} { id: 新记录的 ID }
 */
async function create(data) {
  const { user_id, type, name, category = '其他', location, occur_time, contact, description = null, images = null, expires_at = null } = data
  const result = await query(
    `INSERT INTO \`item\` (\`user_id\`, \`type\`, \`name\`, \`category\`, \`location\`, \`occur_time\`, \`contact\`, \`description\`, \`images\`, \`expires_at\`)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, type, name, category, location, occur_time, contact, description, images, expires_at]
  )
  return { id: result.insertId }
}

/**
 * 根据 ID 查询物品详情（含发布者昵称和头像）
 * @param {number} id - 物品 ID
 * @returns {Promise<Object|null>} 物品详情对象
 */
async function findById(id) {
  const rows = await query(
    `SELECT i.*, u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM \`item\` i
     JOIN \`user\` u ON i.user_id = u.id
     WHERE i.id = ?`,
    [id]
  )
  return rows[0] || null
}

/**
 * 分页查询物品列表
 * 支持按类型、关键词、分类、地点、状态筛选
 *
 * @param {Object} options - 查询参数
 * @param {string}  options.type     - 'lost' | 'found' | undefined（不传查全部）
 * @param {string}  options.keyword  - 关键词（在 name 字段中模糊匹配）
 * @param {string}  options.category - 物品分类
 * @param {string}  options.location - 地点关键字模糊匹配
 * @param {string}  options.status   - 'active' | 'found' | 'closed'
 * @param {number}  options.page     - 页码，默认 1
 * @param {number}  options.pageSize - 每页条数，默认 10
 * @returns {Promise<{ list: Array, total: number }>} 列表 + 总数
 */
async function findList({ type, keyword, category, location, status, startDate, endDate, page = 1, pageSize = 10 }) {
  // 构建动态 WHERE 条件
  const conditions = []
  const params = []

  if (type) {
    conditions.push('i.`type` = ?')
    params.push(type)
  }
  if (keyword) {
    conditions.push('i.`name` LIKE ?')
    params.push(`%${keyword}%`)
  }
  if (category) {
    conditions.push('i.`category` = ?')
    params.push(category)
  }
  if (location) {
    conditions.push('i.`location` LIKE ?')
    params.push(`%${location}%`)
  }
  if (status) {
    conditions.push('i.`status` = ?')
    params.push(status)
  }
  if (startDate) {
    conditions.push('i.`occur_time` >= ?')
    params.push(startDate)
  }
  if (endDate) {
    conditions.push('i.`occur_time` <= ?')
    params.push(endDate)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // 计算总数
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM \`item\` i ${whereClause}`,
    params
  )
  const total = countRows[0].total

  // 分页查询列表，按发布时间倒序，关联用户表获取昵称和头像
  // 注意：MySQL 不支持 LIMIT/OFFSET 用 ? 占位符，必须字面值拼接（已 parseInt 确保整数）
  const { limitVal, offset } = normalizePagination(page, pageSize)
  const list = await query(
    `SELECT i.*, u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM \`item\` i
     JOIN \`user\` u ON i.user_id = u.id
     ${whereClause}
     ORDER BY i.\`created_at\` DESC
     LIMIT ${limitVal} OFFSET ${offset}`,
    params
  )

  return { list, total }
}

/**
 * 更新物品状态
 * @param {number} id - 物品 ID
 * @param {string} status - 'active' | 'found' | 'closed'
 */
async function updateStatus(id, status) {
  await query(
    'UPDATE `item` SET `status` = ? WHERE `id` = ?',
    [status, id]
  )
}

/**
 * 查询某用户发布的物品（分页）
 * @param {number} userId - 用户 ID
 * @param {string} [type]   - 按类型筛选 'lost' | 'found'（可选）
 * @param {string} [status] - 按状态筛选（可选）
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=10] - 每页条数
 * @returns {Promise<{ list: Array, total: number }>}
 */
async function findByUserId(userId, type, status, page = 1, pageSize = 10) {
  const conditions = ['i.`user_id` = ?']
  const params = [userId]

  if (type) {
    conditions.push('i.`type` = ?')
    params.push(type)
  }

  if (status) {
    conditions.push('i.`status` = ?')
    params.push(status)
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`

  // 计算总数
  const countRows = await query(
    `SELECT COUNT(*) AS total FROM \`item\` i ${whereClause}`,
    params
  )
  const total = countRows[0].total

  // 分页查询
  // 注意：MySQL 不支持 LIMIT/OFFSET 用 ? 占位符，必须字面值拼接（已 parseInt 确保整数）
  const { limitVal, offset } = normalizePagination(page, pageSize)
  const list = await query(
    `SELECT i.*, u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM \`item\` i
     JOIN \`user\` u ON i.user_id = u.id
     ${whereClause}
     ORDER BY i.\`created_at\` DESC
     LIMIT ${limitVal} OFFSET ${offset}`,
    params
  )

  return { list, total }
}

/**
 * 更新物品字段
 * @param {number} id     - 物品 ID
 * @param {Object} data   - { name?, category?, location?, occur_time?, contact?, description?, images? }
 */
async function updateItem(id, data) {
  const fields = []
  const params = []
  for (const key of ['name', 'category', 'location', 'occur_time', 'contact', 'description', 'images']) {
    if (data[key] !== undefined) {
      fields.push(`\`${key}\` = ?`)
      params.push(data[key])
    }
  }
  if (fields.length === 0) return
  params.push(id)
  await query(`UPDATE \`item\` SET ${fields.join(', ')} WHERE \`id\` = ?`, params)
}

async function expireOverdueActiveItems() {
  await query(
    'UPDATE `item` SET `status` = ? WHERE `status` = ? AND `expires_at` IS NOT NULL AND `expires_at` < NOW()',
    ['expired', 'active']
  )
}

function normalizePagination(page, pageSize) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1)
  const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50)
  return {
    limitVal: sizeNum,
    offset: (pageNum - 1) * sizeNum
  }
}

module.exports = { create, findById, findList, updateStatus, findByUserId, updateItem, expireOverdueActiveItems }
