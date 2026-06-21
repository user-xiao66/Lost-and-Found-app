<!--
  注册页面
  页面路径：/pages/register/register
  使用 Vue 3 Composition API + uni-app 组件
-->
<template>
  <view class="register-page">
    <!-- 头部区域 -->
    <view class="header-area">
      <text class="app-title">创建账号</text>
      <text class="app-subtitle">注册失物招领，找回遗失的美好</text>
    </view>

    <!-- 注册表单 -->
    <view class="form-area">
      <!-- 昵称 -->
      <view class="form-item">
        <text class="label">昵称</text>
        <input
          class="input"
          v-model="nickname"
          maxlength="20"
          placeholder="请输入昵称（2-20字符）"
          placeholder-style="color: #CCCCCC"
        />
      </view>

      <!-- 手机号 -->
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

      <!-- 密码 -->
      <view class="form-item">
        <text class="label">密码</text>
        <input
          class="input"
          v-model="password"
          type="password"
          maxlength="20"
          placeholder="6-20位，需包含字母和数字"
          placeholder-style="color: #CCCCCC"
        />
      </view>

      <!-- 确认密码 -->
      <view class="form-item">
        <text class="label">确认密码</text>
        <input
          class="input"
          v-model="confirmPassword"
          type="password"
          maxlength="20"
          placeholder="请再次输入密码"
          placeholder-style="color: #CCCCCC"
        />
        <!-- 密码不一致提示 -->
        <text v-if="confirmPassword && password !== confirmPassword" class="error-msg">
          两次密码输入不一致
        </text>
      </view>

      <!-- 注册按钮 -->
      <button
        class="register-btn"
        :class="{ disabled: !canSubmit || loading }"
        :disabled="!canSubmit || loading"
        :loading="loading"
        @click="handleRegister"
      >
        {{ loading ? '注册中...' : '注册' }}
      </button>

      <!-- 登录入口 -->
      <view class="login-link" @click="goLogin">
        已有账号？<text class="link-text">去登录</text>
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

// 昵称
const nickname = ref('')
// 手机号
const phone = ref('')
// 密码
const password = ref('')
// 确认密码
const confirmPassword = ref('')
// 注册中状态（防重复提交）
const loading = ref(false)

// ==================== 计算属性 ====================

// 是否可以提交（所有字段通过校验）
const canSubmit = computed(() => {
  return (
    nickname.value.length >= 2 &&
    nickname.value.length <= 20 &&
    phone.value.length === 11 &&
    /^1\d{10}$/.test(phone.value) &&
    password.value.length >= 6 &&
    password.value.length <= 20 &&
    /[a-zA-Z]/.test(password.value) &&
    /\d/.test(password.value) &&
    password.value === confirmPassword.value
  )
})

// ==================== 方法 ====================

/**
 * 处理注册
 * 调 Pinia store 的 registerAction，成功后跳转首页
 */
async function handleRegister() {
  if (!canSubmit.value || loading.value) return

  loading.value = true
  try {
    // 调用注册 API（成功后自动登录）
    await userStore.registerAction({
      nickname: nickname.value,
      phone: phone.value,
      password: password.value
    })
    uni.showToast({ title: '注册成功', icon: 'success' })
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (err) {
    console.error('注册失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 跳转到登录页
 */
function goLogin() {
  uni.navigateBack()
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.register-page {
  min-height: 100vh;
  background-color: #F5F6FA;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80rpx;
}

/* ==================== 头部区域 ==================== */
.header-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
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
  margin-bottom: 28rpx;
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

/* 校验错误提示 */
.error-msg {
  font-size: 24rpx;
  color: #E74C3C;
  margin-top: 8rpx;
}

/* ==================== 注册按钮 ==================== */
.register-btn {
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

.register-btn.disabled {
  background-color: #B0C8E0;
}

/* ==================== 登录入口 ==================== */
.login-link {
  text-align: center;
  margin-top: 32rpx;
  font-size: 26rpx;
  color: #999999;
}

.link-text {
  color: #4A90D9;
}
</style>
