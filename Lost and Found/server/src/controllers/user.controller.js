/**
 * 用户控制器
 * 处理用户相关的 HTTP 请求，调用 service 层处理业务逻辑
 */

const userService = require('../services/user.service')
const { success, error } = require('../utils/response')

/**
 * 用户注册
 * POST /api/users/register
 */
async function register(req, res) {
  try {
    const { nickname, phone, password, avatar } = req.body

    // 校验必填字段
    if (!nickname || !phone || !password) {
      return res.json(error(400, '昵称、手机号和密码不能为空'))
    }

    // 校验手机号格式
    if (!/^1\d{10}$/.test(phone)) {
      return res.json(error(400, '手机号格式不正确'))
    }

    // 校验密码长度
    if (password.length < 6 || password.length > 20) {
      return res.json(error(400, '密码长度需在 6-20 位之间'))
    }

    const data = await userService.register({ nickname, phone, password, avatar })
    res.json(success(data, '注册成功'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '注册失败'))
  }
}

/**
 * 用户登录
 * POST /api/users/login
 */
async function login(req, res) {
  try {
    const { phone, password } = req.body

    // 校验必填字段
    if (!phone || !password) {
      return res.json(error(400, '手机号和密码不能为空'))
    }

    const data = await userService.login({ phone, password })
    res.json(success(data, '登录成功'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '登录失败'))
  }
}

/**
 * 获取用户资料
 * GET /api/users/profile
 */
async function getProfile(req, res) {
  try {
    const user = await userService.getProfile(req.userId)
    res.json(success(user))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取资料失败'))
  }
}

module.exports = { register, login, getProfile }
