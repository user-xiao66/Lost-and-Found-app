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
 * @returns {string} JWT token 字符串
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
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

  // 5. 生成 token
  const token = generateToken(id)

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

  // 3. 生成 token
  const token = generateToken(user.id)

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

module.exports = { register, login, getProfile }
