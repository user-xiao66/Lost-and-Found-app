<template>
  <text class="badge" :class="'badge-' + status">
    {{ label }}
  </text>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'active',
    validator: (val) => ['active', 'found', 'closed', 'expired'].includes(val)
  }
})

const label = computed(() => {
  const map = {
    active: '寻找中',
    found: '已找回',
    closed: '已关闭',
    expired: '已过期'
  }
  return map[props.status] || props.status
})
</script>

<style scoped>
.badge {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  line-height: 1.5;
}

.badge-active {
  background-color: #E8F2FD;
  color: #4A90D9;
}

.badge-found {
  background-color: #E8F8EE;
  color: #27AE60;
}

.badge-closed {
  background-color: #F0F0F0;
  color: #999999;
}

.badge-expired {
  background-color: #FFF3E6;
  color: #D9822B;
}
</style>
