<!--
  个人中心
  页面路径：/pages/profile/profile
  TabBar 页面，用户信息展示 + 操作菜单
-->
<template>
  <view class="profile-page">
    <scroll-view class="profile-scroll" scroll-y>
      <!-- 用户信息卡片 -->
      <view class="user-card" @click="showEditDialog">
        <view class="avatar-wrap">
          <image
            v-if="userStore.userInfo?.avatar && userStore.userInfo.avatar.startsWith('http')"
            :src="userStore.userInfo.avatar"
            class="avatar-image"
            mode="aspectFill"
          />
          <text v-else class="avatar-text">{{ userStore.userInfo?.avatar || '👤' }}</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ userStore.userInfo?.nickname || '用户' }}</text>
          <text class="user-phone">{{ userStore.userInfo?.phone || '' }}</text>
        </view>
        <text class="edit-link">✏️</text>
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
        <!-- 管理员专属入口 -->
        <view v-if="userStore.isAdmin" class="menu-item admin-menu" @click="goAdmin">
          <text class="menu-icon">🛡️</text>
          <text class="menu-text">管理面板</text>
          <text class="menu-arrow">›</text>
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

    <!-- 编辑资料弹窗 -->
    <view v-if="editVisible" class="dialog-mask" @click="editVisible = false">
      <view class="dialog-box" @click.stop>
        <text class="dialog-title">编辑资料</text>

        <view class="dialog-row">
          <text class="dialog-label">昵称</text>
          <input
            class="dialog-input"
            v-model="editNickname"
            maxlength="20"
            placeholder="2-20个字符"
            placeholder-style="color: #CCCCCC"
            :focus="editFocus === 'nickname'"
            @focus="editFocus = 'nickname'"
          />
        </view>

        <view class="dialog-row">
          <text class="dialog-label">头像</text>
          <view class="avatar-picker" @click="pickAvatar">
            <image
              v-if="editAvatar && editAvatar.startsWith('http')"
              :src="editAvatar"
              class="avatar-img-preview"
              mode="aspectFill"
            />
            <text v-else-if="editAvatar" class="avatar-preview">{{ editAvatar }}</text>
            <text v-else class="avatar-placeholder">点击选择头像</text>
            <text class="picker-arrow">›</text>
          </view>
          <!-- 快捷 emoji 头像 -->
          <view class="emoji-row">
            <text
              v-for="emoji in avatarOptions"
              :key="emoji"
              class="emoji-item"
              :class="{ selected: editAvatar === emoji }"
              @click="editAvatar = emoji"
            >{{ emoji }}</text>
          </view>
        </view>

        <view class="dialog-btns">
          <button class="dialog-cancel" @click="editVisible = false">取消</button>
          <button class="dialog-save" :disabled="!editNickname || saving" :loading="saving" @click="saveProfile">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user.js'
import { getMyItems } from '@/api/item.js'
import { getUnreadCount } from '@/api/notification.js'
import { uploadImages } from '@/api/item.js'

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
      getMyItems({ type: 'lost', page_size: 1 }),   // 我的失物数量
      getMyItems({ type: 'found', page_size: 1 }),  // 我的招领数量
      getUnreadCount().catch(() => ({ count: 0 }))  // 未读通知
    ])

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

function goAdmin() {
  uni.navigateTo({ url: '/pages/admin/items' })
}

// ==================== 编辑资料 ====================
const editVisible = ref(false)
const editNickname = ref('')
const editAvatar = ref('')
const editFocus = ref('')
const saving = ref(false)

const avatarOptions = ['👤', '😊', '😎', '🐱', '🐶', '🦊', '🐼', '🐨', '🌟', '🎓', '💼', '🏀']

function showEditDialog() {
  editNickname.value = userStore.userInfo?.nickname || ''
  editAvatar.value = userStore.userInfo?.avatar || ''
  editFocus.value = 'nickname'
  editVisible.value = true
}

function pickAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      // 上传到服务器
      uni.showLoading({ title: '上传中...' })
      uploadImages([tempPath]).then(urls => {
        uni.hideLoading()
        if (urls.length > 0) {
          editAvatar.value = urls[0] // 使用上传后的完整 URL
        }
      }).catch(() => {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'none' })
      })
    }
  })
}

async function saveProfile() {
  if (!editNickname.value || editNickname.value.length < 2) {
    uni.showToast({ title: '昵称至少2个字符', icon: 'none' })
    return
  }
  saving.value = true
  try {
    await userStore.updateProfileAction({
      nickname: editNickname.value,
      avatar: editAvatar.value
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
    editVisible.value = false
  } catch (err) {
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
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

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
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

/* 管理员菜单高亮 */
.admin-menu {
  background-color: #FDF8E8;
}

.admin-menu .menu-text {
  color: #B8961A;
  font-weight: 600;
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

/* ==================== 编辑资料弹窗 ==================== */
.dialog-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-box {
  width: 600rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 40rpx 32rpx 32rpx 32rpx;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  text-align: center;
  margin-bottom: 36rpx;
}

.dialog-row {
  margin-bottom: 28rpx;
}

.dialog-label {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 12rpx;
  display: block;
}

.dialog-input {
  width: 100%;
  height: 80rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background-color: #FAFAFA;
}

.avatar-picker {
  display: flex;
  align-items: center;
  height: 80rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background-color: #FAFAFA;
}

.avatar-preview {
  font-size: 40rpx;
}

.avatar-placeholder {
  font-size: 28rpx;
  color: #CCCCCC;
}

.picker-arrow {
  margin-left: auto;
  font-size: 28rpx;
  color: #CCCCCC;
}

.avatar-img-preview {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
}

/* emoji 快捷选择 */
.emoji-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.emoji-item {
  font-size: 40rpx;
  padding: 8rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.emoji-item.selected {
  border-color: #4A90D9;
  background-color: #E8F2FD;
}

.dialog-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}

.dialog-cancel {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #F5F6FA;
  color: #666666;
  font-size: 28rpx;
  border-radius: 12rpx;
  border: none;
}

.dialog-save {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  background-color: #4A90D9;
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}
</style>
