/** 生成业务单号 */
export function generateOrderNo(prefix: string) {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const randomNo = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${prefix}${month}${day}${randomNo}`
}

/** 生成 WMS 编号 / 条码 */
export function generateWmsCode(prefix: string = ''): string {
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return prefix + result
}
