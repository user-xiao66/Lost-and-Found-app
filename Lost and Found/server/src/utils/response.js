/**
 * 统一响应格式工具模块
 * 所有接口返回数据必须使用此模块包装
 * 统一结构：{ code: number, message: string, data: any }
 */

/**
 * 成功响应
 * @param {*} data - 返回的数据
 * @param {string} message - 提示信息，默认 "success"
 * @returns {{ code: 200, message: string, data: * }}
 */
function success(data = null, message = 'success') {
  return {
    code: 200,
    message,
    data
  }
}

/**
 * 错误响应
 * @param {number} code - 错误码
 * @param {string} message - 错误提示信息
 * @returns {{ code: number, message: string, data: null }}
 */
function error(code = 500, message = '服务器内部错误') {
  return {
    code,
    message,
    data: null
  }
}

module.exports = { success, error }
