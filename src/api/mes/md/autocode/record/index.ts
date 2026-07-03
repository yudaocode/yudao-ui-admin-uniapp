import { http } from '@/http/http'

/** 生成编码（后端返回 CommonResult<String>） */
export function generateAutoCode(ruleCode: string, inputChar?: string) {
  return http.post<string>(`/mes/md/auto-code-record/generate`, { ruleCode, inputChar })
}
