import type { ImChannelMessageRespVO } from '@/api/im/message/channel'
import type { ImGroupMessageRespVO } from '@/api/im/message/group'
import type { ImPrivateMessageRespVO } from '@/api/im/message/private'

/** 聊天页统一消息类型 */
export type ChatMessage = (ImPrivateMessageRespVO | ImGroupMessageRespVO | ImChannelMessageRespVO) & {
  senderId: number
}

/** 聊天消息发送选项 */
export interface SendRawOptions {
  atUserIds?: number[] // @ 用户编号
  receipt?: boolean // 是否回执消息
}
