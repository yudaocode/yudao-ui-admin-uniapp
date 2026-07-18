import type { ImageMessage } from './message'
import { parseMessage } from './message'

/** 获取图片消息地址 */
export function getImageUrl(content?: string): string
export function getImageUrl(image?: Partial<ImageMessage> | null): string
export function getImageUrl(source?: string | Partial<ImageMessage> | null): string {
  const image = typeof source === 'string' ? parseMessage<ImageMessage>(source) : source
  return image?.thumbnailUrl || image?.url || ''
}
