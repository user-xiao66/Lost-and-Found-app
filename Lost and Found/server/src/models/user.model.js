/**
 * 用户数据模型
 * 封装 user 表的所有数据库操作
 */

const { query } = require('../config/db')

/**
 * 根据手机号查询用户
 * @param {string} phone - 手机号
 * @returns {Promise<Object|null>} 用户对象或 null
 */
async function findByPhone(phone) {
  const rows = await query('SELECT * FROM `user` WHERE `phone` = ?', [phone])
  return rows[0] || null
}

/**
 * 根据 ID 查询用户
 * @param {number} id - 用户 ID
 * @returns {Promise<Object|null>} 用户对象或 null
 */
async function findById(id) {
  const rows = await query(
    'SELECT id, nickname, phone, avatar, created_at FROM `user` WHERE `id` = ?',
    [id]
  )
  return rows[0] || null
}

/**
 * 创建新用户
 * @param {Object} data - { nickname, phone, password, avatar? }
 * @returns {Promise<Object>} 插入结果
 */
async function create(data) {
  const { nickname, phone, password, avatar = null } = data
  const result = await query(
    'INSERT INTO `user` (`nickname`, `phone`, `password`, `avatar`) VALUES (?, ?, ?, ?)',
    [nickname, phone, password, avatar]
  )
  return { id: result.insertId }
}

/**
 * 更新用户密码
 * @param {number} id - 用户 ID
 * @param {string} newPassword - bcrypt 加密后的新密码
 */
async function updatePassword(id, newPassword) {
  await query('UPDATE `user` SET `password` = ? WHERE `id` = ?', [newPassword, id])
}

module.exports = { findByPhone, findById, create, updatePassword }
