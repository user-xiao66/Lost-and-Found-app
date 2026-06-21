/**
 * 通知数据模型
 * 封装 notification 表的所有数据库操作
 */

const { query } = require('../config/db')

/**
 * 创建通知记录
 * @param {Object} data - { user_id, type, match_id }
 * @returns {Promise<Object>} { id: 新记录的 ID }
 */
async function create({ user_id, type, match_id }) {
  const result = await query(
    'INSERT INTO `notification` (`user_id`, `type`, `match_id`) VALUES (?, ?, ?)',
    [user_id, type, match_id]
  )
  return { id: result.insertId }
}

/**
 * 查询某用户的通知列表（分页）
 * 关联 match 和 item 表获取匹配详情
 *
 * @param {number} userId - 用户 ID
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=10] - 每页条数
 * @returns {Promise<{ list: Array, total: number }>}
 */
async function findByUserId(userId, page = 1, pageSize = 10) {
  // 计算总数
  const countRows = await query(
    'SELECT COUNT(*) AS total FROM `notification` WHERE `user_id` = ?',
    [userId]
  )
  const total = countRows[0].total

  // 分页查询通知列表，关联 match + item 获取双方物品信息
  // 注意：MySQL 不支持 LIMIT/OFFSET 用 ? 占位符，必须字面值拼接（已 parseInt 确保整数）
  const offset = (parseInt(page) - 1) * parseInt(pageSize)
  const limitVal = parseInt(pageSize)
  const list = await query(
    `SELECT n.*,
            m.match_score,
            m.lost_item_id, m.found_item_id,
            li.name AS lost_item_name,
            fi.name AS found_item_name
     FROM \`notification\` n
     JOIN \`match\` m ON n.match_id = m.id
     JOIN \`item\` li ON m.lost_item_id = li.id
     JOIN \`item\` fi ON m.found_item_id = fi.id
     WHERE n.user_id = ?
     ORDER BY n.\`created_at\` DESC
     LIMIT ${limitVal} OFFSET ${offset}`,
    [userId]
  )

  return { list, total }
}

/**
 * 标记通知为已读
 * @param {number} id - 通知 ID
 */
async function markAsRead(id) {
  await query(
    'UPDATE `notification` SET `is_read` = 1 WHERE `id` = ?',
    [id]
  )
}

/**
 * 统计用户未读通知数量
 * @param {number} userId - 用户 ID
 * @returns {Promise<number>} 未读通知数
 */
async function countUnread(userId) {
  const rows = await query(
    'SELECT COUNT(*) AS count FROM `notification` WHERE `user_id` = ? AND `is_read` = 0',
    [userId]
  )
  return rows[0].count
}

module.exports = { create, findByUserId, markAsRead, countUnread }
