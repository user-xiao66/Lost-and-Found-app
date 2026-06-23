<!--
  管理员物品管控面板
  页面路径：/pages/admin/items
  查看全部物品（含所有状态），支持筛选 + 快捷操作
-->
<template>
  <view class="admin-page">
    <!-- 搜索 + 筛选栏 -->
    <view class="toolbar">
      <view class="search-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索物品名称"
          placeholder-style="color: #BBBBBB"
          @confirm="onSearch"
        />
      </view>
      <!-- 状态快捷切换 -->
      <view class="status-tabs">
        <text
          v-for="s in statusTabs"
          :key="s.value"
          class="status-tab"
          :class="{ active: statusFilter === s.value }"
          @click="statusFilter = statusFilter === s.value ? '' : s.value"
        >{{ s.label }}</text>
      </view>
    </view>

    <!-- 物品列表 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      :show-scrollbar="false"
    >
      <view v-if="firstLoading" class="skeleton-area">
        <view v-for="i in 2" :key="i" class="skeleton-card">
          <view class="skeleton-img"></view>
          <view class="skeleton-info">
            <view class="skeleton-line long"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <template v-else>
        <!-- 统计 -->
        <view class="result-count">
          <text class="count-text">共 {{ total }} 条记录</text>
        </view>

        <!-- 物品卡片（管理员定制版 — 显示完整联系方式 + 发布者 + 状态标签） -->
        <view
          v-for="item in list"
          :key="item.id"
          class="admin-card"
          :class="'card-' + item.status"
          @click="goDetail(item.id)"
        >
          <view class="card-top">
            <text class="card-name">{{ item.name }}</text>
            <StatusBadge :status="item.status" />
          </view>
          <view class="card-meta">
            <text class="card-type" :class="'type-' + item.type">
              {{ item.type === 'lost' ? '失物' : '招领' }}
            </text>
            <text class="card-location">📍 {{ item.location }}</text>
            <text class="card-time">🕐 {{ item.occur_time?.slice(0, 10) }}</text>
          </view>
          <view class="card-footer">
            <text class="card-publisher">👤 {{ item.user_nickname || '未知' }}</text>
            <text class="card-contact">📞 {{ item.contact }}</text>
          </view>

          <!-- 快捷操作 -->
          <view class="card-actions" @click.stop>
            <text
              v-if="item.status === 'active'"
              class="card-action-btn close-action"
              @click="handleClose(item)"
            >关闭</text>
            <text
              v-if="item.status === 'closed'"
              class="card-action-btn reopen-action"
              @click="handleReopen(item)"
            >启用</text>
            <text
              v-if="item.status === 'active'"
              class="card-action-btn found-action"
              @click="handleMarkFound(item)"
            >标记找到</text>
          </view>
        </view>

        <view v-if="loading" class="load-more">
          <text class="load-text">加载中...</text>
        </view>

        <view v-if="!hasMore && list.length > 0" class="load-more">
          <text class="load-text">— 已经到底了 —</text>
        </view>

        <EmptyState
          v-if="!firstLoading && list.length === 0"
          message="暂无物品信息"
        />
      </template>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getList, adminUpdateStatus } from '@/api/item.js'

// ==================== 筛选 ====================
const keyword = ref('')
const statusFilter = ref('')
const statusTabs = [
  { label: '全部', value: '' },
  { label: '寻找中', value: 'active' },
  { label: '已找到', value: 'found' },
  { label: '已关闭', value: 'closed' }
]

// ==================== 列表数据 ====================
const list = ref([])
const page = ref(1)
const total = ref(0)
const firstLoading = ref(true)
const loading = ref(false)
const hasMore = ref(true)
const PAGE_SIZE = 15

// ==================== 初始化 ====================
loadData()

async function loadData() {
  try {
    const params = {
      page: page.value,
      page_size: PAGE_SIZE
    }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    if (statusFilter.value) params.status = statusFilter.value

    // 管理员调列表接口 — 后端 isAdmin=true 不过滤状态、不脱敏
    const result = await getList(params)

    if (page.value === 1) {
      list.value = result.list || []
    } else {
      list.value = [...list.value, ...(result.list || [])]
    }
    total.value = result.total
    hasMore.value = list.value.length < result.total
  } catch (err) {
    console.error('加载失败:', err)
  } finally {
    firstLoading.value = false
  }
}

