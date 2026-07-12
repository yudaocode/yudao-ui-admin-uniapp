import { getSocialAuthRedirect } from '@/api/login'
import { SOCIAL_LOGIN_PAGE } from '@/router/config'

export type SocialLoginPurpose = 'login' | 'bind'

interface SocialLoginContextBase {
  purpose: SocialLoginPurpose
  socialType: number
  tenantId?: number
  redirect?: string
  createdAt: number
}

export interface SocialLoginAuthorizeContext extends SocialLoginContextBase {
  stage: 'authorize'
  state: string
}

export interface SocialLoginBindingContext extends SocialLoginContextBase {
  purpose: 'login'
  stage: 'binding'
  socialCode: string
  socialState: string
}

export type SocialLoginContext = SocialLoginAuthorizeContext | SocialLoginBindingContext

type SocialLoginContextInput
  = | Omit<SocialLoginAuthorizeContext, 'createdAt'>
    | Omit<SocialLoginBindingContext, 'createdAt'>

interface StartH5SocialAuthOptions {
  purpose: SocialLoginPurpose
  socialType: number
  tenantId?: number
  redirect?: string
}

const SOCIAL_LOGIN_CONTEXT_KEY = 'auth:social-login-context' // H5 授权跳转前的上下文
const SOCIAL_LOGIN_CONTEXT_TTL = 10 * 60 * 1000 // 授权上下文有效期

/** 发起 H5 三方授权跳转 */
export async function startH5SocialAuth(options: StartH5SocialAuthOptions) {
  // #ifdef H5
  clearSocialLoginContext()
  const callbackUrl = new URL(import.meta.env.VITE_APP_PUBLIC_BASE || '/', window.location.origin)
  const contextQuery = [
    `purpose=${options.purpose}`,
    `socialType=${options.socialType}`,
    options.tenantId ? `tenantId=${options.tenantId}` : '',
    options.redirect ? `redirect=${encodeURIComponent(options.redirect)}` : '',
  ].filter(Boolean).join('&')
  callbackUrl.search = encodeURIComponent(contextQuery) // 整体编码兼容钉钉回调参数丢失
  callbackUrl.hash = SOCIAL_LOGIN_PAGE
  const authUrl = await getSocialAuthRedirect(options.socialType, callbackUrl.toString())
  const state = new URL(authUrl).searchParams.get('state')
  if (!state) {
    return false
  }
  saveSocialLoginContext({
    stage: 'authorize',
    purpose: options.purpose,
    socialType: options.socialType,
    tenantId: options.tenantId,
    redirect: options.redirect,
    state,
  })
  window.location.href = authUrl
  return true
  // #endif

  // #ifndef H5
  return false
  // #endif
}

/** 保存三方登录上下文，防止授权平台丢弃回调参数 */
export function saveSocialLoginContext(context: SocialLoginContextInput) {
  const value: SocialLoginContext = { ...context, createdAt: Date.now() }
  // #ifdef H5
  window.sessionStorage.setItem(SOCIAL_LOGIN_CONTEXT_KEY, JSON.stringify(value))
  // #endif
  // #ifndef H5
  uni.setStorageSync(SOCIAL_LOGIN_CONTEXT_KEY, value)
  // #endif
}

/** 读取并移除三方登录上下文 */
export function takeSocialLoginContext(): SocialLoginContext | undefined {
  let context: SocialLoginContext | undefined
  // #ifdef H5
  const value = window.sessionStorage.getItem(SOCIAL_LOGIN_CONTEXT_KEY)
  if (value) {
    try {
      context = JSON.parse(value) as SocialLoginContext
    } catch {
      context = undefined
    }
  }
  // #endif
  // #ifndef H5
  context = uni.getStorageSync(SOCIAL_LOGIN_CONTEXT_KEY) as SocialLoginContext | undefined
  // #endif
  clearSocialLoginContext()
  const age = context?.createdAt ? Date.now() - context.createdAt : -1
  const validPurpose = context?.purpose === 'login' || context?.purpose === 'bind'
  return context?.socialType && validPurpose && age >= 0 && age <= SOCIAL_LOGIN_CONTEXT_TTL
    ? context
    : undefined
}

/** 清除三方登录上下文 */
export function clearSocialLoginContext() {
  // #ifdef H5
  window.sessionStorage.removeItem(SOCIAL_LOGIN_CONTEXT_KEY)
  // #endif
  // #ifndef H5
  uni.removeStorageSync(SOCIAL_LOGIN_CONTEXT_KEY)
  // #endif
}
