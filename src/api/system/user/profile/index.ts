import { http } from '@/http/http'

/** 用户个人中心信息 */
export interface UserProfileVO {
  id: number
  username: string
  nickname: string
  email?: string
  mobile?: string
  sex?: number
  avatar?: string
  loginIp: string
  loginDate: string
  createTime: string
  roles: { id: number, name: string }[]
  dept: { id: number, name: string }
  posts: { id: number, name: string }[]
}

/** 更新个人信息请求 */
export interface UpdateProfileReqVO {
  nickname?: string
  email?: string
  mobile?: string
  sex?: number
  avatar?: string
}

/** 更新密码请求 */
export interface UpdatePasswordReqVO {
  oldPassword: string
  newPassword: string
}

/** 获取登录用户个人信息 */
export function getUserProfile() {
  return http.get<UserProfileVO>('/system/user/profile/get')
}

/** 修改用户个人信息 */
export function updateUserProfile(data: UpdateProfileReqVO) {
  return http.put<boolean>('/system/user/profile/update', data)
}

/** 修改用户个人密码 */
export function updateUserPassword(data: UpdatePasswordReqVO) {
  return http.put<boolean>('/system/user/profile/update-password', data)
}
