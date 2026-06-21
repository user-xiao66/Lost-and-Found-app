/**
 * main.js — uni-app 应用入口
 * 创建 Vue 3 应用实例，挂载 Pinia 状态管理
 */

import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
// 引入 Pinia
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  // 挂载 Pinia 实例
  const pinia = createPinia()
  app.use(pinia)
  return { app, pinia }
}
// #endif
