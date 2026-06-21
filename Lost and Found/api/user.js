/**
 * 用户相关 API 接口封装
 * 包含注册、登录、获取用户资料
 */

import { post, get } from './request.js'

/**
 * 用户注册
 * @param {Object} data - { nickname, phone, password }
 * @returns {Promise<Object>} { token, user }
 */
export function register(data) {
  return post('/users/register', data)
}

/**
 * 用户登录
 * @param {Object} data - { phone, password }
 * @returns {Promise<Object>} { token, user }
 */
export function login(data) {
  return post('/users/login', data)
}

/**
 * 获取当前登录用户的资料
 * @returns {Promise<Object>} 用户信息
 */
export function getProfile() {
  return get('/users/profile')
}
