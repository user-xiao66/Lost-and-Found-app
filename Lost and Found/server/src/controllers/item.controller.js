/**
 * 物品信息控制器
 * 处理物品发布、查询、状态更新等 HTTP 请求
 */

const itemService = require('../services/item.service')
const { success, error } = require('../utils/response')

/**
 * 发布物品信息
 * POST /api/items
 * Body: { type, name, category, location, occur_time, contact, description?, images? }
 */
async function publish(req, res) {
  try {
    const { type, name, category, location, occur_time, contact, description, images } = req.body

    // 校验必填字段
    if (!type || !name || !location || !occur_time || !contact) {
      return res.json(error(400, '物品名称、类型、地点、时间和联系方式不能为空'))
    }

    // 校验 type 值
    if (!['lost', 'found'].includes(type)) {
      return res.json(error(400, '类型字段必须为 lost 或 found'))
    }

    // 校验名称长度
    if (name.length > 50) {
      return res.json(error(400, '物品名称不能超过50个字符'))
    }

    // 构建数据，user_id 从认证中间件获取
    const data = {
      user_id: req.userId,
      type,
      name,
      category: category || '其他',
      location,
      occur_time,
      contact,
      description: description || null,
      images: images ? (typeof images === 'string' ? images : JSON.stringify(images)) : null
    }

    const item = await itemService.publish(data)
    res.json(success(item, '发布成功'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '发布失败'))
  }
}

/**
 * 获取物品详情
 * GET /api/items/:id
 * 非发布者查看时联系方式自动脱敏
 */
async function getDetail(req, res) {
  try {
    const { id } = req.params
    // req.userId 可能为空（未登录也可查看，但联系方式脱敏）
    const item = await itemService.getDetail(parseInt(id), req.userId)
    res.json(success(item))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取详情失败'))
  }
}

/**
 * 查询物品列表（分页 + 多条件筛选）
 * GET /api/items?type=lost&keyword=手机&category=电子产品&location=图书馆&status=active&page=1&page_size=10
 */
async function getList(req, res) {
  try {
    const { type, keyword, category, location, status, page, page_size } = req.query
    const result = await itemService.getList({
      type,
      keyword,
      category,
      location,
      status,
      page: page || 1,
      pageSize: page_size || 10
    })
    res.json(success(result))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取列表失败'))
  }
}

/**
 * 查询当前用户发布的物品（分页）
 * GET /api/items/mine?type=lost&status=active&page=1&page_size=10
 */
async function getMyItems(req, res) {
  try {
    const { type, status, page, page_size } = req.query
    const result = await itemService.getMyItems(
      req.userId,
      type,         // 'lost' | 'found' | undefined（查全部）
      status,
      page || 1,
      page_size || 10
    )
    res.json(success(result))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取我的发布失败'))
  }
}

/**
 * 标记物品为"已找到"
 * PUT /api/items/:id/status
 * Body: { status: "found" }
 */
async function markAsFound(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.json(error(400, '状态字段不能为空'))
    }

    if (!['found', 'closed'].includes(status)) {
      return res.json(error(400, '状态只能为 found 或 closed'))
    }

    await itemService.markAsFound(parseInt(id), req.userId)
    res.json(success(null, '状态更新成功'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '状态更新失败'))
  }
}

module.exports = { publish, getDetail, getList, getMyItems, markAsFound }
