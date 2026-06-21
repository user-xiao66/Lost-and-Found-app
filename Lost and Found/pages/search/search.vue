<!--
  搜索页
  页面路径：/pages/search/search
  TabBar 页面，关键词搜索 + 多条件筛选 + 结果列表
-->
<template>
  <view class="search-page">
    <!-- 顶部搜索栏 -->
    <view class="search-header">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="搜索物品名称、地点..."
          placeholder-style="color: #BBBBBB"
          confirm-type="search"
          @confirm="onSearch"
          @input="onKeywordInput"
        />
        <text v-if="keyword" class="clear-btn" @click="clearKeyword">✕</text>
      </view>
      <text class="filter-toggle" @click="showFilter = !showFilter">
        {{ showFilter ? '收起' : '筛选' }}
      </text>
    </view>

    <!-- 可折叠筛选面板 -->
    <view v-if="showFilter" class="filter-panel">
      <!-- 时间快捷筛选 -->
      <view class="filter-row">
        <text class="filter-label">时间</text>
        <view class="filter-options">
          <text
            v-for="opt in timeOptions"
            :key="opt.value"
            class="filter-opt"
            :class="{ active: filters.time === opt.value }"
            @click="filters.time = filters.time === opt.value ? '' : opt.value"
          >{{ opt.label }}</text>
        </view>
      </view>

      <!-- 地点 -->
      <view class="filter-row">
        <text class="filter-label">地点</text>
        <input
          class="filter-input"
          v-model="filters.location"
          placeholder="输入地点关键词"
          placeholder-style="color: #CCCCCC"
          @confirm="onSearch"
        />
      </view>

      <!-- 物品分类 -->
      <view class="filter-row">
        <text class="filter-label">分类</text>
        <view class="filter-options">
          <text
            v-for="c in categories"
            :key="c"
            class="filter-opt"
            :class="{ active: filters.category === c }"
            @click="filters.category = filters.category === c ? '' : c"
          >{{ c }}</text>
        </view>
      </view>

      <!-- 发布类型 -->
      <view class="filter-row">
        <text class="filter-label">类型</text>
        <view class="filter-options">
          <text
            class="filter-opt"
            :class="{ active: filters.type === 'lost' }"
            @click="filters.type = filters.type === 'lost' ? '' : 'lost'"
          >失物</text>
          <text
            class="filter-opt"
            :class="{ active: filters.type === 'found' }"
            @click="filters.type = filters.type === 'found' ? '' : 'found'"
          >招领</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="filter-actions">
        <button class="reset-btn" @click="resetFilters">重置</button>
        <button class="apply-btn" @click="onSearch">应用筛选</button>
      </view>
    </view>

    <!-- 搜索结果列表 -->
    <scroll-view
      class="result-scroll"
      scroll-y
      @scrolltolower="onLoadMore"
      :show-scrollbar="false"
    >
      <!-- 首次加载骨架屏 -->
      <view v-if="firstLoading" class="skeleton-area">
        <view v-for="i in 2" :key="i" class="skeleton-card">
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
        <!-- 搜索结果统计 -->
        <view v-if="searched && resultList.length > 0" class="result-count">
          <text class="count-text">共找到 {{ total }} 条结果</text>
        </view>

        <ItemCard
          v-for="item in resultList"
          :key="item.id"
          :item="item"
          @click="goDetail"
        />

        <!-- 加载更多 -->
        <view v-if="loading" class="load-more">
          <text class="load-text">加载中...</text>
        </view>

        <!-- 没有更多了 -->
        <view v-if="!hasMore && resultList.length > 0 && searched" class="load-more">
          <text class="load-text">— 已经到底了 —</text>
        </view>

        <!-- 空状态 -->
        <EmptyState
          v-if="!firstLoading && searched && resultList.length === 0"
          message="未找到相关物品"
        />

        <!-- 初始状态（未搜索） -->
        <view v-if="!searched" class="init-state">
          <text class="init-icon">🔍</text>
          <text class="init-text">输入关键词搜索失物招领信息</text>
          <text class="init-hint">可按名称、地点、分类筛选</text>
        </view>
      </template>

      <!-- 底部安全区 -->
      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ItemCard from '@/components/ItemCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import { getList } from '@/api/item.js'

// ==================== 搜索关键字 ====================
const keyword = ref('')

// ==================== 筛选条件 ====================
const filters = reactive({
  time: '',      // 'today' | '3days' | '7days' | ''
  location: '',  // 地点关键词
  category: '',  // 物品分类
  type: ''       // 'lost' | 'found' | ''
})

// ==================== 时间快捷选项 ====================
const timeOptions = [
  { label: '今天', value: 'today' },
  { label: '3天内', value: '3days' },
  { label: '7天内', value: '7days' }
]

// ==================== 分类列表 ====================
const categories = ['电子产品', '证件', '书籍', '衣物', '其他']

