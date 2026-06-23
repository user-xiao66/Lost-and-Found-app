# AGENTS.md - 前端与项目总览

## 项目定位

校园失物招领应用，前端使用 uni-app 构建移动端页面，后端在 `server/` 目录中独立维护。

## 技术栈

- 框架：uni-app + Vue 3
- 状态管理：Pinia
- 样式：SCSS / rpx
- 网络请求：`uni.request`，统一封装在 `api/request.js`
- 图片选择/上传：`uni.chooseImage` + `uni.uploadFile`

## 目录结构

```text
Lost and Found/
├── api/                 # 前端接口封装
│   ├── request.js       # 请求基类、BASE_URL、token 注入
│   ├── user.js          # 登录、注册、用户资料
│   ├── item.js          # 物品、上传、状态、管理操作
│   └── notification.js  # 匹配通知
├── components/          # 通用组件
│   ├── ItemCard.vue
│   ├── StatusBadge.vue
│   ├── ImageUploader.vue
│   └── EmptyState.vue
├── pages/               # 页面
│   ├── index/           # 首页列表
│   ├── search/          # 搜索筛选
│   ├── publish/         # 发布/编辑
│   ├── detail/          # 详情
│   ├── profile/         # 个人中心
│   ├── mine/            # 我的发布
│   ├── notifications/   # 通知
│   ├── login/           # 登录
│   ├── register/        # 注册
│   ├── settings/        # 设置
│   └── admin/           # 管理页面
├── store/               # Pinia store
├── static/              # 静态资源
├── server/              # Express 后端
├── App.vue              # 应用生命周期
├── main.js              # 应用入口
├── pages.json           # 页面路由和 tabBar
├── manifest.json        # uni-app 应用配置
└── uni.scss             # 全局样式变量
```

## 前端启动要求

本项目是 uni-app 项目，优先使用 HBuilderX 打开 `Lost and Found/` 目录运行。

如使用 CLI，需要先确认本地已安装 uni-app 对应工具链。当前 `package.json` 没有配置标准 `dev/build` scripts，不要默认执行 `npm run dev`。

前端运行前需要确认：

- 后端服务已启动，默认端口 `3000`
- `api/request.js` 中的 `BASE_URL` 指向可访问的后端地址
- 小程序或 App 端运行时需确认网络白名单、手机与后端网络互通

## 主要业务功能

- 用户注册、登录、退出
- 首页失物/招领列表
- 关键词搜索和条件筛选
- 发布失物或招领信息
- 图片选择与上传，最多 4 张
- 物品详情、联系方式展示
- 我的发布、编辑、删除、标记已找到
- 自动匹配通知列表
- 管理员物品状态管理入口

## 前端开发约定

- 页面和组件优先使用 Vue 3 `<script setup>`。
- 页面不要直接写 `uni.request`，统一从 `api/` 调用封装方法。
- 登录态统一通过 `store/user.js` 和本地 `token` 管理。
- 列表页要保留加载、空状态、分页触底逻辑。
- 图片字段后端可能返回 JSON 字符串，展示前需要兼容数组和字符串。
- 样式尽量使用 `scoped`，避免污染全局。
- 不要随意改动 `pages.json` 路由，新增页面后必须同步登记。

## 常见入口

- 应用入口：[main.js](./main.js)
- 全局生命周期：[App.vue](./App.vue)
- 页面配置：[pages.json](./pages.json)
- 请求封装：[api/request.js](./api/request.js)
- 用户状态：[store/user.js](./store/user.js)
- 后端说明：[server/AGENTS.md](./server/AGENTS.md)

## 注意事项

- 当前前端 API 地址存在硬编码，换网络或部署时需要调整。
- 本目录下历史文档可能存在编码显示异常，改动时保持文件为 UTF-8。
- 不要提交本地 IDE 缓存、构建产物、上传文件内容。
