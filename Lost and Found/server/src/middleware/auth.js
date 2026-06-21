/**
 * JWT 认证中间件
 * 从请求头解析 token 并验证用户身份
 */

const jwt = require('jsonwebtoken')

// JWT 密钥（生产环境应从环境变量读取）
const JWT_SECRET = process.env.JWT_SECRET || 'lost_and_found_secret_key_2026'

/**
 * 认证中间件
 * 验证请求头中的 Bearer token，将 userId 挂载到 req.userId
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
    req.userId = decoded.userId // 将用户 ID 挂载到请求对象
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
 * 有 token 则注入 userId，无 token 则继续（不拦截）
 * 用于列表/详情等公开接口，让 service 层自行决定是否脱敏
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      req.userId = decoded.userId // 注入 userId
    } catch (error) {
      // token 无效也不拦截，仅不注入 userId
    }
  }
  next()
}

module.exports = { auth, optionalAuth, JWT_SECRET }
