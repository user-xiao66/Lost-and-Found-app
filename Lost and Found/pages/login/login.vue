<!--
  登录页面
  页面路径：/pages/login/login
  使用 Vue 3 Composition API + uni-app 组件
-->
<template>
  <view class="login-page">
    <!-- 头部装饰区域 -->
    <view class="header-area">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-title">失物招领</text>
      <text class="app-subtitle">校园物品找回助手</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-area">
      <view class="form-item">
        <text class="label">手机号</text>
        <input
          class="input"
          v-model="phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-style="color: #CCCCCC"
        />
      </view>

      <view class="form-item">
        <text class="label">密码</text>
        <input
          class="input"
          v-model="password"
          type="password"
          maxlength="20"
          placeholder="请输入密码（6-20位）"
          placeholder-style="color: #CCCCCC"
        />
      </view>

      <!-- 登录按钮 -->
      <button
        class="login-btn"
        :class="{ disabled: !canSubmit || loading }"
        :disabled="!canSubmit || loading"
        :loading="loading"
        @click="handleLogin"
      >
        {{ loading ? '登录中...' : '登录' }}
      </button>

      <!-- 注册入口 -->
      <view class="register-link" @click="goRegister">
        没有账号？<text class="link-text">去注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/user.js'

// 引入 Pinia 用户 store
const userStore = useUserStore()

// ==================== 表单数据 ====================

// 手机号
const phone = ref('')
// 密码
const password = ref('')
// 登录中状态（防重复提交）
const loading = ref(false)

// ==================== 计算属性 ====================

// 是否可以提交（手机号 11 位 + 密码 6-20 位）
const canSubmit = computed(() => {
  return phone.value.length === 11 && password.value.length >= 6 && password.value.length <= 20
})

// ==================== 方法 ====================

/**
 * 处理登录
 * 调 Pinia store 的 loginAction，成功后跳转首页
 */
async function handleLogin() {
  if (!canSubmit.value || loading.value) return

  // 手机号格式校验
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }

  loading.value = true
  try {
    // 调用登录 API
    await userStore.loginAction({
      phone: phone.value,
      password: password.value
    })
    uni.showToast({ title: '登录成功', icon: 'success' })
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (err) {
    console.error('登录失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到注册页
 */
function goRegister() {
  uni.navigateTo({ url: '/pages/register/register' })
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.login-page {
  min-height: 100vh;
  background-color: #F5F6FA;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
}

/* ==================== 头部区域 ==================== */
.header-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.logo {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 24rpx;
}

.app-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 12rpx;
}

.app-subtitle {
  font-size: 26rpx;
  color: #999999;
}

/* ==================== 表单区域 ==================== */
.form-area {
  width: 630rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.form-item {
  margin-bottom: 32rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 12rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  background-color: #FAFAFA;
}

/* ==================== 登录按钮 ==================== */
.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #4A90D9;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
  margin-top: 20rpx;
}

.login-btn.disabled {
  background-color: #B0C8E0;
}

/* ==================== 注册入口 ==================== */
.register-link {
  text-align: center;
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #999999;
}

.link-text {
  color: #4A90D9;
}
</style>