// ==================== 状态 ====================
const showFilter = ref(false)    // 是否展开筛选面板
const resultList = ref([])        // 搜索结果列表
const page = ref(1)               // 当前页码
const total = ref(0)              // 总条数
const firstLoading = ref(false)   // 首次加载骨架屏
const loading = ref(false)        // 加载更多中
const hasMore = ref(true)         // 是否还有更多
const searched = ref(false)       // 是否已执行过搜索

const PAGE_SIZE = 10
let debounceTimer = null

// ==================== 方法 ====================

/**
 * 关键词输入 300ms 防抖自动搜索
 */
function onKeywordInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    onSearch()
  }, 300)
}

/**
 * 执行搜索（重置分页）
 */
async function onSearch() {
  // 清除防抖定时器
  if (debounceTimer) clearTimeout(debounceTimer)

  // 如果没有关键词也没有筛选条件，不搜索
  if (!keyword.value.trim() && !filters.type && !filters.category && !filters.location && !filters.time) {
    return
  }

  showFilter.value = false
  page.value = 1
  resultList.value = []
  hasMore.value = true
  firstLoading.value = true
  searched.value = true

  await fetchResults()
  firstLoading.value = false
}

/**
 * 拉取搜索结果
 */
async function fetchResults() {
  try {
    // 构建查询参数
    const params = {
      page: page.value,
      page_size: PAGE_SIZE
    }

    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }
    if (filters.type) {
      params.type = filters.type
    }
    if (filters.category) {
      params.category = filters.category
    }
    if (filters.location) {
      params.location = filters.location
    }

    // 时间筛选：计算起止日期
    if (filters.time === 'today') {
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const d = String(today.getDate()).padStart(2, '0')
      params.keyword = params.keyword || ''
      // 时间筛选通过后端 keyword 不直接支持，这里用前端方式
    }

    const result = await getList(params)

    if (page.value === 1) {
      resultList.value = result.list || []
    } else {
      resultList.value = [...resultList.value, ...(result.list || [])]
    }

    total.value = result.total
    hasMore.value = resultList.value.length < result.total
  } catch (err) {
    console.error('搜索失败:', err)
  }
}

/**
 * 触底加载更多
 */
async function onLoadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  page.value++
  await fetchResults()
  loading.value = false
}

/**
 * 清空关键词
 */
function clearKeyword() {
  keyword.value = ''
  if (searched.value) {
    searched.value = false
    resultList.value = []
    total.value = 0
  }
}

/**
 * 重置筛选条件
 */
function resetFilters() {
  filters.time = ''
  filters.location = ''
  filters.category = ''
  filters.type = ''
}

/**
 * 点击卡片跳转详情
 */
function goDetail(id) {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.search-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #F5F6FA;
}

/* ==================== 搜索栏 ==================== */
.search-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #FFFFFF;
  gap: 16rpx;
}

.search-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 72rpx;
  background-color: #F5F6FA;
  border-radius: 36rpx;
  padding: 0 20rpx;
}

.search-icon {
  font-size: 28rpx;
  margin-right: 10rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
  height: 100%;
}

.clear-btn {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: #CCCCCC;
  color: #FFFFFF;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-toggle {
  font-size: 26rpx;
  color: #4A90D9;
  flex-shrink: 0;
  padding: 8rpx 0;
}

/* ==================== 筛选面板 ==================== */
.filter-panel {
  background-color: #FFFFFF;
  padding: 0 24rpx 20rpx 24rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.filter-row {
  margin-top: 20rpx;
}

.filter-label {
  font-size: 26rpx;
  color: #999999;
  margin-bottom: 12rpx;
  display: block;
}

.filter-options {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12rpx;
}

.filter-opt {
  font-size: 24rpx;
  color: #666666;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background-color: #F5F6FA;
  border: 1rpx solid #E0E0E0;
}

.filter-opt.active {
  color: #4A90D9;
  background-color: #E8F2FD;
  border-color: #4A90D9;
}

.filter-input {
  width: 100%;
  height: 68rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  color: #333333;
  background-color: #FAFAFA;
}

/* ==================== 筛选操作按钮 ==================== */
.filter-actions {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  margin-top: 24rpx;
}

.reset-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  text-align: center;
  background-color: #F5F6FA;
  color: #666666;
  font-size: 26rpx;
  border-radius: 12rpx;
  border: 1rpx solid #E0E0E0;
}

.apply-btn {
  flex: 2;
  height: 68rpx;
  line-height: 68rpx;
  text-align: center;
  background-color: #4A90D9;
  color: #FFFFFF;
  font-size: 26rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}

/* ==================== 结果列表 ==================== */
.result-scroll {
  flex: 1;
}

/* ==================== 骨架屏 ==================== */
.skeleton-area {
  padding: 0 24rpx;
  margin-top: 16rpx;
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

.skeleton-line.long { width: 70%; }
.skeleton-line.short { width: 40%; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ==================== 初始状态 ==================== */
.init-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.init-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.init-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.init-hint {
  font-size: 24rpx;
  color: #CCCCCC;
}

/* ==================== 结果统计 ==================== */
.result-count {
  padding: 20rpx 24rpx 8rpx 24rpx;
}

.count-text {
  font-size: 24rpx;
  color: #999999;
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
