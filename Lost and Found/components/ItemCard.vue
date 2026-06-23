<!--
  物品信息卡片组件
  用于首页列表、搜索结果、个人中心等场景展示物品摘要

  Props:
    item - 物品对象 { id, type, name, category, location, occur_time, status, images, user_nickname }

  Events:
    @click - 点击卡片时触发，携带 item.id
    @longpress - 长按卡片时触发（预留）
-->
<template>
  <view class="item-card" @click="$emit('click', item.id)">
    <!-- 左侧缩略图 -->
    <view class="card-image">
      <image
        v-if="item.images && item.images.length"
        :src="firstImage"
        mode="aspectFill"
        class="thumb"
      />
      <view v-else class="thumb-placeholder">
        <text class="placeholder-icon">{{ item.type === 'lost' ? '🔍' : '📦' }}</text>
      </view>
    </view>

    <!-- 右侧信息区 -->
    <view class="card-info">
      <!-- 物品名称 -->
      <text class="item-name">{{ item.name }}</text>

      <!-- 标签行：类型 + 状态 -->
      <view class="tag-row">
        <!-- 失物/招领标签 -->
        <text class="type-tag" :class="'tag-' + item.type">
          {{ item.type === 'lost' ? '失物' : '招领' }}
        </text>
        <!-- 状态徽章 -->
        <StatusBadge :status="item.status" />
      </view>

      <!-- 地点 · 时间 -->
      <view class="meta-row">
        <text class="location">{{ item.location }}</text>
        <text class="divider">·</text>
        <text class="time">{{ formatTime(item.occur_time || item.created_at) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'
import { BASE_URL } from '@/api/request.js'

// 服务器地址（用于补全相对路径图片）
const serverBase = BASE_URL.replace('/api', '')

// 接收物品数据
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

// 触发事件
defineEmits(['click'])

// 获取第一张图片（相对路径补全为完整 URL）
const firstImage = computed(() => {
  if (props.item.images) {
    let arr = props.item.images
    if (!Array.isArray(arr)) {
      try { arr = JSON.parse(arr) } catch { return '' }
    }
    const url = arr[0] || ''
    // 相对路径补全
    return url.startsWith('http') ? url : serverBase + url
  }
  return ''
})

// 格式化时间显示（去掉秒，显示"06-16 14:30"）
function formatTime(timeStr) {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${min}`
}
</script>

<style scoped>
/* ==================== 卡片容器 ==================== */
.item-card {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx;
  margin: 0 16rpx 20rpx 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

/* ==================== 左侧图片 ==================== */
.card-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.thumb {
  width: 100%;
  height: 100%;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  background-color: #F0F4FA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 48rpx;
}

/* ==================== 右侧信息 ==================== */
.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.item-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  /* 单行溢出省略 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==================== 标签行 ==================== */
.tag-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12rpx;
  margin: 12rpx 0;
}

/* 失物/招领标签 */
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

/* ==================== 地点/时间行 ==================== */
.meta-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.location {
  font-size: 24rpx;
  color: #999999;
  max-width: 300rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  font-size: 24rpx;
  color: #CCCCCC;
  margin: 0 8rpx;
}

.time {
  font-size: 24rpx;
  color: #999999;
}
</style>
