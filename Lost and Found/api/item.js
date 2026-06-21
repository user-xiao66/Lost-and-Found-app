/**
 * 物品相关 API 接口封装
 * 包含物品列表、详情、发布、状态更新、我的发布
 */

import { get, post, put } from './request.js'

// ==================== 图片上传（原生 uni.uploadFile） ====================

/**
 * 上传图片
 * 使用 uni.uploadFile 而不是 uni.request，因为需要 multipart/form-data
 * @param {Array<string>} filePaths - 本地临时文件路径数组
 * @returns {Promise<Array<string>>} 服务器返回的 URL 数组
 */
export function uploadImages(filePaths) {
  return new Promise((resolve, reject) => {
    if (!filePaths || filePaths.length === 0) {
      resolve([])
      return
    }

    const token = uni.getStorageSync('token')
    let completed = 0
    const urls = []

    filePaths.forEach((path, index) => {
      uni.uploadFile({
        url: 'http://10.21.130.165:3000/api/upload',
        filePath: path,
        name: 'images',
        header: {
          Authorization: 'Bearer ' + token
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 200 && data.data.urls) {
              urls.push(...data.data.urls)
            }
          } catch (e) {
            console.error('上传响应解析失败:', e)
          }
        },
        fail: (err) => {
          console.error('上传失败:', err)
        },
        complete: () => {
          completed++
          if (completed === filePaths.length) {
            resolve(urls)
          }
        }
      })
    })
  })
}

// ==================== 物品 API ====================

/**
 * 查询物品列表（分页 + 多条件筛选）
 * @param {Object} params - { type?, keyword?, category?, location?, status?, page?, page_size? }
 * @returns {Promise<Object>} { list, total, page, page_size, total_pages }
 */
export function getList(params = {}) {
  return get('/items', params)
}

/**
 * 获取物品详情
 * @param {number} id - 物品 ID
 * @returns {Promise<Object>} 物品详情对象
 */
export function getDetail(id) {
  return get(`/items/${id}`)
}

/**
 * 发布物品信息
 * @param {Object} data - { type, name, category, location, occur_time, contact, description?, images? }
 * @returns {Promise<Object>} 创建后的物品对象
 */
export function publish(data) {
  return post('/items', data)
}

/**
 * 标记物品为已找到/已关闭
 * @param {number} id     - 物品 ID
 * @param {string} status - 'found' | 'closed'
 * @returns {Promise}
 */
export function markAsFound(id, status) {
  return put(`/items/${id}/status`, { status })
}

/**
 * 获取当前用户发布的物品（分页）
 * @param {Object} params - { status?, page?, page_size? }
 * @returns {Promise<Object>} { list, total, page, page_size, total_pages }
 */
export function getMyItems(params = {}) {
  return get('/items/mine', params)
}

/**
 * 获取物品的匹配推荐列表
 * @param {number} id - 物品 ID
 * @returns {Promise<Array>} 匹配记录数组
 */
export function getMatches(id) {
  return get(`/items/${id}/matches`)
}
