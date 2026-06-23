/**
 * JWT 认证中间件
 * 从请求头解析 token 并验证用户身份
 */

const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'lost_and_found_secret_key_2026'

/**
 * 认证中间件
 * 验证请求头中的 Bearer token，将 userId 和 role 挂载到 req
 */
async function auth(req, res, next) {
  // 从 Authorization 请求头获取 token
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({
      code: 401,
      message: '未登录或 token 已过期',
      data: null
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    // 验证 JWT token
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await userModel.findById(decoded.userId)
    if (!user) {
      return res.json({
        code: 401,
        message: '用户不存在或 token 已失效',
        data: null
      })
    }

    req.userId = user.id
    req.userRole = user.role || 'user'
    next()
  } catch (error) {
    return res.json({
      code: 401,
      message: 'token 无效或已过期',
      data: null
    })
  }
}

/**
 * 可选认证中间件
 * 有 token 则注入 userId + role，无 token 则继续（不拦截）
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await userModel.findById(decoded.userId)
      if (user) {
        req.userId = user.id
        req.userRole = user.role || 'user'
      }
    } catch (error) {
      // token 无效也不拦截，仅不注入
    }
  }
  next()
}

/**
 * 管理员认证中间件
 * 先验证 JWT，然后检查 role 是否为 admin
 * 用于：删除物品、强制关闭等管理员专属操作
 */
async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ code: 401, message: '未登录', data: null })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await userModel.findById(decoded.userId)

    // 检查是否为管理员
    if (!user || user.role !== 'admin') {
      return res.json({ code: 403, message: '无权限，仅管理员可操作', data: null })
    }

    req.userId = user.id
    req.userRole = user.role
    next()
  } catch (error) {
    return res.json({ code: 401, message: 'token 无效或已过期', data: null })
  }
}

module.exports = { auth, optionalAuth, adminAuth, JWT_SECRET }