async function onSearch() {
  page.value = 1
  list.value = []
  hasMore.value = true
  firstLoading.value = true
  await loadData()
}

async function onLoadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  page.value++
  await loadData()
  loading.value = false
}

// ==================== 管理操作 ====================

async function handleClose(item) {
  const res = await uniShowModal('确认关闭？', '关闭后用户将不可见')
  if (!res) return
  await adminUpdateStatus(item.id, 'closed')
  item.status = 'closed'
  uni.showToast({ title: '已关闭', icon: 'success' })
}

async function handleReopen(item) {
  const res = await uniShowModal('确认重新启用？', '将恢复为可匹配状态')
  if (!res) return
  await adminUpdateStatus(item.id, 'active')
  item.status = 'active'
  uni.showToast({ title: '已启用', icon: 'success' })
}

async function handleMarkFound(item) {
  const res = await uniShowModal('确认标记已找到？', '')
  if (!res) return
  await adminUpdateStatus(item.id, 'found')
  item.status = 'found'
  uni.showToast({ title: '已标记找到', icon: 'success' })
}

function uniShowModal(title, content) {
  return new Promise(resolve => {
    uni.showModal({
      title: '管理员操作', content: `${title}\n${content}`,
      confirmText: '确认', confirmColor: '#E74C3C',
      success: r => resolve(r.confirm)
    })
  })
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.admin-page {
  height: 100vh;
  background-color: #F5F6FA;
  display: flex;
  flex-direction: column;
}

/* ==================== 工具栏 ==================== */
.toolbar {
  background-color: #FFFFFF;
  padding: 16rpx 24rpx 0 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.search-wrap {
  display: flex;
  align-items: center;
  height: 68rpx;
  background-color: #F5F6FA;
  border-radius: 34rpx;
  padding: 0 20rpx;
  margin-bottom: 12rpx;
}

.search-icon { font-size: 26rpx; margin-right: 10rpx; }

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333333;
  height: 100%;
}

.status-tabs {
  display: flex;
  flex-direction: row;
  gap: 0;
  padding-bottom: 8rpx;
}

.status-tab {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999999;
  padding: 12rpx 0;
  position: relative;
}

.status-tab.active {
  color: #4A90D9;
  font-weight: bold;
}

.status-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background-color: #4A90D9;
  border-radius: 2rpx;
}

/* ==================== 列表 ==================== */
.list-scroll { flex: 1; }

.result-count {
  padding: 16rpx 24rpx 4rpx 24rpx;
}

.count-text { font-size: 24rpx; color: #999999; }

/* ==================== 管理卡片 ==================== */
.admin-card {
  background-color: #FFFFFF;
  margin: 12rpx 24rpx;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.card-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
}

.card-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #999999;
}

.card-type {
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
}

.type-lost { background-color: #FDEDEC; color: #E74C3C; }
.type-found { background-color: #E8F8EE; color: #27AE60; }

.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #F5F5F5;
}

.card-actions {
  display: flex;
  flex-direction: row;
  gap: 12rpx;
}

.card-action-btn {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  border: 1rpx solid;
}

.close-action { color: #E74C3C; border-color: #E74C3C; }
.reopen-action { color: #4A90D9; border-color: #4A90D9; }
.found-action { color: #27AE60; border-color: #27AE60; }

/* ==================== 骨架屏/加载更多 ==================== */
.skeleton-area { padding: 0 24rpx; }
.skeleton-card {
  display: flex; flex-direction: row;
  background-color: #FFFFFF; border-radius: 16rpx;
  padding: 20rpx; margin-bottom: 20rpx;
}
.skeleton-img {
  width: 120rpx; height: 120rpx; border-radius: 12rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite;
  flex-shrink: 0; margin-right: 16rpx;
}
.skeleton-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16rpx; }
.skeleton-line { height: 24rpx; border-radius: 6rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite;
}
.skeleton-line.long { width: 70%; }
.skeleton-line.short { width: 40%; }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.load-more { display: flex; justify-content: center; padding: 24rpx 0; }
.load-text { font-size: 24rpx; color: #CCCCCC; }
.bottom-safe { height: 40rpx; }
</style>
