/**
 * 用户状态管理（Pinia Store）
 * 管理登录状态：token、用户信息，提供登录/登出/获取资料等 action
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getProfile as getProfileApi } from '@/api/user.js'

// 创建用户 Store
export const useUserStore = defineStore('user', () => {
  // ==================== 状态 ====================

  // JWT token
  const token = ref(uni.getStorageSync('token') || '')
  // 用户信息
  const userInfo = ref(
    (() => {
      try {
        return JSON.parse(uni.getStorageSync('userInfo') || 'null')
      } catch {
        return null
      }
    })()
  )

  // ==================== 计算属性 ====================

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // ==================== 方法 ====================

  /**
   * 用户登录
   * @param {Object} data - { phone, password }
   */
  async function loginAction(data) {
    const result = await loginApi(data)
    // 保存 token 和用户信息
    token.value = result.token
    userInfo.value = result.user
    // 持久化到本地存储
    uni.setStorageSync('token', result.token)
    uni.setStorageSync('userInfo', JSON.stringify(result.user))
  }

  /**
   * 用户注册
   * @param {Object} data - { nickname, phone, password }
   */
  async function registerAction(data) {
    const result = await registerApi(data)
    // 注册成功后自动登录
    token.value = result.token
    userInfo.value = result.user
    // 持久化到本地存储
    uni.setStorageSync('token', result.token)
    uni.setStorageSync('userInfo', JSON.stringify(result.user))
  }

  /**
   * 拉取最新用户资料
   */
  async function fetchProfile() {
    const user = await getProfileApi()
    userInfo.value = user
    uni.setStorageSync('userInfo', JSON.stringify(user))
  }

  /**
   * 退出登录
   */
  function logoutAction() {
    // 清除状态
    token.value = ''
    userInfo.value = null
    // 清除本地存储
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    loginAction,
    registerAction,
    fetchProfile,
    logoutAction
  }
})
