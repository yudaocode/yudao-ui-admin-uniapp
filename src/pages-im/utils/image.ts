import type { ImImageMessage } from './message'
import { parseMessage } from './message'

/** 获取图片消息地址 */
export function getImageUrl(content?: string) {
  const image = parseMessage<ImImageMessage>(content)
  return image?.thumbnailUrl || image?.url || ''
}
