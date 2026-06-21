/**
 * 路由入口文件
 * 集中挂载所有业务路由模块，遵循 RESTful 规范
 */

const express = require('express')
const router = express.Router()

// 引入控制器
const userController = require('../controllers/user.controller')
const itemController = require('../controllers/item.controller')
const notificationController = require('../controllers/notification.controller')
const matchController = require('../controllers/match.controller')

// 引入认证中间件
const { auth, optionalAuth } = require('../middleware/auth')

// 引入上传中间件
const upload = require('../middleware/upload')

// ==================== 用户路由 ====================

// 注册：POST /api/users/register（公开）
router.post('/users/register', userController.register)

// 登录：POST /api/users/login（公开）
router.post('/users/login', userController.login)

// 获取用户资料：GET /api/users/profile（需登录）
router.get('/users/profile', auth, userController.getProfile)

// ==================== 物品路由 ====================

// 图片上传：POST /api/upload（需登录）
router.post('/upload', auth, upload.array('images', 4), (req, res) => {
  // multer 处理完成后，返回文件访问 URL 列表
  const urls = req.files.map(file => `/uploads/${file.filename}`)
  res.json({
    code: 200,
    message: '上传成功',
    data: { urls }
  })
})

// 发布物品：POST /api/items（需登录）
router.post('/items', auth, itemController.publish)

// 我的发布列表：GET /api/items/mine（需登录，必须在 /items/:id 之前注册）
router.get('/items/mine', auth, itemController.getMyItems)

// 物品列表（公开，可选登录以获取脱敏联系方式）：GET /api/items
router.get('/items', optionalAuth, itemController.getList)

// 物品详情（公开，可选登录以获取脱敏联系方式）：GET /api/items/:id
router.get('/items/:id', optionalAuth, itemController.getDetail)

// 物品的匹配推荐：GET /api/items/:id/matches（公开）
router.get('/items/:id/matches', optionalAuth, matchController.getMatches)

// 标记已找到/已关闭：PUT /api/items/:id/status（需登录）
router.put('/items/:id/status', auth, itemController.markAsFound)

// ==================== 通知路由 ====================

// 通知列表：GET /api/notifications（需登录）
router.get('/notifications', auth, notificationController.getList)

// 未读数量：GET /api/notifications/unread-count（需登录，必须先于 /:id 注册）
router.get('/notifications/unread-count', auth, notificationController.getUnreadCount)

// 标记已读：PUT /api/notifications/:id/read（需登录）
router.put('/notifications/:id/read', auth, notificationController.markAsRead)

module.exports = router
