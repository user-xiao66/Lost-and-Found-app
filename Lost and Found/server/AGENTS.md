# AGENTS.md - 后端

## 项目定位

失物招领应用后端，提供用户、物品、图片上传、自动匹配和站内通知接口。

## 技术栈

- 运行时：Node.js
- 框架：Express
- 数据库：MySQL
- 数据库驱动：mysql2/promise
- 鉴权：JWT (`jsonwebtoken`)
- 密码加密：bcryptjs
- 上传：multer
- 跨域：cors
- 开发运行：nodemon

## 目录结构

```text
server/
├── package.json
├── test-data.js
├── uploads/                 # 上传文件目录
├── sql/
│   └── init.sql             # 数据库初始化脚本
└── src/
    ├── app.js               # Express 入口
    ├── routes/
    │   └── index.js         # 路由汇总
    ├── controllers/         # 请求参数和响应处理
    ├── services/            # 业务逻辑
    ├── models/              # MySQL 数据访问
    ├── middleware/          # 鉴权、上传、校验
    ├── config/
    │   └── db.js            # 数据库连接池
    └── utils/               # 响应格式、分页工具
```

## 启动要求

需要先准备 MySQL，并创建数据库：

```sql
CREATE DATABASE lost_and_found DEFAULT CHARACTER SET utf8mb4;
```

然后导入：

```text
server/sql/init.sql
```

安装依赖：

```bash
npm install
```

开发启动：

```bash
npm run dev
```

生产启动：

```bash
npm start
```

默认服务地址：

```text
http://localhost:3000
```

健康检查：

```text
GET /api/health
```

## 环境变量

当前代码支持这些环境变量：

```text
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=lost_and_found
JWT_SECRET=lost_and_found_secret_key_2026
```

本地默认值在 `src/config/db.js` 和 `src/middleware/auth.js` 中。生产环境必须通过环境变量覆盖数据库密码和 JWT 密钥。

## 数据表

- `user`：用户信息
- `item`：失物/招领信息
- `match`：自动匹配记录
- `notification`：站内通知

注意：代码中使用了 `user.role` 做管理员判断，数据库脚本需要包含 `role` 字段，否则管理员和用户资料查询会出错。

## 接口模块

- `POST /api/users/register`：注册
- `POST /api/users/login`：登录
- `GET /api/users/profile`：当前用户资料
- `PUT /api/users/profile`：更新资料
- `POST /api/upload`：图片上传
- `GET /api/items`：物品列表
- `POST /api/items`：发布物品
- `GET /api/items/mine`：我的发布
- `GET /api/items/:id`：物品详情
- `PUT /api/items/:id`：编辑物品
- `DELETE /api/items/:id`：关闭/删除物品
- `PUT /api/items/:id/status`：发布者标记状态
- `GET /api/items/:id/matches`：匹配推荐
- `GET /api/notifications`：通知列表
- `GET /api/notifications/unread-count`：未读数量
- `PUT /api/notifications/:id/read`：标记已读
- `PUT /api/items/:id/admin-status`：管理员更新状态

## 后端开发约定

- Controller 只处理请求参数、权限上下文和响应。
- Service 负责业务逻辑，不直接拼接 HTTP 响应。
- Model 只负责数据库读写，SQL 参数必须使用占位符。
- 所有接口统一返回 `{ code, message, data }`。
- 需要登录的接口使用 `auth`，可选登录使用 `optionalAuth`，管理员接口使用 `adminAuth`。
- 列表接口保持分页返回：`list`、`total`、`page`、`page_size`、`total_pages`。
- 上传文件最多 4 张，字段名为 `images`。
- 不要把数据库密码、JWT 密钥、服务器地址硬编码到新增代码中。

## 注意事项

- `uploads/` 只保留目录，不应提交真实上传文件。
- `PUT /items/:id/status` 当前 service 固定写入 `found`，如需支持 `closed` 需要同步调整 service。
- 静态资源通过 `/uploads` 对外暴露。
