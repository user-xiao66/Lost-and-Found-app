/**
 * 匹配业务逻辑层
 * 实现失物与招领的关键词重合计分匹配算法
 */

const matchModel = require('../models/match.model')
const notificationModel = require('../models/notification.model')
const itemModel = require('../models/item.model')
const { query } = require('../config/db')

// 匹配分数阈值：总分 >= 3 分视为匹配成功
const MATCH_THRESHOLD = 3

/**
 * 尝试匹配新发布的物品
 * 失物 → 检索招领库；招领 → 检索失物库
 *
 * @param {Object} newItem - 新发布的物品对象
 */
async function tryMatch(newItem) {
  // 只对状态为 "active" 的物品进行匹配
  if (newItem.status !== 'active') return

  // 确定检索方向
  const oppositeType = newItem.type === 'lost' ? 'found' : 'lost'

  // 查询所有状态为 active 的对方类型物品
  const candidates = await query(
    'SELECT * FROM `item` WHERE `type` = ? AND `status` = ?',
    [oppositeType, 'active']
  )

  for (const candidate of candidates) {
    const score = calculateScore(newItem, candidate)

    // 分数达到阈值，生成匹配记录
    if (score >= MATCH_THRESHOLD) {
      // 确定失物和招领的 ID 顺序
      const lostItemId = newItem.type === 'lost' ? newItem.id : candidate.id
      const foundItemId = newItem.type === 'found' ? newItem.id : candidate.id

      // 1. 创建匹配记录
      const { id: matchId } = await matchModel.create({
        lost_item_id: lostItemId,
        found_item_id: foundItemId,
        match_score: score
      })

      // 2. 给双方各生成一条通知
      await notificationModel.create({
        user_id: newItem.user_id,
        type: 'match',
        match_id: matchId
      })
      await notificationModel.create({
        user_id: candidate.user_id,
        type: 'match',
        match_id: matchId
      })

      console.log(`匹配成功: 失物#${lostItemId} ↔ 招领#${foundItemId} (得分: ${score})`)
    }
  }
}

/**
 * 计算两个物品的匹配得分
 * 规则（来自 data-model.md）：
 *   - 物品名称关键词重合：每个 +3 分
 *   - 地点关键词重合：每个 +2 分
 *   - 分类完全一致：+5 分
 *
 * @param {Object} itemA - 物品 A
 * @param {Object} itemB - 物品 B
 * @returns {number} 匹配总分
 */
function calculateScore(itemA, itemB) {
  let score = 0

  // 1. 名称关键词重合（+3/词）
  const nameWordsA = tokenize(itemA.name)
  const nameWordsB = tokenize(itemB.name)
  for (const word of nameWordsA) {
    if (word.length >= 2 && nameWordsB.has(word)) {
      score += 3
    }
  }

  // 2. 地点关键词重合（+2/词）
  const locWordsA = tokenize(itemA.location)
  const locWordsB = tokenize(itemB.location)
  for (const word of locWordsA) {
    if (word.length >= 2 && locWordsB.has(word)) {
      score += 2
    }
  }

  // 3. 分类完全一致（+5）
  if (itemA.category && itemB.category && itemA.category === itemB.category) {
    score += 5
  }

  return score
}

/**
 * 简单分词：将中英文混合文本按 2 字滑动窗口切分
 * 同时保留原始空格分隔的词
 *
 * @param {string} text - 待分词文本
 * @returns {Set<string>} 词集合（去重）
 */
function tokenize(text) {
  if (!text) return new Set()
  const words = new Set()

  // 去除空格和标点
  const cleaned = text.replace(/[，。！？、\s,\.!\?\-_]+/g, '').toLowerCase()

  // 按 2 字滑动窗口生成 bigram
  for (let i = 0; i < cleaned.length - 1; i++) {
    words.add(cleaned.substring(i, i + 2))
  }

  // 也加入单字（用于英文单词场景）
  for (const ch of cleaned) {
    words.add(ch)
  }

  return words
}

module.exports = { tryMatch }
