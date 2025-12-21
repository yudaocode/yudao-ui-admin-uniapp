import { http } from '@/http/http'

/** 地区信息 */
export interface Area {
  id: number
  name: string
  parentId?: number
  children?: Area[]
}

/** 获得地区树 */
export function getAreaTree() {
  return http.get<Area[]>('/system/area/tree')
}

/** 获得 IP 对应的地区名 */
export function getAreaByIp(ip: string) {
  return http.get<string>(`/system/area/get-by-ip?ip=${ip}`)
}
