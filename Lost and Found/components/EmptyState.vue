<!--
  空状态组件
  用于列表无数据、搜索无结果、通知为空等场景
  Props: message - 提示文字（默认"暂无数据"）
-->
<template>
  <view class="empty-state">
    <!-- 空盒子图标（纯 CSS 绘制） -->
    <view class="empty-icon">
      <view class="box-body"></view>
      <view class="box-lid"></view>
    </view>
    <text class="empty-text">{{ message }}</text>
  </view>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '暂无数据'
  }
})
</script>

<style scoped>
/* 居中容器 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

/* 空盒子图标（CSS 手绘） */
.empty-icon {
  width: 120rpx;
  height: 120rpx;
  position: relative;
  margin-bottom: 24rpx;
}

.box-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 90rpx;
  height: 80rpx;
  border: 4rpx solid #CCCCCC;
  border-radius: 8rpx;
  background-color: #F5F5F5;
}

.box-lid {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 110rpx;
  height: 20rpx;
  border: 4rpx solid #CCCCCC;
  border-radius: 8rpx 8rpx 0 0;
  background-color: #EEEEEE;
}

/* 提示文字 */
.empty-text {
  font-size: 28rpx;
  color: #999999;
}
</style>
