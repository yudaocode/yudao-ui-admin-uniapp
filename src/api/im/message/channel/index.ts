import { http } from '@/http/http'

/** IM 频道消息 */
export interface ImChannelMessageRespVO {
  id: number
  clientMessageId?: string
  channelId: number
  materialId: number
  type: number
  content: string
  status?: number
  receiptStatus?: number
  sendTime: string
}

/** 拉取当前用户应收的频道消息 */
export function pullChannelMessages(params: { minId: number, size?: number }) {
  return http.get<ImChannelMessageRespVO[]>('/im/channel/message/pull', params)
}

/** 上报频道消息已读位置 */
export function readChannelMessages(channelId: number, messageId: number) {
  return http.put<boolean>('/im/channel/message/read', undefined, { channelId, messageId })
}
