/**
 * JWT 认证中间件
 * 从请求头解析 token 并验证用户身份
 */

const jwt = require('jsonwebtoken')

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'lost_and_found_secret_key_2026'

/**
 * 认证中间件
 * 验证请求头中的 Bearer token，将 userId 和 role 挂载到 req
 */
function auth(req, res, next) {
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
    req.userId = decoded.userId   // 将用户 ID 挂载到请求对象
    req.userRole = decoded.role || 'user'  // 挂载角色，默认 user
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
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.userId = decoded.userId
      req.userRole = decoded.role || 'user'
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
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ code: 401, message: '未登录', data: null })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)

    // 检查是否为管理员
    if (decoded.role !== 'admin') {
      return res.json({ code: 403, message: '无权限，仅管理员可操作', data: null })
    }

    req.userId = decoded.userId
    req.userRole = decoded.role
    next()
  } catch (error) {
    return res.json({ code: 401, message: 'token 无效或已过期', data: null })
  }
}

module.exports = { auth, optionalAuth, adminAuth, JWT_SECRET }
