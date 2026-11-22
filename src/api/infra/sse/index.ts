import { http } from '@/http/http'
import { getEnvBaseUrlRoot } from '@/utils'

/** SSE 配置 */
export interface SseConfig {
  sseEnabled: boolean // SSE 是否开启
  ssePath?: string // SSE 接口路径前缀
  sseHeartbeatInterval?: number // SSE 心跳间隔，单位：毫秒
  sseRetryInterval?: number // SSE 重连间隔，单位：毫秒
  websocketEnabled: boolean // WebSocket 是否开启，通知推送弹窗选择推送方式使用
}

/** SSE 演示消息 */
export interface SseDemoSendReq {
  toUserId?: number // 接收人编号，为空时发送给所有管理员
  text: string // 消息内容
}

/** 获得 SSE 配置 */
export function getSseConfig() {
  return http.get<SseConfig>('/infra/sse/get-config')
}

/** 发送 SSE 演示消息 */
export function sendSseDemo(data: SseDemoSendReq) {
  return http.post<string>('/infra/sse/send-demo', data)
}

/** 关闭 SSE 连接：SSE 接口与 WebSocket 一样不带 /admin-api 前缀，所以使用根路径的完整地址 */
export function closeSseConnection(connectionId: string, ssePath = '/infra/sse') {
  return http.post<boolean>(`${getEnvBaseUrlRoot()}${ssePath}/close`, undefined, { connectionId })
}
