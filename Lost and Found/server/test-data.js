/**
 * 🔴 唯一可靠的数据注入脚本
 * 
 * 规则：永远不要用 PowerShell 的 ConvertTo-Json / Invoke-RestMethod 来插入含中文的数据！
 *       那会把中文全部变成 ? 号（hex: 3F3F3F...）。
 * 
 * 用法：node test-data.js
 * 功能：清空旧数据 → 插入 8 条测试物品（UTF-8 正确编码）
 */

const { query } = require('./src/config/db')

// 测试用户 ID（13900001111 注册后获得）
const USER_ID = 3

const items = [
  { type: 'lost', name: '华为手机', category: '电子产品', location: '图书馆二楼',
    occur_time: '2026-06-15 14:30:00', contact: '13900001111',
    desc: '黑色华为手机，蓝色手机壳' },
  { type: 'lost', name: '校园卡', category: '证件', location: '食堂一楼',
    occur_time: '2026-06-15 12:00:00', contact: '13900001111',
    desc: '张同学的校园卡' },
  { type: 'lost', name: '运动水杯', category: '其他', location: '操场',
    occur_time: '2026-06-16 08:00:00', contact: '13900001111',
    desc: '白色运动水杯' },
  { type: 'lost', name: '蓝牙耳机', category: '电子产品', location: '教学楼A103',
    occur_time: '2026-06-14 16:20:00', contact: '13900001111',
    desc: '白色 AirPods，带保护壳' },
  { type: 'lost', name: '黑色双肩包', category: '衣物', location: '图书馆二楼自习室',
    occur_time: '2026-06-17 14:30:00', contact: '13900001111',
    desc: '耐克黑色双肩包，内有课本和笔袋' },
  { type: 'found', name: '英语书', category: '书籍', location: '教学楼A201',
    occur_time: '2026-06-16 09:00:00', contact: '13900001111',
    desc: '大学英语第四册，第一页有笔记' },
  { type: 'found', name: '钥匙串', category: '其他', location: '操场看台',
    occur_time: '2026-06-15 18:00:00', contact: '13900001111',
    desc: '一串钥匙，有3把，带蓝色门禁卡' },
  { type: 'found', name: '黑色双肩包', category: '衣物', location: '图书馆一楼大厅',
    occur_time: '2026-06-17 15:00:00', contact: '13900001111',
    desc: '在图书馆捡到一个黑色双肩包' }
]

async function seed() {
  // 1. 清空所有旧数据（含乱码）
  console.log('清空旧数据...')
  await query('DELETE FROM item')
  await query('ALTER TABLE item AUTO_INCREMENT = 1')
  await query('DELETE FROM `match`')
  await query('ALTER TABLE `match` AUTO_INCREMENT = 1')
  await query('DELETE FROM notification')
  await query('ALTER TABLE notification AUTO_INCREMENT = 1')

  // 2. 插入测试数据
  console.log('插入测试数据...\n')
  for (const item of items) {
    const sql = `INSERT INTO item (user_id, type, name, category, location, occur_time, contact, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    const result = await query(sql,
      [USER_ID, item.type, item.name, item.category,
       item.location, item.occur_time, item.contact, item.desc]
    )
    const hex = Buffer.from(item.name, 'utf8').toString('hex').substring(0, 12)
    console.log(`  ✅ [${item.type}] id=${result.insertId} name="${item.name}" hex=${hex}...`)
  }

  // 3. 验证
  console.log('\n验证:')
  const count = await query('SELECT COUNT(*) AS c FROM item')
  console.log(`  item 表: ${count[0].c} 条`)
  const verify = await query('SELECT id, name, HEX(name) AS h FROM item')
  let bad = 0
  for (const r of verify) {
    if (/^(3F)+$/.test(r.h || '')) {
      console.log(`  ❌ id=${r.id} 损坏!`)
      bad++
    }
  }
  if (bad === 0) {
    console.log('  ✅ 全部数据 UTF-8 编码正确，无乱码')
  }
  
  console.log('\n完成！')
  process.exit(0)
}

seed().catch(err => {
  console.error('失败:', err)
  process.exit(1)
})
