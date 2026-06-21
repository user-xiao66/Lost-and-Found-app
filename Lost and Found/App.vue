<!--
  App.vue — uni-app 应用根组件
  启动时检查登录状态，未登录则跳转登录页
-->
<script>
export default {
  /**
   * 应用启动时执行
   * 检查本地 token，未登录则延迟跳转登录页
   */
  onLaunch: function() {
    console.log('App Launch')

    // 检查本地是否有 token（登录态）
    const token = uni.getStorageSync('token')
    if (!token) {
      console.log('未登录，跳转登录页面')
      // 使用 reLaunch 清空页面栈，跳转到登录页
      // 延迟 100ms 确保页面渲染完成
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/login' })
      }, 100)
    }
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 每个页面公共 css */
page {
  background-color: #F5F6FA;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
    'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 28rpx;
  color: #333333;
}
</style>
