import CryptoJS from 'crypto-js'

export const IotRawMessageMethodEnum = {
  RAW_POST: { method: 'thing.raw.post', name: '透传上报' },
  RAW_PUSH: { method: 'thing.raw.push', name: '透传下发' },
} as const // 原始透传消息方法

export const RAW_PAYLOAD_MAX_BYTES = 4096 // 透传载荷最大字节数
export const MODBUS_PDU_MIN_BYTES = 5 // Modbus PDU 最小字节数
export const MODBUS_PDU_MAX_BYTES = 253 // Modbus PDU 最大字节数
export const MODBUS_WRITE_FUNCTION_CODES = [0x05, 0x06, 0x0F, 0x10] // Modbus 写功能码，下发前需要二次确认

/** 获取原始透传消息方法名称 */
export function getRawMethodLabel(method?: string) {
  return Object.values(IotRawMessageMethodEnum).find(item => item.method === method)?.name || ''
}

/** 解析 HEX 文本：允许空白分隔，返回小写连续 HEX；格式不正确返回 undefined */
export function parseHex(text?: string) {
  const hex = (text || '').replace(/\s+/g, '')
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return undefined
  }
  return hex.toLowerCase()
}

/** 格式化 HEX：大写，每字节空格分隔 */
export function formatHex(hex?: string) {
  if (!hex) {
    return ''
  }
  return (hex.replace(/\s+/g, '').toUpperCase().match(/.{1,2}/g) || []).join(' ')
}

/** HEX 转 Base64 */
export function hexToBase64(hex: string) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hex))
}

/** Base64 转大写 HEX 展示文本；无法解析时返回空串（严格校验：标准字母表、正确的 padding 和长度） */
export function base64ToHex(base64?: string) {
  if (!base64 || base64.length % 4 !== 0 || !/^[a-z\d+/]*={0,2}$/i.test(base64)) {
    return ''
  }
  try {
    return formatHex(CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Hex))
  } catch {
    return ''
  }
}

/** 脚本内容的 hash 短码：UTF-8 内容 SHA-256 的前 12 位；内容为空返回空串 */
export function getScriptShortHash(content?: string | null) {
  if (!content) {
    return ''
  }
  return CryptoJS.SHA256(content).toString(CryptoJS.enc.Hex).slice(0, 12)
}
