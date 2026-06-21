/**
 * 通知相关 API 接口封装
 * 包含通知列表、标记已读、未读数量
 */

import { get, put } from './request.js'

/**
 * 获取用户的通知列表（分页）
 * @param {Object} params - { page?, page_size? }
 * @returns {Promise<Object>} { list, total, page, page_size, total_pages }
 */
export function getList(params = {}) {
  return get('/notifications', params)
}

/**
 * 标记通知为已读
 * @param {number} id - 通知 ID
 * @returns {Promise<Object>} { lost_item_id, found_item_id }
 */
export function markAsRead(id) {
  return put(`/notifications/${id}/read`)
}

/**
 * 获取未读通知数量
 * @returns {Promise<Object>} { count }
 */
export function getUnreadCount() {
  return get('/notifications/unread-count')
}
