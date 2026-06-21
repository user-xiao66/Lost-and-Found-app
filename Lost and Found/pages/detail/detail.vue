<!--
  详情页
  页面路径：/pages/detail/detail
  图片轮播 + 物品信息 + 发布者联系 + 匹配推荐 + 标记已找到
-->
<template>
  <view class="detail-page">
    <scroll-view class="detail-scroll" scroll-y>
      <!-- ==================== 图片轮播 ==================== -->
      <view class="swiper-area">
        <swiper
          v-if="item.images && item.images.length > 0"
          class="swiper"
          indicator-dots
          indicator-color="rgba(255,255,255,0.5)"
          indicator-active-color="#FFFFFF"
          autoplay
          circular
        >
          <swiper-item v-for="(img, index) in parsedImages" :key="index">
            <image :src="img" mode="aspectFill" class="swiper-img" />
          </swiper-item>
        </swiper>

        <!-- 无图片时的占位 -->
        <view v-else class="no-image">
          <text class="no-image-text">{{ item.type === 'lost' ? '🔍' : '📦' }}</text>
          <text class="no-image-label">暂无图片</text>
        </view>
      </view>

      <!-- ==================== 物品基本信息 ==================== -->
      <view class="info-section">
        <!-- 标题行：名称 + 状态 -->
        <view class="title-row">
          <text class="item-name">{{ item.name }}</text>
          <StatusBadge :status="item.status" />
        </view>

        <!-- 类型标签 -->
        <view class="tag-row">
          <text class="type-tag" :class="'tag-' + item.type">
            {{ item.type === 'lost' ? '失物' : '招领' }}
          </text>
          <text class="category-tag">{{ item.category || '其他' }}</text>
        </view>

        <!-- 详细信息 -->
        <view class="info-list">
          <view class="info-item">
            <text class="info-label">地点</text>
            <text class="info-value">{{ item.location }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">时间</text>
            <text class="info-value">{{ formatFullTime(item.occur_time) }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">发布时间</text>
            <text class="info-value">{{ formatFullTime(item.created_at) }}</text>
          </view>
        </view>

        <!-- 详细描述 -->
        <view v-if="item.description" class="desc-area">
          <text class="desc-label">详细描述</text>
          <text class="desc-text">{{ item.description }}</text>
        </view>
      </view>

      <!-- ==================== 发布者信息 ==================== -->
      <view class="info-section">
        <text class="section-title">发布者信息</text>
        <view class="publisher-row">
          <view class="avatar-placeholder">👤</view>
          <view class="publisher-info">
            <text class="publisher-name">{{ item.user_nickname || '用户' }}</text>
            <text class="publisher-contact">{{ item.contact }}</text>
          </view>
        </view>

        <!-- 联系方式操作按钮 -->
        <view class="contact-actions">
          <button class="action-btn" @click="copyContact">
            <text class="action-icon">📋</text>
            <text class="action-text">一键复制</text>
          </button>
          <button
            v-if="isPhoneNumber"
            class="action-btn call-btn"
            @click="callContact"
          >
            <text class="action-icon">📞</text>
            <text class="action-text">拨打电话</text>
          </button>
        </view>
      </view>

      <!-- ==================== 匹配推荐 ==================== -->
      <view v-if="matches.length > 0" class="info-section match-section">
        <text class="section-title">
          匹配推荐
          <text class="match-hint">以下信息可能与你相关</text>
        </text>

        <view
          v-for="m in matches"
          :key="m.id"
          class="match-card"
          @click="goDetail(matchItemId(m))"
        >
          <view class="match-card-left">
            <text class="match-item-name">{{ matchItemName(m) }}</text>
            <text class="match-item-location">{{ matchItemLocation(m) }}</text>
          </view>
          <view class="match-card-right">
            <text class="match-score">匹配度 {{ m.match_score }}分</text>
            <text class="match-arrow">→</text>
          </view>
        </view>
      </view>

      <!-- ==================== 标记已找到按钮（仅发布者可见） ==================== -->
      <view v-if="isOwner && item.status === 'active'" class="action-area">
        <button class="found-btn" @click="handleMarkFound">
          标记已找到
        </button>
      </view>

      <!-- 已找到/已关闭提示 -->
      <view v-if="isOwner && item.status !== 'active'" class="action-area">
        <text class="found-tip" :class="item.status">
          {{ item.status === 'found' ? '✅ 已标记为找到' : '🔒 已关闭' }}
        </text>
      </view>

      <!-- 底部安全区 -->
      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import StatusBadge from '@/components/StatusBadge.vue'
import { getDetail, markAsFound, getMatches } from '@/api/item.js'
import { useUserStore } from '@/store/user.js'

const userStore = useUserStore()

// ==================== 状态 ====================

// 物品详情
const item = ref({})
// 匹配推荐列表
const matches = ref([])

// ==================== 计算属性 ====================

// 解析图片列表（数据库存的是 JSON 字符串）
const parsedImages = computed(() => {
  if (!item.value.images) return []
  if (Array.isArray(item.value.images)) return item.value.images
  try { return JSON.parse(item.value.images) } catch { return [] }
})

// 是否是发布者
const isOwner = computed(() => {
  return userStore.userInfo && item.value.user_id === userStore.userInfo.id
})

// 联系方式是否是手机号
const isPhoneNumber = computed(() => {
  return item.value.contact && /^1\d{10}$/.test(item.value.contact)
})

// ==================== 生命周期 ====================

onLoad(async (options) => {
  const id = options.id
  if (!id) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  try {
    await loadDetail(id)
    await loadMatches(id)
  } catch (err) {
    console.error('加载失败:', err)
  }
})

// ==================== 数据加载 ====================

/**
 * 加载物品详情
 */
async function loadDetail(id) {
  const data = await getDetail(id)
  item.value = data
}

/**
 * 加载匹配推荐
 */
async function loadMatches(id) {
  try {
    const data = await getMatches(id)
    matches.value = data || []
  } catch {
    matches.value = []
  }
}

// ==================== 匹配辅助 ====================

// 获取匹配物品的 ID（对方物品）
function matchItemId(m) {
  return item.value.type === 'lost' ? m.found_item_id : m.lost_item_id
}

// 获取匹配物品的名称
function matchItemName(m) {
  return item.value.type === 'lost' ? m.found_item_name : m.lost_item_name
}

// 获取匹配物品的地点
function matchItemLocation(m) {
  return item.value.type === 'lost' ? m.found_item_location : m.lost_item_location
}

// ==================== 操作 ====================

/**
 * 复制联系方式
 */
function copyContact() {
  uni.setClipboardData({
    data: item.value.contact,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
}

/**
 * 拨打电话
 */
function callContact() {
  uni.makePhoneCall({ phoneNumber: item.value.contact })
}

/**
 * 标记已找到（二次确认 + 调 API）
 */
function handleMarkFound() {
  uni.showModal({
    title: '确认标记',
    content: '确定要标记为"已找到"吗？标记后信息将不再参与匹配。',
    confirmText: '确认',
    cancelText: '取消',
    confirmColor: '#E74C3C',
    success: async (res) => {
      if (!res.confirm) return

      try {
        await markAsFound(item.value.id, 'found')
        uni.showToast({ title: '已标记为找到', icon: 'success' })
        // 更新本地状态
        item.value.status = 'found'
      } catch (err) {
        console.error('标记失败:', err)
      }
    }
  })
}

/**
 * 点击匹配推荐卡片跳转
 */
function goDetail(id) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}

/**
 * 格式化完整时间（2026-06-15 14:30:00 → 2026年6月15日 14:30）
 */
function formatFullTime(timeStr) {
  if (!timeStr) return '未知'
  const d = new Date(timeStr)
  if (isNaN(d.getTime())) return timeStr
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.detail-page {
  height: 100vh;
  background-color: #F5F6FA;
}

.detail-scroll {
  height: 100%;
}

/* ==================== 图片轮播 ==================== */
.swiper-area {
  width: 100%;
  height: 500rpx;
  background-color: #E8E8E8;
}

.swiper {
  width: 100%;
  height: 100%;
}

.swiper-img {
  width: 100%;
  height: 100%;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #F0F4FA;
}

.no-image-text {
  font-size: 80rpx;
  margin-bottom: 12rpx;
}

.no-image-label {
  font-size: 26rpx;
  color: #999999;
}

/* ==================== 信息区域 ==================== */
.info-section {
  background-color: #FFFFFF;
  margin: 16rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.match-hint {
  font-size: 24rpx;
  color: #999999;
  font-weight: normal;
  margin-left: 12rpx;
}

/* ==================== 标题行 ==================== */
.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
}

/* ==================== 标签行 ==================== */
.tag-row {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.type-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.tag-lost {
  background-color: #FDEDEC;
  color: #E74C3C;
}

.tag-found {
  background-color: #E8F8EE;
  color: #27AE60;
}

.category-tag {
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  background-color: #F0F4FA;
  color: #666666;
}

/* ==================== 详细信息列表 ==================== */
.info-list {
  margin-bottom: 16rpx;
}

.info-item {
  display: flex;
  flex-direction: row;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.info-label {
  width: 140rpx;
  font-size: 28rpx;
  color: #999999;
  flex-shrink: 0;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

/* ==================== 描述区域 ==================== */
.desc-area {
  padding-top: 16rpx;
}

.desc-label {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 12rpx;
  display: block;
}

.desc-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}

/* ==================== 发布者信息 ==================== */
.publisher-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #F0F4FA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
}

.publisher-info {
  flex: 1;
}

.publisher-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 6rpx;
}

.publisher-contact {
  font-size: 26rpx;
  color: #666666;
}

/* ==================== 联系方式按钮 ==================== */
.contact-actions {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F0F4FA;
  border-radius: 12rpx;
  border: none;
  gap: 8rpx;
}

.call-btn {
  background-color: #E8F8EE;
}

.action-icon {
  font-size: 28rpx;
}

.action-text {
  font-size: 26rpx;
  color: #333333;
}

/* ==================== 匹配推荐 ==================== */
.match-section {
  border: 2rpx solid #E8F2FD;
}

.match-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  margin-top: 12rpx;
  background-color: #FAFBFC;
  border-radius: 12rpx;
}

.match-card-left {
  flex: 1;
}

.match-item-name {
  font-size: 28rpx;
  color: #333333;
  font-weight: 600;
  display: block;
  margin-bottom: 6rpx;
}

.match-item-location {
  font-size: 24rpx;
  color: #999999;
}

.match-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.match-score {
  font-size: 22rpx;
  color: #4A90D9;
  margin-bottom: 4rpx;
}

.match-arrow {
  font-size: 28rpx;
  color: #CCCCCC;
}

/* ==================== 标记已找到 ==================== */
.action-area {
  padding: 24rpx;
  text-align: center;
}

.found-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #27AE60;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}

.found-tip {
  font-size: 28rpx;
}

.found-tip.found {
  color: #27AE60;
}

.found-tip.closed {
  color: #999999;
}

/* ==================== 底部安全区 ==================== */
.bottom-safe {
  height: 40rpx;
}
</style>
