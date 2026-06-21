<!--
  状态徽章组件
  用于展示物品或通知的状态标签
  Props: status - 'active' | 'found' | 'closed'
-->
<template>
  <text class="badge" :class="'badge-' + status">
    {{ label }}
  </text>
</template>

<script setup>
import { computed } from 'vue'

// 接收状态值
const props = defineProps({
  status: {
    type: String,
    default: 'active',
    // active=寻找中, found=已找到, closed=已关闭
    validator: (val) => ['active', 'found', 'closed'].includes(val)
  }
})

// 状态对应的中文标签
const label = computed(() => {
  const map = { active: '寻找中', found: '已找到', closed: '已关闭' }
  return map[props.status] || props.status
})
</script>

<style scoped>
/* 基础样式 */
.badge {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  line-height: 1.5;
}

/* active = 寻找中 → 蓝色 */
.badge-active {
  background-color: #E8F2FD;
  color: #4A90D9;
}

/* found = 已找到 → 绿色 */
.badge-found {
  background-color: #E8F8EE;
  color: #27AE60;
}

/* closed = 已关闭 → 灰色 */
.badge-closed {
  background-color: #F0F0F0;
  color: #999999;
}
</style>
