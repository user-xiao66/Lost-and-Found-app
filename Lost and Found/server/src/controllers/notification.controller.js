/**
 * 通知控制器
 * 处理站内通知的 HTTP 请求
 */

const notificationService = require('../services/notification.service')
const { success, error } = require('../utils/response')

/**
 * 获取用户的通知列表（分页）
 * GET /api/notifications?page=1&page_size=10
 */
async function getList(req, res) {
  try {
    const { page, page_size } = req.query
    const result = await notificationService.getList(
      req.userId,
      page || 1,
      page_size || 10
    )
    res.json(success(result))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取通知列表失败'))
  }
}

/**
 * 标记通知为已读
 * PUT /api/notifications/:id/read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params
    const data = await notificationService.markAsRead(parseInt(id), req.userId)
    res.json(success(data, '已标记为已读'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '标记失败'))
  }
}

/**
 * 获取未读通知数量
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res) {
  try {
    const count = await notificationService.getUnreadCount(req.userId)
    res.json(success({ count }, '获取成功'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取未读数失败'))
  }
}

module.exports = { getList, markAsRead, getUnreadCount }
