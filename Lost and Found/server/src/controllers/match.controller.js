/**
 * 匹配记录控制器
 * 查询与指定物品相关的匹配记录
 */

const matchModel = require('../models/match.model')
const itemService = require('../services/item.service')
const matchActionService = require('../services/match-action.service')
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

    const canView = await itemService.canViewItemRelations(
      item,
      req.userId,
      req.userRole === 'admin'
    )
    if (!canView) {
      return res.json(error(403, '无权查看该物品的匹配信息'))
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

async function markContacted(req, res) {
  try {
    const data = await matchActionService.markContacted(parseInt(req.params.id), req.userId)
    res.json(success(data, '已标记为已联系'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '操作失败'))
  }
}

async function reject(req, res) {
  try {
    const data = await matchActionService.reject(parseInt(req.params.id), req.userId)
    res.json(success(data, '已忽略该匹配'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '操作失败'))
  }
}

async function confirm(req, res) {
  try {
    const data = await matchActionService.confirm(parseInt(req.params.id), req.userId)
    res.json(success(data, data.status === 'completed' ? '双方已确认归还' : '已确认，等待对方确认'))
  } catch (err) {
    res.json(error(err.code || 500, err.message || '操作失败'))
  }
}

module.exports = { getMatches, markContacted, reject, confirm }
