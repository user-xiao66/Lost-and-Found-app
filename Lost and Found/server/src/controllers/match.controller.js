/**
 * 匹配记录控制器
 * 查询与指定物品相关的匹配记录
 */

const matchModel = require('../models/match.model')
const { success, error } = require('../utils/response')

/**
 * 查询物品的匹配推荐
 * GET /api/items/:id/matches
 * 根据物品 type 自动选择按失物或招领查询
 */
async function getMatches(req, res) {
  try {
    const itemId = parseInt(req.params.id)
    const itemModel = require('../models/item.model')
    const item = await itemModel.findById(itemId)

    if (!item) {
      return res.json(error(404, '物品不存在'))
    }

    // 根据物品类型查对应的匹配
    const matches = item.type === 'lost'
      ? await matchModel.findByLostItemId(itemId)
      : await matchModel.findByFoundItemId(itemId)

    res.json(success(matches))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '获取匹配失败'))
  }
}

module.exports = { getMatches }
