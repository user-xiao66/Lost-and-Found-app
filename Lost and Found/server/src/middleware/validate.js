/**
 * 通用字段校验中间件工厂模块
 * 按 data-model.md 定义的校验规则创建可复用的校验中间件
 */

const { error } = require('../utils/response')

/**
 * 创建校验中间件
 * @param {Object} rules - 校验规则映射 { 字段名: [校验器函数, ...] }
 * @returns {Function} Express 中间件
 *
 * 示例：
 *   validate({
 *     name: [notEmpty('物品名称'), maxLength(50)],
 *     phone: [notEmpty('手机号'), isPhone()]
 *   })
 */
function validate(rules) {
  return (req, res, next) => {
    const data = { ...req.body }

    for (const [field, validators] of Object.entries(rules)) {
      for (const validator of validators) {
        const msg = validator(data[field])
        if (msg) {
          return res.json(error(400, msg))
        }
      }
    }
    next()
  }
}

// ==================== 校验器工厂函数 ====================

/**
 * 非空校验
 * @param {string} label - 字段中文名（用于错误提示）
 */
function notEmpty(label) {
  return (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${label}不能为空`
    }
    return null // 校验通过
  }
}

/**
 * 最大长度校验
 * @param {number} max - 最大字符数
 * @param {string} label - 字段中文名
 */
function maxLength(max, label) {
  return (value) => {
    if (value && String(value).length > max) {
      return `${label}不能超过${max}个字符`
    }
    return null
  }
}

/**
 * 最小长度校验
 * @param {number} min - 最小字符数
 * @param {string} label - 字段中文名
 */
function minLength(min, label) {
  return (value) => {
    if (value && String(value).length < min) {
      return `${label}不能少于${min}个字符`
    }
    return null
  }
}

/**
 * 手机号格式校验
 */
function isPhone() {
  return (value) => {
    if (value && !/^1\d{10}$/.test(value)) {
      return '手机号格式不正确'
    }
    return null
  }
}

/**
 * 密码强度校验（6-20位，字母+数字）
 */
function isPassword() {
  return (value) => {
    if (!value) return null
    if (value.length < 6 || value.length > 20) {
      return '密码长度需在 6-20 位之间'
    }
    if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
      return '密码需包含字母和数字'
    }
    return null
  }
}

module.exports = { validate, notEmpty, maxLength, minLength, isPhone, isPassword }
