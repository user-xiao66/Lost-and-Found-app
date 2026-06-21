<!--
  首页
  页面路径：/pages/index/index
  TabBar 页面，失物/招领 Tab 切换 + 信息瀑布流 + 悬浮发布按钮
-->
<template>
  <view class="home-page">
    <!-- 顶部搜索栏（点击跳转搜索页） -->
    <view class="search-bar" @click="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索物品、地点...</text>
    </view>

    <!-- 失物 / 招领 Tab 切换 -->
    <view class="tab-bar">
      <view
        class="tab-item"
        :class="{ active: activeTab === 'lost' }"
        @click="switchTab('lost')"
      >
        <text class="tab-text">失物</text>
        <view v-if="activeTab === 'lost'" class="tab-indicator"></view>
      </view>
      <view
        class="tab-item"
        :class="{ active: activeTab === 'found' }"
        @click="switchTab('found')"
      >
        <text class="tab-text">招领</text>
        <view v-if="activeTab === 'found'" class="tab-indicator"></view>
      </view>
    </view>

    <!-- 物品列表区域 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
      :show-scrollbar="false"
    >
      <!-- 骨架屏加载态 -->
      <view v-if="firstLoading" class="skeleton-area">
        <view v-for="i in 3" :key="i" class="skeleton-card">
          <view class="skeleton-img"></view>
          <view class="skeleton-info">
            <view class="skeleton-line long"></view>
            <view class="skeleton-line short"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <!-- 物品列表 -->
      <template v-else>
        <ItemCard
          v-for="item in itemList"
          :key="item.id"
          :item="item"
          @click="goDetail"
        />

        <!-- 触底加载提示 -->
        <view v-if="loading" class="load-more">
          <text class="load-text">加载中...</text>
        </view>

        <!-- 没有更多了 -->
        <view v-if="!hasMore && itemList.length > 0" class="load-more">
          <text class="load-text">— 已经到底了 —</text>
        </view>

        <!-- 空状态 -->
        <EmptyState
          v-if="!firstLoading && itemList.length === 0"
          message="暂无相关信息"
        />
      </template>

      <!-- 底部安全区 -->
      <view class="bottom-safe"></view>
    </scroll-view>

    <!-- 右下角悬浮"+"发布按钮 -->
    <view class="float-btn" @click="goPublish">
      <text class="float-btn-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getList } from '@/api/item.js'

// ==================== 状态 ====================

// 当前激活的 Tab：'lost' | 'found'
const activeTab = ref('lost')
// 物品列表
const itemList = ref([])
// 当前页码
const page = ref(1)
// 是否首次加载（用于骨架屏）
const firstLoading = ref(true)
// 是否正在加载更多
const loading = ref(false)
// 是否下拉刷新中
const refreshing = ref(false)
// 是否还有更多数据
const hasMore = ref(true)
// 每页条数
const PAGE_SIZE = 10

// ==================== 钩子 ====================

/**
 * 页面显示时检查登录态
 */
onShow(() => {
  const token = uni.getStorageSync('token')
  if (!token) {
    // 未登录，跳转到登录页面
    uni.navigateTo({ url: '/pages/login/login' })
  }
})

// ==================== 方法 ====================

/**
 * 切换失物/招领 Tab
 * @param {string} type - 'lost' | 'found'
 */
function switchTab(type) {
  if (activeTab.value === type) return
  activeTab.value = type
  // 重置并重新加载
  resetAndLoad()
}

/**
 * 重置列表并重新加载
 */
async function resetAndLoad() {
  page.value = 1
  itemList.value = []
  hasMore.value = true
  firstLoading.value = true
  await fetchItems()
  firstLoading.value = false
}

/**
 * 拉取物品列表
 */
async function fetchItems() {
  try {
    const result = await getList({
      type: activeTab.value,
      page: page.value,
      page_size: PAGE_SIZE
    })

    if (page.value === 1) {
      // 首页数据
      itemList.value = result.list || []
    } else {
      // 追加数据
      itemList.value = [...itemList.value, ...(result.list || [])]
    }

    // 判断是否还有更多
    hasMore.value = itemList.value.length < result.total
  } catch (err) {
    console.error('获取列表失败:', err)
  }
}

/**
 * 下拉刷新
 */
async function onRefresh() {
  refreshing.value = true
  page.value = 1
  itemList.value = []
  hasMore.value = true
  await fetchItems()
  refreshing.value = false
}

/**
 * 触底加载更多
 */
async function onLoadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  page.value++
  await fetchItems()
  loading.value = false
}

/**
 * 点击卡片跳转详情页
 * @param {number} id - 物品 ID
 */
function goDetail(id) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}

/**
 * 点击搜索栏跳转搜索页
 */
function goSearch() {
  uni.switchTab({ url: '/pages/search/search' })
}

/**
 * 点击悬浮按钮跳转发布页
 */
function goPublish() {
  uni.navigateTo({ url: '/pages/publish/publish' })
}

// ==================== 初始化 ====================

resetAndLoad()
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
  position: relative;
}

/* ==================== 搜索栏 ==================== */
.search-bar {
  display: flex;
  align-items: center;
  margin: 20rpx 24rpx;
  height: 72rpx;
  background-color: #FFFFFF;
  border-radius: 36rpx;
  padding: 0 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-placeholder {
  font-size: 26rpx;
  color: #BBBBBB;
}

/* ==================== Tab 切换栏 ==================== */
.tab-bar {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  padding: 0 24rpx;
  margin-bottom: 4rpx;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 0 0;
  position: relative;
}

.tab-text {
  font-size: 30rpx;
  color: #999999;
  padding-bottom: 16rpx;
  transition: color 0.2s;
}

.tab-item.active .tab-text {
  color: #4A90D9;
  font-weight: bold;
}

/* 底部指示线 */
.tab-indicator {
  width: 48rpx;
  height: 6rpx;
  background-color: #4A90D9;
  border-radius: 3rpx;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

/* ==================== 列表滚动区 ==================== */
.list-scroll {
  flex: 1;
  padding-top: 16rpx;
}

/* ==================== 骨架屏 ==================== */
.skeleton-area {
  padding: 0 24rpx;
}

.skeleton-card {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.skeleton-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
  margin-right: 20rpx;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20rpx;
}

.skeleton-line {
  height: 28rpx;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.long {
  width: 70%;
}

.skeleton-line.short {
  width: 40%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
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
  height: 120rpx;
}

/* ==================== 悬浮发布按钮 ==================== */
.float-btn {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background-color: #4A90D9;
  box-shadow: 0 8rpx 24rpx rgba(74, 144, 217, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  transition: transform 0.2s;
}

.float-btn:active {
  transform: scale(0.9);
}

.float-btn-icon {
  font-size: 64rpx;
  color: #FFFFFF;
  line-height: 1;
  font-weight: 300;
}
</style>
