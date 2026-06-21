<!--
  发布页
  页面路径：/pages/publish/publish
  失物/招领共用表单，通过参数区分类型
-->
<template>
  <view class="publish-page">
    <!-- 导航栏占位（由 pages.json 全局导航栏处理） -->

    <scroll-view class="form-scroll" scroll-y>
      <!-- 发布类型分段器：失物 / 招领 -->
      <view class="section">
        <text class="section-label">发布类型</text>
        <view class="type-segment">
          <view
            class="segment-item"
            :class="{ active: formData.type === 'lost' }"
            @click="formData.type = 'lost'"
          >
            <text class="segment-icon">🔍</text>
            <text class="segment-text">发布失物</text>
          </view>
          <view
            class="segment-item"
            :class="{ active: formData.type === 'found' }"
            @click="formData.type = 'found'"
          >
            <text class="segment-icon">📦</text>
            <text class="segment-text">发布招领</text>
          </view>
        </view>
      </view>

      <!-- 物品名称 -->
      <view class="section">
        <text class="section-label">物品名称 <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="formData.name"
          maxlength="50"
          placeholder="请输入物品名称"
          placeholder-style="color: #CCCCCC"
        />
        <text v-if="errors.name" class="error-msg">{{ errors.name }}</text>
      </view>

      <!-- 物品分类 -->
      <view class="section">
        <text class="section-label">物品分类</text>
        <view class="category-picker" @click="showCategoryPicker">
          <text :class="formData.category ? 'selected' : 'placeholder'">
            {{ formData.category || '请选择分类' }}
          </text>
          <text class="picker-arrow">▼</text>
        </view>
      </view>

      <!-- 地点 -->
      <view class="section">
        <text class="section-label">
          {{ formData.type === 'lost' ? '丢失地点' : '捡拾地点' }} <text class="required">*</text>
        </text>
        <input
          class="form-input"
          v-model="formData.location"
          maxlength="200"
          placeholder="请输入地点"
          placeholder-style="color: #CCCCCC"
        />
        <text v-if="errors.location" class="error-msg">{{ errors.location }}</text>
      </view>

      <!-- 时间 -->
      <view class="section">
        <text class="section-label">
          {{ formData.type === 'lost' ? '丢失时间' : '捡拾时间' }} <text class="required">*</text>
        </text>
        <picker
          mode="date"
          :value="formData.occur_date"
          @change="onDateChange"
        >
          <view class="date-picker-display">
            <text :class="formData.occur_date ? 'selected' : 'placeholder'">
              {{ formData.occur_date || '请选择时间' }}
            </text>
            <text class="picker-arrow">📅</text>
          </view>
        </picker>
        <text v-if="errors.occur_time" class="error-msg">{{ errors.occur_time }}</text>
      </view>

      <!-- 图片上传 -->
      <view class="section">
        <text class="section-label">物品图片（最多4张）</text>
        <ImageUploader v-model:images="formData.images" />
      </view>

      <!-- 联系方式 -->
      <view class="section">
        <text class="section-label">联系方式 <text class="required">*</text></text>
        <input
          class="form-input"
          v-model="formData.contact"
          maxlength="100"
          placeholder="手机号或微信号"
          placeholder-style="color: #CCCCCC"
        />
        <text v-if="errors.contact" class="error-msg">{{ errors.contact }}</text>
      </view>

      <!-- 详细描述（选填） -->
      <view class="section">
        <text class="section-label">详细描述（选填）</text>
        <textarea
          class="form-textarea"
          v-model="formData.description"
          maxlength="500"
          placeholder="请描述物品的更多特征..."
          placeholder-style="color: #CCCCCC"
        />
        <text class="char-count">{{ formData.description.length }}/500</text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-area">
        <button
          class="submit-btn"
          :class="{ disabled: loading }"
          :disabled="loading"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ loading ? '提交中...' : '确认发布' }}
        </button>
      </view>

      <!-- 底部安全区 -->
      <view class="bottom-safe"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ImageUploader from '@/components/ImageUploader.vue'
import { publish, uploadImages } from '@/api/item.js'

// ==================== 分类选项 ====================
const CATEGORIES = ['电子产品', '证件', '书籍', '衣物', '其他']

// ==================== 表单数据 ====================
const formData = reactive({
  type: 'lost',           // 'lost' | 'found'
  name: '',                // 物品名称
  category: '',            // 物品分类
  location: '',            // 地点
  occur_date: '',          // 日期（展示用，格式 YYYY-MM-DD）
  contact: '',             // 联系方式
  description: '',         // 详细描述
  images: []               // 图片临时路径数组
})

// ==================== 校验错误 ====================
const errors = reactive({
  name: '',
  location: '',
  occur_time: '',
  contact: ''
})

// ==================== 状态 ====================
const loading = ref(false) // 提交中

