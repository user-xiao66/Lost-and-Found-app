<!--
  个人中心
  页面路径：/pages/profile/profile
  TabBar 页面，用户信息展示 + 操作菜单
-->
<template>
  <view class="profile-page">
    <scroll-view class="profile-scroll" scroll-y>
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="avatar-wrap">
          <text class="avatar-text">👤</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ userStore.userInfo?.nickname || '用户' }}</text>
          <text class="user-phone">{{ userStore.userInfo?.phone || '' }}</text>
        </view>
        <text class="edit-link" @click="goSettings">⚙️</text>
      </view>

      <!-- 统计数据 -->
      <view class="stats-row">
        <view class="stat-item" @click="goMyLost">
          <text class="stat-num">{{ stats.myLostCount }}</text>
          <text class="stat-label">我的失物</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goMyFound">
          <text class="stat-num">{{ stats.myFoundCount }}</text>
          <text class="stat-label">我的招领</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goNotifications">
          <text class="stat-num">{{ stats.unreadNotif }}</text>
          <text class="stat-label">未读通知</text>
        </view>
      </view>

      <!-- 操作菜单 -->
      <view class="menu-section">
        <view class="menu-item" @click="goMyLost">
          <text class="menu-icon">📋</text>
          <text class="menu-text">我发布的失物</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goMyFound">
          <text class="menu-icon">📦</text>
          <text class="menu-text">我发布的招领</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goNotifications">
          <text class="menu-icon">🔔</text>
          <text class="menu-text">匹配通知</text>
          <view class="menu-right">
            <text v-if="stats.unreadNotif > 0" class="badge">{{ stats.unreadNotif }}</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        <view class="menu-item" @click="goSettings">
          <text class="menu-icon">⚙️</text>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-area">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </view>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { getMyItems } from '@/api/item.js'
import { getUnreadCount } from '@/api/notification.js'

const userStore = useUserStore()

// ==================== 统计数据 ====================
const stats = ref({
  myLostCount: 0,
  myFoundCount: 0,
  unreadNotif: 0
})

/**
 * 页面显示时加载统计数据
 */
onShow(async () => {
  try {
    // 并行加载三项统计数据
    const [lostRes, foundRes, unreadRes] = await Promise.all([
      getMyItems({ status: '', page_size: 1 }),     // 全部失物
      getMyItems({ status: '', page_size: 1 }),     // 全部招领
      getUnreadCount().catch(() => ({ count: 0 }))  // 未读通知
    ])

    // 根据 type 筛选（后端 getMyItems 返回当前用户全部物品）
    stats.value.myLostCount = lostRes.total || 0
    stats.value.myFoundCount = foundRes.total || 0
    stats.value.unreadNotif = unreadRes.count || 0
  } catch (err) {
    console.error('加载统计失败:', err)
  }
})

// ==================== 导航 ====================

// 导航到"我的发布"页面
function goMyLost() { uni.navigateTo({ url: '/pages/mine/mine?type=lost' }) }
function goMyFound() { uni.navigateTo({ url: '/pages/mine/mine?type=found' }) }

function goNotifications() {
  uni.navigateTo({ url: '/pages/notifications/notifications' })
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/settings' })
}

// ==================== 退出登录 ====================

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
.profile-page {
  height: 100vh;
  background-color: #F5F6FA;
}

.profile-scroll {
  height: 100%;
}

/* ==================== 用户卡片 ==================== */
.user-card {
  display: flex;
  align-items: center;
  background-color: #4A90D9;
  padding: 48rpx 32rpx 40rpx 32rpx;
}

.avatar-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.avatar-text {
  font-size: 56rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  display: block;
  margin-bottom: 8rpx;
}

.user-phone {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-link {
  font-size: 40rpx;
  color: rgba(255, 255, 255, 0.7);
  padding: 8rpx;
}

/* ==================== 统计行 ==================== */
.stats-row {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  margin: -20rpx 24rpx 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999999;
}

.stat-divider {
  width: 1rpx;
  background-color: #F0F0F0;
  align-self: stretch;
  margin: 8rpx 0;
}

/* ==================== 操作菜单 ==================== */
.menu-section {
  background-color: #FFFFFF;
  margin: 0 24rpx 20rpx 24rpx;
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
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 48rpx;
  text-align: center;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #CCCCCC;
  margin-left: 12rpx;
}

.menu-right {
  display: flex;
  align-items: center;
}

/* 未读红点徽章 */
.badge {
  background-color: #E74C3C;
  color: #FFFFFF;
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  margin-right: 8rpx;
  min-width: 36rpx;
  text-align: center;
}

/* ==================== 退出登录 ==================== */
.logout-area {
  padding: 32rpx 24rpx;
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
