# 失物招领 APP — 数据模型

## 一、实体关系图

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│   User   │       │    Item      │       │  Match   │
│  用户    │ 1──N  │   物品信息    │ N──M  │ 匹配记录  │
└──────────┘       └──────────────┘       └──────────┘
     │                    │                      │
     │ 1                  │ 1                    │ 1
     │                    │                      │
     └────── N ───────────┘                      │
          Notification                       由 Item
          站内通知                            关联产生
```

---

## 二、数据表定义

### 1. User（用户表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INT | 是 | 主键，自增 |
| `nickname` | VARCHAR(50) | 是 | 用户昵称 |
| `phone` | VARCHAR(11) | 是 | 手机号，唯一，用于登录 |
| `password` | VARCHAR(255) | 是 | 加密存储的密码 |
| `avatar` | VARCHAR(255) | 否 | 头像 URL |
| `created_at` | DATETIME | 是 | 注册时间 |

### 2. Item（物品信息表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INT | 是 | 主键，自增 |
| `user_id` | INT | 是 | 外键，发布者 ID |
| `type` | ENUM('lost','found') | 是 | 类型：`lost` 失物 / `found` 招领 |
| `name` | VARCHAR(100) | 是 | 物品名称 |
| `category` | VARCHAR(50) | 否 | 物品分类（电子产品/证件/书籍/衣物/其他） |
| `location` | VARCHAR(200) | 是 | 丢失或捡拾地点 |
| `occur_time` | DATETIME | 是 | 丢失或捡拾时间 |
| `contact` | VARCHAR(100) | 是 | 联系方式 |
| `description` | TEXT | 否 | 详细描述 |
| `images` | TEXT | 否 | 图片 URL 列表，JSON 数组格式，最多 4 张 |
| `status` | ENUM('active','found','closed') | 是 | 状态：`active` 寻找中 / `found` 已找到 / `closed` 已关闭 |
| `created_at` | DATETIME | 是 | 发布时间 |
| `updated_at` | DATETIME | 是 | 更新时间 |

### 3. Match（匹配记录表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INT | 是 | 主键，自增 |
| `lost_item_id` | INT | 是 | 外键，失物 ID |
| `found_item_id` | INT | 是 | 外键，招领 ID |
| `match_score` | INT | 是 | 匹配度评分（基于关键词重合数） |
| `created_at` | DATETIME | 是 | 匹配生成时间 |

### 4. Notification（通知表）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | INT | 是 | 主键，自增 |
| `user_id` | INT | 是 | 外键，接收通知的用户 ID |
| `type` | ENUM('match') | 是 | 通知类型：`match` 匹配通知 |
| `match_id` | INT | 是 | 外键，关联的匹配记录 ID |
| `is_read` | TINYINT | 是 | 是否已读：0 未读 / 1 已读 |
| `created_at` | DATETIME | 是 | 通知生成时间 |

---

## 三、前端数据模型（TypeScript 接口）

```typescript
// 用户信息
interface User {
  id: number;
  nickname: string;
  phone: string;
  avatar?: string;
  created_at: string;
}

// 物品信息
interface Item {
  id: number;
  user_id: number;
  type: 'lost' | 'found';       // 失物 / 招领
  name: string;                   // 物品名称
  category: string;               // 物品分类
  location: string;               // 地点
  occur_time: string;             // 丢失/捡拾时间
  contact: string;                // 联系方式
  description?: string;           // 详细描述
  images: string[];               // 图片 URL 数组
  status: 'active' | 'found' | 'closed';
  created_at: string;
  updated_at: string;
  // 关联字段（列表展示用）
  user_nickname?: string;
  user_avatar?: string;
}

// 匹配记录
interface Match {
  id: number;
  lost_item_id: number;
  found_item_id: number;
  match_score: number;
  created_at: string;
  // 关联字段
  lost_item?: Item;
  found_item?: Item;
}

// 通知
interface Notification {
  id: number;
  user_id: number;
  type: 'match';
  match_id: number;
  is_read: boolean;
  created_at: string;
  // 关联字段
  match?: Match;
}
```

---

## 四、验证规则

| 字段 | 规则 |
|------|------|
| `nickname` | 2-20 字符，不可为空 |
| `phone` | 11 位数字，符合中国大陆手机号格式 |
| `password` | 6-20 位，字母 + 数字 |
| `name` | 1-50 字符，不可为空 |
| `location` | 1-100 字符，不可为空 |
| `contact` | 手机号或微信号，1-50 字符 |
| `images` | 最少 0 张，最多 4 张 |
| `description` | 选填，最多 500 字符 |

---

## 五、匹配算法规则

匹配逻辑采用**关键词重合计分**方式：

1. **物品名称匹配**：对失物和招领的 `name` 字段进行分词，每一个重合词 +3 分
2. **地点匹配**：对失物和招领的 `location` 字段进行分词，每一个重合词 +2 分
3. **分类匹配**：`category` 字段完全一致 +5 分
4. **阈值判定**：总分 >= 3 分视为匹配成功，生成 Match 记录并推送通知

> 注意：仅对状态为 `active` 的失物与招领进行匹配。已标记 `found` 或 `closed` 的不参与匹配。
