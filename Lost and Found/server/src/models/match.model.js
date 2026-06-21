/**
 * 匹配记录数据模型
 * 封装 match 表的所有数据库操作
 */

const { query } = require('../config/db')

/**
 * 创建匹配记录
 * @param {Object} data - { lost_item_id, found_item_id, match_score }
 * @returns {Promise<Object>} { id: 新记录的 ID }
 */
async function create({ lost_item_id, found_item_id, match_score }) {
  const result = await query(
    'INSERT INTO `match` (`lost_item_id`, `found_item_id`, `match_score`) VALUES (?, ?, ?)',
    [lost_item_id, found_item_id, match_score]
  )
  return { id: result.insertId }
}

/**
 * 根据失物 ID 查询匹配记录（含关联的招领信息）
 * 用于：查看某失物匹配到了哪些招领
 *
 * @param {number} lostItemId - 失物 ID
 * @returns {Promise<Array>} 匹配记录列表
 */
async function findByLostItemId(lostItemId) {
  const rows = await query(
    `SELECT m.*, fi.name AS found_item_name, fi.location AS found_item_location,
            fi.images AS found_item_images, fi.status AS found_item_status
     FROM \`match\` m
     JOIN \`item\` fi ON m.found_item_id = fi.id
     WHERE m.lost_item_id = ?
     ORDER BY m.match_score DESC, m.created_at DESC`,
    [lostItemId]
  )
  return rows
}

/**
 * 根据招领 ID 查询匹配记录（含关联的失物信息）
 * 用于：查看某招领匹配到了哪些失物
 *
 * @param {number} foundItemId - 招领 ID
 * @returns {Promise<Array>} 匹配记录列表
 */
async function findByFoundItemId(foundItemId) {
  const rows = await query(
    `SELECT m.*, li.name AS lost_item_name, li.location AS lost_item_location,
            li.images AS lost_item_images, li.status AS lost_item_status
     FROM \`match\` m
     JOIN \`item\` li ON m.lost_item_id = li.id
     WHERE m.found_item_id = ?
     ORDER BY m.match_score DESC, m.created_at DESC`,
    [foundItemId]
  )
  return rows
}

module.exports = { create, findByLostItemId, findByFoundItemId }