// ==================== 方法 ====================

/**
 * 显示分类选择器（ActionSheet）
 */
function showCategoryPicker() {
  uni.showActionSheet({
    itemList: CATEGORIES,
    success: (res) => {
      formData.category = CATEGORIES[res.tapIndex]
    }
  })
}

/**
 * 日期选择器变更
 * @param {Object} e - picker change 事件
 */
function onDateChange(e) {
  formData.occur_date = e.detail.value
}

/**
 * 表单校验
 * @returns {boolean} 是否通过
 */
function validate() {
  let valid = true

  // 清空上一次的错误
  errors.name = ''
  errors.location = ''
  errors.occur_time = ''
  errors.contact = ''

  // 物品名称：1-50 字符
  if (!formData.name.trim()) {
    errors.name = '请输入物品名称'
    valid = false
  } else if (formData.name.trim().length > 50) {
    errors.name = '物品名称不能超过50个字符'
    valid = false
  }

  // 地点：非空
  if (!formData.location.trim()) {
    errors.location = '请输入地点'
    valid = false
  } else if (formData.location.trim().length > 200) {
    errors.location = '地点不能超过200个字符'
    valid = false
  }

  // 时间：非空
  if (!formData.occur_date) {
    errors.occur_time = '请选择时间'
    valid = false
  }

  // 联系方式：非空
  if (!formData.contact.trim()) {
    errors.contact = '请输入联系方式'
    valid = false
  } else if (formData.contact.trim().length > 50) {
    errors.contact = '联系方式不能超过50个字符'
    valid = false
  }

  return valid
}

/**
 * 提交发布
 */
async function handleSubmit() {
  // 前端校验
  if (!validate()) return
  if (loading.value) return

  loading.value = true
  try {
    // 1. 先上传图片（如果有选择图片）
    let imageUrls = []
    if (formData.images.length > 0) {
      uni.showToast({ title: '正在上传图片...', icon: 'loading', duration: 10000 })
      imageUrls = await uploadImages(formData.images)
      if (imageUrls.length === 0 && formData.images.length > 0) {
        uni.showToast({ title: '图片上传失败，请重试', icon: 'none' })
        loading.value = false
        return
      }
    }

    // 2. 构建提交数据
    const now = new Date()
    const occurTime = formData.occur_date + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':00'

    await publish({
      type: formData.type,
      name: formData.name.trim(),
      category: formData.category || '其他',
      location: formData.location.trim(),
      occur_time: occurTime,
      contact: formData.contact.trim(),
      description: formData.description.trim() || null,
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
    })

    uni.showToast({ title: '发布成功', icon: 'success' })

    // 延迟返回首页
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 800)
  } catch (err) {
    console.error('发布失败:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.publish-page {
  height: 100vh;
  background-color: #F5F6FA;
}

.form-scroll {
  height: 100%;
  padding: 24rpx;
}

/* ==================== 区块 ==================== */
.section {
  background-color: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
}

.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
}

.required {
  color: #E74C3C;
}

/* ==================== 输入框 ==================== */
.form-input {
  width: 100%;
  height: 80rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333333;
  background-color: #FAFAFA;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  color: #333333;
  background-color: #FAFAFA;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #BBBBBB;
  margin-top: 8rpx;
}

/* ==================== 错误提示 ==================== */
.error-msg {
  font-size: 24rpx;
  color: #E74C3C;
  margin-top: 8rpx;
  display: block;
}

/* ==================== 分段选择器 ==================== */
.type-segment {
  display: flex;
  flex-direction: row;
  gap: 20rpx;
}

.segment-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  border: 2rpx solid #E0E0E0;
  border-radius: 12rpx;
  background-color: #FAFAFA;
  transition: all 0.2s;
}

.segment-item.active {
  border-color: #4A90D9;
  background-color: #E8F2FD;
}

.segment-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.segment-text {
  font-size: 26rpx;
  color: #999999;
}

.segment-item.active .segment-text {
  color: #4A90D9;
  font-weight: bold;
}

/* ==================== 分类选择器 ==================== */
.category-picker,
.date-picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80rpx;
  border: 1px solid #E0E0E0;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background-color: #FAFAFA;
}

.selected {
  font-size: 28rpx;
  color: #333333;
}

.placeholder {
  font-size: 28rpx;
  color: #CCCCCC;
}

.picker-arrow {
  font-size: 24rpx;
  color: #999999;
}

/* ==================== 提交按钮 ==================== */
.submit-area {
  padding: 20rpx 0;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: #4A90D9;
  color: #FFFFFF;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 12rpx;
  border: none;
}

.submit-btn.disabled {
  background-color: #B0C8E0;
}

/* ==================== 底部安全区 ==================== */
.bottom-safe {
  height: 40rpx;
}
</style>
