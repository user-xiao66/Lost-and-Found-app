/**
 * 通知业务逻辑层
 * 处理站内通知的查询、已读标记、未读统计
 */

const notificationModel = require('../models/notification.model')
const { paginatedResult } = require('../utils/pagination')

/**
 * 获取用户的通知列表（分页）
 *
 * @param {number} userId   - 用户 ID
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @returns {Promise<Object>} 分页结果，每条通知含匹配双方的物品名称
 */
async function getList(userId, page = 1, pageSize = 10) {
  const { list, total } = await notificationModel.findByUserId(
    userId,
    parseInt(page),
    parseInt(pageSize)
  )
  return paginatedResult(list, total, page, pageSize)
}

/**
 * 标记通知为已读
 * 成功标记后返回该通知关联的失物 ID（用于前端跳转详情页）
 *
 * @param {number} id     - 通知 ID
 * @param {number} userId - 当前用户 ID（校验所有权）
 * @returns {Promise<Object>} { lost_item_id, found_item_id }
 */
async function markAsRead(id, userId) {
  // 通过 findByUserId 验证通知是否属于当前用户
  const { list } = await notificationModel.findByUserId(userId, 1, 100)
  const notification = list.find(n => String(n.id) === String(id))

  if (!notification) {
    throw { code: 404, message: '通知不存在' }
  }

  await notificationModel.markAsRead(id)

  return {
    lost_item_id: notification.lost_item_id,
    found_item_id: notification.found_item_id
  }
}

/**
 * 获取用户未读通知数量
 * 用于个人中心红点显示
 *
 * @param {number} userId - 用户 ID
 * @returns {Promise<number>} 未读数
 */
async function getUnreadCount(userId) {
  return notificationModel.countUnread(userId)
}

module.exports = { getList, markAsRead, getUnreadCount }
