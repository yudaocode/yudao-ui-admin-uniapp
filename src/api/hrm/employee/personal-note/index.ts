import { http } from '@/http/http'

/** 员工个人备忘 */
export interface EmployeePersonalNote {
  content: string // 备忘内容
  reminderTime: number // 提醒时间
}

/** 创建员工个人备忘 */
export function createEmployeePersonalNote(data: EmployeePersonalNote) {
  return http.post<number>('/hrm/employee/personal-note/create', data)
}

/** 删除员工个人备忘 */
export function deleteEmployeePersonalNote(id: number) {
  return http.delete<boolean>(`/hrm/employee/personal-note/delete?id=${id}`)
}
