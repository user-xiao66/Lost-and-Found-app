<!--
  我的发布列表页
  页面路径：/pages/mine/mine
  获参数 type=lost|found，展示我发布的失物/招领，按状态 Tab 再细分
-->
<template>
  <view class="mine-page">
    <!-- 顶部 Tab：失物 / 招领 -->
    <view class="type-tab-bar">
      <view
        class="type-tab"
        :class="{ active: tabType === 'lost' }"
        @click="switchType('lost')"
      >
        <text class="type-tab-text">我发布的失物</text>
        <view v-if="tabType === 'lost'" class="type-tab-indicator"></view>
      </view>
      <view
        class="type-tab"
        :class="{ active: tabType === 'found' }"
        @click="switchType('found')"
      >
        <text class="type-tab-text">我发布的招领</text>
        <view v-if="tabType === 'found'" class="type-tab-indicator"></view>
      </view>
    </view>

    <!-- 状态筛选行 -->
    <view class="status-filter">
      <text
        v-for="s in statusOptions"
        :key="s.value"
        class="status-opt"
        :class="{ active: statusFilter === s.value }"
        @click="switchStatus(s.value)"
      >{{ s.label }}</text>
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
        <ItemCard
          v-for="item in list"
          :key="item.id"
          :item="item"
          @click="goDetail"
        />

        <view v-if="loading" class="load-more">
          <text class="load-text">加载中...</text>
        </view>

        <view v-if="!hasMore && list.length > 0" class="load-more">
          <text class="load-text">— 已经到底了 —</text>
        </view>

        <EmptyState
          v-if="!firstLoading && list.length === 0"
          :message="tabType === 'lost' ? '暂无发布的失物' : '暂无发布的招领'"
        />
      </template>

      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getMyItems } from '@/api/item.js'

// ==================== 路由参数 ====================
const tabType = ref('lost') // 'lost' | 'found'

// ==================== 状态筛选 ====================
const statusOptions = [
  { label: '寻找中', value: 'active' },
  { label: '已找到', value: 'found' },
  { label: '已关闭', value: 'closed' },
  { label: '已过期', value: 'expired' }
]
const statusFilter = ref('')

// ==================== 列表数据 ====================
const list = ref([])
const page = ref(1)
const firstLoading = ref(true)
const loading = ref(false)
const hasMore = ref(true)
const PAGE_SIZE = 10

// ==================== 生命周期 ====================
onLoad((options) => {
  if (options && options.type) {
    tabType.value = options.type
  }
})

onShow(() => {
  resetAndLoad()
})

// ==================== 方法 ====================

function switchType(type) {
  if (tabType.value === type) return
  tabType.value = type
  statusFilter.value = ''
  resetAndLoad()
}

function switchStatus(status) {
  statusFilter.value = statusFilter.value === status ? '' : status
  resetAndLoad()
}

async function resetAndLoad() {
  page.value = 1
  list.value = []
  hasMore.value = true
  firstLoading.value = true
  await loadData()
  firstLoading.value = false
}

async function loadData() {
  try {
    const result = await getMyItems({
      type: tabType.value,
      status: statusFilter.value || undefined,
      page: page.value,
      page_size: PAGE_SIZE
    })

    if (page.value === 1) {
      list.value = result.list || []
    } else {
      list.value = [...list.value, ...(result.list || [])]
    }

    hasMore.value = list.value.length < result.total
  } catch (err) {
    console.error('加载失败:', err)
  }
}

async function onLoadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  page.value++
  await loadData()
  loading.value = false
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.mine-page {
  height: 100vh;
  background-color: #F5F6FA;
  display: flex;
  flex-direction: column;
}

/* ==================== 类型 Tab ==================== */
.type-tab-bar {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
}

.type-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 0 0;
  position: relative;
}

.type-tab-text {
  font-size: 30rpx;
  color: #999999;
  padding-bottom: 16rpx;
}

.type-tab.active .type-tab-text {
  color: #4A90D9;
  font-weight: bold;
}

.type-tab-indicator {
  width: 60rpx;
  height: 6rpx;
  background-color: #4A90D9;
  border-radius: 3rpx;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

/* ==================== 状态筛选 ==================== */
.status-filter {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background-color: #F5F6FA;
}

.status-opt {
  font-size: 24rpx;
  color: #666666;
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
  background-color: #FFFFFF;
  border: 1rpx solid #E0E0E0;
}

.status-opt.active {
  color: #4A90D9;
  background-color: #E8F2FD;
  border-color: #4A90D9;
}

/* ==================== 列表 ==================== */
.list-scroll { flex: 1; }

/* 骨架屏 */
.skeleton-area { padding: 16rpx 24rpx; }
.skeleton-card {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}
.skeleton-img {
  width: 160rpx; height: 160rpx; border-radius: 12rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0; margin-right: 20rpx;
}
.skeleton-info { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20rpx; }
.skeleton-line { height: 28rpx; border-radius: 6rpx;
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

/* 加载更多 */
.load-more { display: flex; justify-content: center; padding: 24rpx 0; }
.load-text { font-size: 24rpx; color: #CCCCCC; }
.bottom-safe { height: 40rpx; }
</style>
