/**
 * 失物招领 APP — Express 服务入口
 * 负责启动服务、挂载中间件、注册路由
 */

// 引入 Express 框架
const express = require('express')
// 引入 CORS 中间件，处理跨域请求
const cors = require('cors')
// 引入 body-parser，解析 JSON 请求体
const bodyParser = require('body-parser')
// 引入路由模块
const routes = require('./routes/index')

// 创建 Express 应用实例
const app = express()

// 端口号，优先使用环境变量，默认 3000
const PORT = process.env.PORT || 3000

// ==================== 全局中间件 ====================

// 启用 CORS，允许所有来源跨域访问
app.use(cors())

// 解析 JSON 格式的请求体，限制大小为 10mb
app.use(bodyParser.json({ limit: '10mb' }))
// 解析 URL 编码的请求体
app.use(bodyParser.urlencoded({ extended: true }))

// 托管上传文件静态资源
app.use('/uploads', express.static('uploads'))

// ==================== 路由挂载 ====================

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: { timestamp: new Date().toISOString() }
  })
})

// 挂载所有业务路由
app.use('/api', routes)

// ==================== 全局错误处理 ====================

// 404 处理中间件
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  })
})

// 全局异常捕获中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  })
})

// ==================== 启动服务 ====================

app.listen(PORT, () => {
  console.log(`✅ 失物招领后端服务已启动: http://localhost:${PORT}`)
  console.log(`📋 健康检查: http://localhost:${PORT}/api/health`)
})

module.exports = app
