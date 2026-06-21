/**
 * 文件上传中间件
 * 使用 multer 处理图片上传，存储到 server/uploads/ 目录
 */

const multer = require('multer')
const path = require('path')

// 存储配置：保存到 uploads 目录，文件名用时间戳 + 随机数
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_随机数.扩展名
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
    cb(null, name)
  }
})

// 文件类型过滤：仅允许图片格式
function fileFilter(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('仅支持 JPG/PNG/GIF/WebP 格式的图片'), false)
  }
}

// 创建 multer 实例
// - 单次最多上传 4 张图片
// - 单张最大 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 4 // 最多 4 张
  }
})

/**
 * 上传多张图片的中间件
 * 表单字段名称为 "images"
 * 使用：app.post('/api/items', upload.array('images', 4), controller)
 */
module.exports = upload
