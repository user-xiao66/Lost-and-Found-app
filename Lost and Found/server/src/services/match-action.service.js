const matchModel = require('../models/match.model')
const itemModel = require('../models/item.model')

async function markContacted(matchId, userId) {
  await getOperableMatch(matchId, userId)
  await matchModel.updateStatus(matchId, 'contacted')
  return matchModel.findById(matchId)
}

async function reject(matchId, userId) {
  const match = await getOwnedMatch(matchId, userId)
  if (match.status === 'completed') {
    throw { code: 400, message: '已完成的匹配不能拒绝' }
  }
  if (match.status === 'rejected') {
    return match
  }

  await matchModel.updateStatus(matchId, 'rejected')
  return matchModel.findById(matchId)
}

async function confirm(matchId, userId) {
  const match = await getOperableMatch(matchId, userId)
  const side = getUserSide(match, userId)

  await matchModel.confirmBySide(matchId, side)

  const updated = await matchModel.findById(matchId)
  if (updated.lost_confirmed && updated.found_confirmed) {
    await matchModel.complete(matchId)
    await itemModel.updateStatus(updated.lost_item_id, 'found')
    await itemModel.updateStatus(updated.found_item_id, 'found')
    return matchModel.findById(matchId)
  }

  return updated
}

async function getOperableMatch(matchId, userId) {
  const match = await getOwnedMatch(matchId, userId)
  if (['rejected', 'completed'].includes(match.status)) {
    throw { code: 400, message: '该匹配已结束，不能继续操作' }
  }
  if (match.lost_item_status !== 'active' || match.found_item_status !== 'active') {
    throw { code: 400, message: '关联物品已结束或已过期，不能继续操作' }
  }
  return match
}

async function getOwnedMatch(matchId, userId) {
  const match = await matchModel.findById(matchId)
  if (!match) {
    throw { code: 404, message: '匹配记录不存在' }
  }
  if (!isParticipant(match, userId)) {
    throw { code: 403, message: '无权操作该匹配记录' }
  }
  return match
}

function isParticipant(match, userId) {
  return String(match.lost_user_id) === String(userId) || String(match.found_user_id) === String(userId)
}

function getUserSide(match, userId) {
  return String(match.lost_user_id) === String(userId) ? 'lost' : 'found'
}

module.exports = { markContacted, reject, confirm }
