import type {
  AuthPermissionInfo,
  IAuthLoginRes,
  ICaptcha,
  IDoubleTokenRes,
} from './types/login'
import { http } from '@/http/http'

export const AUTH_THIRD_LOGIN_NOT_BIND_CODE = 1002000005 // 三方账号尚未绑定

/**
 * 登录表单
 */
export interface ILoginForm {
  type: 'username' | 'register' | 'sms'
  username?: string
  password?: string
  nickname?: string
  captchaVerification?: string
  mobile?: string
  code?: string
  socialType?: number
  socialCode?: string
  socialState?: string
}

/** 社交登录请求 */
export interface AuthSocialLoginReq {
  type: number
  code: string
  state: string
}

/** 账号密码登录 Request VO */
export interface AuthLoginReqVO {
  password?: string
  username?: string
  captchaVerification?: string
  // 绑定社交登录时，需要传递如下参数
  socialType?: number
  socialCode?: string
  socialState?: string
}

/** 注册 Request VO */
export interface AuthRegisterReqVO {
  username: string
  password: string
  captchaVerification: string
}

/** 短信登录 Request VO */
export interface AuthSmsLoginReqVO {
  mobile: string
  code: string
}

/** 发送短信验证码 Request VO */
export interface AuthSmsSendReqVO {
  mobile: string
  scene: number
}

/** 租户信息 */
export interface TenantVO {
  id: number
  name: string
}

/** 重置密码 Request VO */
export interface AuthResetPasswordReqVO {
  mobile: string
  code: string
  password: string
}

/** 获取验证码 */
export function getCode(data: any) {
  return http.post<ICaptcha>('/system/captcha/get', data, null, null, { original: true })
}

/** 校验验证码 */
export function checkCaptcha(data: any) {
  return http.post<boolean>('/system/captcha/check', data, null, null, { original: true })
}

/** 使用账号密码登录 */
export function login(data: AuthLoginReqVO) {
  return http.post<IAuthLoginRes>('/system/auth/login', data)
}

/** 注册用户 */
export function register(data: AuthRegisterReqVO) {
  return http.post<IAuthLoginRes>('/system/auth/register', data)
}

/** 短信登录 */
export function smsLogin(data: AuthSmsLoginReqVO) {
  return http.post<IAuthLoginRes>('/system/auth/sms-login', data)
}

/** 发送短信验证码 */
export function sendSmsCode(data: AuthSmsSendReqVO) {
  return http.post<boolean>('/system/auth/send-sms-code', data)
}

/** 获取租户简单列表 */
export function getTenantSimpleList() {
  return http.get<TenantVO[]>('/system/tenant/simple-list')
}

/** 根据租户域名获取租户信息 */
export function getTenantByWebsite(website: string) {
  return http.get<TenantVO>(`/system/tenant/get-by-website?website=${website}`)
}

/** 通过短信重置密码 */
export function smsResetPassword(data: AuthResetPasswordReqVO) {
  return http.post<boolean>('/system/auth/reset-password', data)
}

/** 刷新token */
export function refreshToken(refreshToken: string) {
  return http.post<IDoubleTokenRes>(`/system/auth/refresh-token?refreshToken=${refreshToken}`)
}

/** 获取权限信息 */
export function getAuthPermissionInfo() {
  return http.get<AuthPermissionInfo>('/system/auth/get-permission-info')
}

/** 退出登录 */
export function logout() {
  return http.post<void>('/system/auth/logout')
}

/** 获取社交授权地址 */
export function getSocialAuthRedirect(type: number, redirectUri: string) {
  return http.get<string>('/system/auth/social-auth-redirect', { type, redirectUri })
}

/** 社交快捷登录 */
export function socialLogin(data: AuthSocialLoginReq) {
  return http.post<IAuthLoginRes>('/system/auth/social-login', data, undefined, undefined, {
    hideErrorToast: true,
  })
}
