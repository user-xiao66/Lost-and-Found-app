/**
 * 分页工具模块
 * 用于统一处理列表接口的分页逻辑
 */

/**
 * 计算数据库查询的偏移量
 * @param {number} page - 当前页码（从 1 开始）
 * @param {number} pageSize - 每页条数
 * @returns {{ offset: number, limit: number }}
 */
function paginate(page = 1, pageSize = 10) {
  // 确保 page 和 pageSize 为正整数
  const p = Math.max(1, parseInt(page) || 1)
  const ps = Math.max(1, Math.min(100, parseInt(pageSize) || 10)) // 限制每页最多 100 条
  return {
    offset: (p - 1) * ps,
    limit: ps
  }
}

/**
 * 包装分页查询结果为统一格式
 * @param {Array} list - 当前页数据列表
 * @param {number} total - 总记录数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页条数
 * @returns {{ list: Array, total: number, page: number, page_size: number, total_pages: number }}
 */
function paginatedResult(list, total, page, pageSize) {
  return {
    list,
    total,
    page: parseInt(page) || 1,
    page_size: parseInt(pageSize) || 10,
    total_pages: Math.ceil(total / (parseInt(pageSize) || 10))
  }
}

module.exports = { paginate, paginatedResult }
