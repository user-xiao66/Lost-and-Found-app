/**
 * 统一网络请求封装
 * 所有 HTTP 请求必须通过此模块，页面中禁止直接调用 uni.request
 *
 * 功能：
 * - 自动拼接 baseURL
 * - 自动注入 JWT token
 * - 响应拦截（code !== 200 时 toast 提示）
 * - Promise 风格返回
 */

// 后端 API 基地址（WiFi 重连后 IP 可能变化，在此更新）
// Android 模拟器：http://10.0.2.2:3000/api
// 浏览器开发：http://localhost:3000/api
const BASE_URL = 'http://10.108.250.60:3000/api'

/**
 * 发起 GET 请求
 * @param {string} url - 接口路径（不含 baseURL），如 '/items'
 * @param {Object} params - 查询参数（自动拼接为 query string）
 * @returns {Promise} 返回业务数据
 */
function get(url, params = {}) {
  // uni.request GET 不会自动拼接 query string，需手动构建
  const keys = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  if (keys.length > 0) {
    const qs = keys.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&')
    url = url + '?' + qs
  }
  return request('GET', url)
}

/**
 * 发起 POST 请求
 * @param {string} url - 接口路径
 * @param {Object} data - 请求体数据
 * @returns {Promise} 返回业务数据
 */
function post(url, data = {}) {
  return request('POST', url, data)
}

/**
 * 发起 PUT 请求
 * @param {string} url - 接口路径
 * @param {Object} data - 请求体数据
 * @returns {Promise} 返回业务数据
 */
function put(url, data = {}) {
  return request('PUT', url, data)
}

/**
 * 核心请求方法
 * @param {string} method - HTTP 方法
 * @param {string} url - 接口路径
 * @param {Object} data - 请求参数
 * @returns {Promise<Object>} 业务数据
 */
function request(method, url, data = {}) {
  return new Promise((resolve, reject) => {
    // 从本地存储获取 token
    const token = uni.getStorageSync('token')

    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        // 自动注入 token
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res) => {
        const { code, message, data: resData } = res.data

        // 响应拦截：非 200 为业务异常
        if (code !== 200) {
          uni.showToast({
            title: message || '请求失败',
            icon: 'none',
            duration: 2000
          })
          reject(new Error(message))
          return
        }

        // 返回业务数据
        resolve(resData)
      },
      fail: (err) => {
        // 网络异常处理
        uni.showToast({
          title: '网络异常，请检查网络连接',
          icon: 'none',
          duration: 2000
        })
        reject(err)
      }
    })
  })
}

export { get, post, put, BASE_URL }
