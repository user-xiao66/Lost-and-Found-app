/**
 * 物品业务逻辑层
 */

const itemModel = require('../models/item.model')
const matchService = require('./match.service')
const { query } = require('../config/db')
const { paginatedResult } = require('../utils/pagination')

async function publish(data) {
  if (!data.expires_at) {
    data.expires_at = getDefaultExpiresAt()
  }

  const { id } = await itemModel.create(data)
  const item = await itemModel.findById(id)

  setImmediate(() => {
    matchService.tryMatch(item).catch(err => {
      console.error('匹配失败:', err.message)
    })
  })

  return item
}

async function getDetail(id, userId, isAdmin = false) {
  await itemModel.expireOverdueActiveItems()

  const item = await itemModel.findById(id)
  if (!item) {
    throw { code: 404, message: '物品信息不存在' }
  }

  const isOwner = String(item.user_id) === String(userId)
  const isMatchedParticipant = await canViewItemRelations(item, userId, isAdmin)

  if (item.status !== 'active' && !isOwner && !isAdmin && !isMatchedParticipant) {
    throw { code: 404, message: '物品信息不存在或已结束' }
  }

  if (item.contact && !isOwner && !isAdmin && !isMatchedParticipant) {
    item.contact = maskContact(item.contact)
  }

  return item
}

async function getList(filters) {
  await itemModel.expireOverdueActiveItems()

  const {
    type,
    keyword,
    category,
    location,
    status,
    startDate,
    endDate,
    page = 1,
    pageSize = 10,
    isAdmin = false
  } = filters

  const { list, total } = await itemModel.findList({
    type,
    keyword,
    category,
    location,
    startDate,
    endDate,
    status: status || undefined,
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10)
  })

  const safeList = isAdmin
    ? list
    : list.map(item => ({
        ...item,
        contact: maskContact(item.contact)
      }))

  return paginatedResult(safeList, total, page, pageSize)
}

async function getMyItems(userId, type, status, page = 1, pageSize = 10) {
  await itemModel.expireOverdueActiveItems()

  const { list, total } = await itemModel.findByUserId(userId, type, status, page, pageSize)
  return paginatedResult(list, total, page, pageSize)
}

async function markAsFound(id, userId, status = 'found') {
  const item = await itemModel.findById(id)
  if (!item) {
    throw { code: 404, message: '物品信息不存在' }
  }
  if (String(item.user_id) !== String(userId)) {
    throw { code: 403, message: '仅发布者可更新状态' }
  }
  if (!['found', 'closed'].includes(status)) {
    throw { code: 400, message: '状态只能为 found 或 closed' }
  }

  await itemModel.updateStatus(id, status)
}

async function updateItem(id, userId, data) {
  const item = await itemModel.findById(id)
  if (!item) throw { code: 404, message: '物品信息不存在' }
  if (String(item.user_id) !== String(userId)) throw { code: 403, message: '仅发布者可编辑' }
  if (item.status !== 'active') throw { code: 400, message: '已结束或已关闭的信息不能编辑' }

  validateItemUpdate(data)

  const updates = {}
  for (const key of ['name', 'category', 'location', 'occur_time', 'contact', 'description', 'images']) {
    if (data[key] !== undefined) {
      updates[key] = data[key]
    }
  }

  await itemModel.updateItem(id, updates)
  return itemModel.findById(id)
}

async function deleteItem(id, userId, isAdmin) {
  const item = await itemModel.findById(id)
  if (!item) throw { code: 404, message: '物品信息不存在' }
  if (!isAdmin && String(item.user_id) !== String(userId)) {
    throw { code: 403, message: '仅发布者或管理员可删除' }
  }
  await itemModel.updateStatus(id, 'closed')
}

async function canViewItemRelations(item, userId, isAdmin = false) {
  if (isAdmin) return true
  if (!item || !userId) return false
  if (String(item.user_id) === String(userId)) return true

  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM \`match\` m
     JOIN \`item\` li ON m.lost_item_id = li.id
     JOIN \`item\` fi ON m.found_item_id = fi.id
     WHERE (m.lost_item_id = ? OR m.found_item_id = ?)
       AND (li.user_id = ? OR fi.user_id = ?)`,
    [item.id, item.id, userId, userId]
  )

  return rows[0].count > 0
}

function validateItemUpdate(data) {
  if (data.name !== undefined && (!String(data.name).trim() || String(data.name).length > 50)) {
    throw { code: 400, message: '物品名称不能为空且不能超过50个字符' }
  }
  if (data.location !== undefined && (!String(data.location).trim() || String(data.location).length > 200)) {
    throw { code: 400, message: '地点不能为空且不能超过200个字符' }
  }
  if (data.contact !== undefined && (!String(data.contact).trim() || String(data.contact).length > 100)) {
    throw { code: 400, message: '联系方式不能为空且不能超过100个字符' }
  }
  if (data.description !== undefined && data.description && String(data.description).length > 500) {
    throw { code: 400, message: '详细描述不能超过500个字符' }
  }
  if (data.images !== undefined && data.images) {
    const imageList = parseImageList(data.images)
    if (imageList.length > 4) {
      throw { code: 400, message: '图片最多上传4张' }
    }
  }
}

function parseImageList(images) {
  if (Array.isArray(images)) return images
  if (typeof images !== 'string') return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getDefaultExpiresAt() {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)
  return formatDateTime(expiresAt)
}

function formatDateTime(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}

function maskContact(contact) {
  if (!contact) return ''
  if (/^1\d{10}$/.test(contact)) {
    return contact.slice(0, 3) + '****' + contact.slice(7)
  }
  if (contact.length > 4) {
    return contact.slice(0, 2) + '****' + contact.slice(-2)
  }
  return '****'
}

module.exports = {
  publish,
  getDetail,
  getList,
  getMyItems,
  markAsFound,
  updateItem,
  deleteItem,
  canViewItemRelations
}
