<!--
  图片上传组件
  支持 uni.chooseImage 选择图片，最多 4 张，展示缩略图 + 删除

  Props:
    images - Array<String> 已上传的图片 URL 列表（双向绑定 v-model:images）

  Events:
    update:images - 图片列表变化时触发
-->
<template>
  <view class="uploader">
    <view class="upload-list">
      <!-- 已选图片缩略图 -->
      <view v-for="(img, index) in images" :key="index" class="upload-item">
        <image :src="img" mode="aspectFill" class="upload-img" />
        <!-- 删除按钮 -->
        <view class="delete-btn" @click="removeImage(index)">
          <text class="delete-icon">×</text>
        </view>
      </view>

      <!-- 添加按钮（未满 4 张时显示） -->
      <view
        v-if="images.length < 4"
        class="upload-item upload-add"
        @click="chooseImage"
      >
        <text class="add-icon">+</text>
      </view>
    </view>

    <!-- 提示文字 -->
    <text class="upload-tip">最多4张，支持JPG/PNG（每张≤5MB）</text>
  </view>
</template>

<script setup>
// 双向绑定图片列表
const props = defineProps({
  images: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:images'])

/**
 * 选择图片
 */
function chooseImage() {
  const remain = 4 - props.images.length // 还可选几张
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    success: (res) => {
      // 追加新选中的图片路径
      const newImages = [...props.images, ...res.tempFilePaths]
      emit('update:images', newImages)
    },
    fail: (err) => {
      console.error('选择图片失败', err)
    }
  })
}

/**
 * 删除指定位置的图片
 * @param {number} index - 要删除的图片索引
 */
function removeImage(index) {
  const newImages = props.images.filter((_, i) => i !== index)
  emit('update:images', newImages)
}
</script>

<style scoped>
/* ==================== 上传容器 ==================== */
.uploader {
  width: 100%;
}

.upload-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20rpx;
}

/* ==================== 单个图片项 ==================== */
.upload-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  position: relative;
  overflow: hidden;
}

.upload-img {
  width: 100%;
  height: 100%;
}

/* 删除按钮（右上角圆形） */
.delete-btn {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 1;
}

/* ==================== 添加按钮 ==================== */
.upload-add {
  border: 2rpx dashed #CCCCCC;
  background-color: #FAFAFA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 64rpx;
  color: #CCCCCC;
  line-height: 1;
}

/* ==================== 提示文字 ==================== */
.upload-tip {
  display: block;
  font-size: 24rpx;
  color: #BBBBBB;
  margin-top: 16rpx;
}
</style>
