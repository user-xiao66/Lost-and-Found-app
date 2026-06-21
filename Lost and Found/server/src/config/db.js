/**
 * 数据库连接配置模块
 * 使用 mysql2 连接池管理 MySQL 连接，支持自动重试
 */

// 引入 mysql2 的 promise 版本
const mysql = require('mysql2/promise')

// 数据库连接配置（根据本地环境修改）
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', // 数据库地址
  port: process.env.DB_PORT || 3306, // 数据库端口
  user: process.env.DB_USER || 'root', // 数据库用户名
  password: process.env.DB_PASSWORD || '123456', // 数据库密码
  database: process.env.DB_NAME || 'lost_and_found', // 数据库名称
  waitForConnections: true, // 连接池满时等待
  connectionLimit: 10, // 最大连接数
  queueLimit: 0, // 队列上限（0 表示无上限）
  charset: 'utf8mb4' // 字符集
}

// 创建连接池
const pool = mysql.createPool(dbConfig)

// 测试连接的定时器引用
let retryTimer = null

/**
 * 测试数据库连接
 * 连接失败时自动重试（每 5 秒一次）
 */
async function testConnection(retry = true) {
  try {
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()
    console.log('✅ 数据库连接成功')
    // 清除重试定时器
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    if (retry) {
      console.log('⏳ 5 秒后自动重试...')
      retryTimer = setTimeout(() => testConnection(true), 5000)
    }
  }
}

// 启动时测试连接
testConnection()

/**
 * 执行 SQL 查询的封装函数
 * 提供统一的数据库访问入口
 *
 * @param {string} sql - SQL 语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

module.exports = { pool, query }
