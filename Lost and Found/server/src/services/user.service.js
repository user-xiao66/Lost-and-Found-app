/**
 * 用户业务逻辑层
 * 处理注册、登录、资料查询等业务逻辑
 */

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')
const { JWT_SECRET } = require('../middleware/auth')

// 密码加密强度
const SALT_ROUNDS = 10
// token 有效期（7 天）
const TOKEN_EXPIRES_IN = '7d'

/**
 * 生成 JWT token
 * @param {number} userId - 用户 ID
 * @param {string} role - 用户角色（'user' | 'admin'）
 * @returns {string} JWT token 字符串
 */
function generateToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
}

/**
 * 用户注册
 * @param {Object} data - { nickname, phone, password, avatar? }
 * @returns {Promise<Object>} { token, user }
 */
async function register({ nickname, phone, password, avatar }) {
  // 1. 检查手机号是否已注册
  const existUser = await userModel.findByPhone(phone)
  if (existUser) {
    throw { code: 400, message: '该手机号已注册' }
  }

  // 2. 密码加密
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  // 3. 创建用户
  const { id } = await userModel.create({
    nickname,
    phone,
    password: hashedPassword,
    avatar
  })

  // 4. 查询用户信息（不含密码）
  const user = await userModel.findById(id)

  // 5. 生成 token（新用户默认 role='user'）
  const token = generateToken(id, 'user')

  return { token, user }
}

/**
 * 用户登录
 * @param {Object} data - { phone, password }
 * @returns {Promise<Object>} { token, user }
 */
async function login({ phone, password }) {
  // 1. 查询用户
  const user = await userModel.findByPhone(phone)
  if (!user) {
    throw { code: 400, message: '手机号未注册' }
  }

  // 2. 验证密码
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw { code: 400, message: '密码错误' }
  }

  // 3. 生成 token（携带用户角色）
  const token = generateToken(user.id, user.role || 'user')

  // 4. 返回用户信息（不含密码）
  const userInfo = await userModel.findById(user.id)

  return { token, user: userInfo }
}

/**
 * 获取用户资料
 * @param {number} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息
 */
async function getProfile(userId) {
  const user = await userModel.findById(userId)
  if (!user) {
    throw { code: 404, message: '用户不存在' }
  }
  return user
}

/**
 * 更新用户资料
 * @param {number} userId - 用户 ID
 * @param {Object} data - { nickname?, avatar? }
 * @returns {Promise<Object>} 更新后的用户信息
 */
async function updateProfile(userId, data) {
  // 校验昵称
  if (data.nickname !== undefined) {
    if (!data.nickname || data.nickname.length < 2 || data.nickname.length > 20) {
      throw { code: 400, message: '昵称需在2-20个字符之间' }
    }
  }
  await userModel.updateProfile(userId, data)
  // 返回最新资料
  return await userModel.findById(userId)
}

module.exports = { register, login, getProfile, updateProfile }
