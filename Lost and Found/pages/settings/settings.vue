<!--
  设置页
  页面路径：/pages/settings/settings
  退出登录 + 清除缓存 + 关于信息
-->
<template>
  <view class="settings-page">
    <scroll-view class="settings-scroll" scroll-y>
      <!-- 账号相关 -->
      <view class="section-title">账号</view>
      <view class="menu-section">
        <view class="menu-item" @click="goProfile">
          <text class="menu-icon">👤</text>
          <text class="menu-text">个人信息</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="handleClearCache">
          <text class="menu-icon">🗑️</text>
          <text class="menu-text">清除缓存</text>
          <text class="menu-value">{{ cacheSize }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 关于 -->
      <view class="section-title">关于</view>
      <view class="menu-section">
        <view class="menu-item" @click="showAbout">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-text">关于失物招领</text>
          <text class="menu-value">v1.0.0</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-area">
        <button class="logout-btn" @click="handleLogout">
          退出登录
        </button>
      </view>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()

// ==================== 缓存大小（模拟） ====================
const cacheSize = ref('0.2MB')

// ==================== 操作 ====================

function goProfile() {
  uni.switchTab({ url: '/pages/profile/profile' })
}

function handleClearCache() {
  uni.showModal({
    title: '清除缓存',
    content: '将清除图片缓存和临时文件',
    success: (res) => {
      if (res.confirm) {
        cacheSize.value = '0KB'
        uni.showToast({ title: '缓存已清除', icon: 'success' })
      }
    }
  })
}

function showAbout() {
  uni.showModal({
    title: '关于失物招领',
    content: '失物招领 — 校园物品找回助手\n\n版本：1.0.0\n\n技术栈：Vue3 + uni-app + Node.js + MySQL\n\n移动应用开发课程设计项目',
    showCancel: false,
    confirmText: '知道了'
  })
}

function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出登录吗？',
    confirmText: '退出',
    confirmColor: '#E74C3C',
    success: (res) => {
      if (res.confirm) {
        userStore.logoutAction()
        uni.showToast({ title: '已退出', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/login' })
        }, 500)
      }
    }
  })
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.settings-page {
  height: 100vh;
  background-color: #F5F6FA;
}

.settings-scroll {
  height: 100%;
}

/* ==================== 区块标题 ==================== */
.section-title {
  font-size: 24rpx;
  color: #999999;
  padding: 28rpx 24rpx 12rpx 24rpx;
}

/* ==================== 菜单区 ==================== */
.menu-section {
  background-color: #FFFFFF;
  margin: 0 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  width: 44rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.menu-value {
  font-size: 26rpx;
  color: #BBBBBB;
  margin-right: 8rpx;
}

.menu-arrow {
  font-size: 32rpx;
  color: #CCCCCC;
}

/* ==================== 退出登录 ==================== */
.logout-area {
  padding: 60rpx 24rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #FFFFFF;
  color: #E74C3C;
  font-size: 30rpx;
  border-radius: 12rpx;
  border: 1px solid #FDEDEC;
}

/* ==================== 底部安全区 ==================== */
.bottom-safe {
  height: 40rpx;
}
</style>
