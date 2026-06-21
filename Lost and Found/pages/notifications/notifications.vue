<!--
  通知列表页
  页面路径：/pages/notifications/notifications
  展示匹配通知 + 未读/已读区分 + 点击跳详情/标记已读
-->
<template>
  <view class="notif-page">
    <scroll-view
      class="notif-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      :show-scrollbar="false"
    >
      <!-- 骨架屏 -->
      <view v-if="firstLoading" class="skeleton-area">
        <view v-for="i in 3" :key="i" class="skeleton-item">
          <view class="skeleton-icon"></view>
          <view class="skeleton-body">
            <view class="skeleton-line long"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 通知列表 -->
      <template v-else>
        <view
          v-for="n in notifList"
          :key="n.id"
          class="notif-card"
          :class="{ unread: n.is_read === 0 }"
          @click="handleNotifClick(n)"
        >
          <!-- 未读指示点 -->
          <view v-if="n.is_read === 0" class="unread-dot"></view>

          <view class="notif-content">
            <!-- 匹配信息 -->
            <view class="notif-title">
              <text class="match-emoji">🎯</text>
              <text class="match-text">物品匹配提醒</text>
            </view>

            <!-- 双方物品 -->
            <view class="match-pair">
              <view class="match-side">
                <text class="match-side-label">失物</text>
                <text class="match-side-name">{{ n.lost_item_name || '未知' }}</text>
              </view>
              <view class="match-connect">
                <text class="connect-line"></text>
                <text class="connect-score">{{ n.match_score }}分</text>
                <text class="connect-line"></text>
              </view>
              <view class="match-side">
                <text class="match-side-label">招领</text>
                <text class="match-side-name">{{ n.found_item_name || '未知' }}</text>
              </view>
            </view>

            <!-- 时间和状态 -->
            <view class="notif-footer">
              <text class="notif-time">{{ formatTime(n.created_at) }}</text>
              <text v-if="n.is_read === 0" class="read-tag">未读</text>
              <text v-else class="read-tag done">已读</text>
            </view>
          </view>

          <text class="notif-arrow">›</text>
        </view>

        <!-- 加载更多 -->
        <view v-if="loading" class="load-more">
          <text class="load-text">加载中...</text>
        </view>

        <!-- 没有更多了 -->
        <view v-if="!hasMore && notifList.length > 0" class="load-more">
          <text class="load-text">— 已经到底了 —</text>
        </view>

        <!-- 空状态 -->
        <EmptyState
          v-if="!firstLoading && notifList.length === 0"
          message="暂无匹配通知"
        />
      </template>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { getList, markAsRead } from '@/api/notification.js'
import EmptyState from '@/components/EmptyState.vue'

// ==================== 状态 ====================
const notifList = ref([])
const page = ref(1)
const firstLoading = ref(true)
const loading = ref(false)
const hasMore = ref(true)
const PAGE_SIZE = 10

// ==================== 初始化 ====================
loadNotifs()

async function loadNotifs() {
  try {
    const result = await getList({
      page: page.value,
      page_size: PAGE_SIZE
    })

    if (page.value === 1) {
      notifList.value = result.list || []
    } else {
      notifList.value = [...notifList.value, ...(result.list || [])]
    }

    hasMore.value = notifList.value.length < result.total
  } catch (err) {
    console.error('加载通知失败:', err)
  } finally {
    firstLoading.value = false
  }
}

/**
 * 触底加载更多
 */
async function onLoadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  page.value++
  await loadNotifs()
  loading.value = false
}

/**
 * 点击通知：标记已读 + 跳转到失物详情
 * @param {Object} notif - 通知对象
 */
async function handleNotifClick(notif) {
  // 标记已读（如果未读）
  if (notif.is_read === 0) {
    try {
      await markAsRead(notif.id)
      // 更新本地状态
      notif.is_read = 1
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  }

  // 跳转到失物详情（通常看对方物品）
  uni.navigateTo({ url: `/pages/detail/detail?id=${notif.lost_item_id}` })
}

/**
 * 格式化时间
 */
function formatTime(timeStr) {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const now = new Date()
  const diff = now - d

  // 1小时内显示"xx分钟前"
  if (diff < 3600000) {
    const min = Math.floor(diff / 60000)
    return min <= 0 ? '刚刚' : `${min}分钟前`
  }
  // 今天显示时间
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  // 显示日期
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.notif-page {
  height: 100vh;
  background-color: #F5F6FA;
}

.notif-scroll {
  height: 100%;
  padding: 20rpx 24rpx;
}

/* ==================== 骨架屏 ==================== */
.skeleton-area {
  padding: 0;
}

.skeleton-item {
  display: flex;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.skeleton-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-right: 20rpx;
}

.skeleton-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16rpx;
}

.skeleton-line {
  height: 24rpx;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.long { width: 70%; }
.skeleton-line.short { width: 40%; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ==================== 通知卡片 ==================== */
.notif-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  position: relative;
}

/* 未读状态左侧蓝色边框 */
.notif-card.unread {
  box-shadow: 0 2rpx 12rpx rgba(74, 144, 217, 0.1);
}

/* 未读指示小圆点 */
.unread-dot {
  position: absolute;
  top: 50%;
  left: -6rpx;
  transform: translateY(-50%);
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #4A90D9;
}

/* ==================== 通知内容 ==================== */
.notif-content {
  flex: 1;
}

.notif-title {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.match-emoji {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.match-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

/* ==================== 匹配物品对 ==================== */
.match-pair {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16rpx;
}

.match-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.match-side-label {
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 4rpx;
}

.match-side-name {
  font-size: 26rpx;
  color: #333333;
  font-weight: 500;
  text-align: center;
}

.match-connect {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 12rpx;
}

.connect-line {
  width: 40rpx;
  height: 1rpx;
  background-color: #E0E0E0;
}

.connect-score {
  font-size: 22rpx;
  color: #4A90D9;
  font-weight: bold;
  padding: 4rpx 0;
}

/* ==================== 底部信息 ==================== */
.notif-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-time {
  font-size: 22rpx;
  color: #BBBBBB;
}

.read-tag {
  font-size: 22rpx;
  color: #4A90D9;
  background-color: #E8F2FD;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
}

.read-tag.done {
  color: #999999;
  background-color: #F5F5F5;
}

.notif-arrow {
  font-size: 32rpx;
  color: #CCCCCC;
  margin-left: 8rpx;
}

/* ==================== 加载更多 ==================== */
.load-more {
  display: flex;
  justify-content: center;
  padding: 24rpx 0;
}

.load-text {
  font-size: 24rpx;
  color: #CCCCCC;
}

/* ==================== 底部安全区 ==================== */
.bottom-safe {
  height: 40rpx;
}
</style>
