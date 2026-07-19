import type { IDoubleTokenRes } from '@/api/types/login'
import type { CustomRequestOptions, IResponse } from '@/http/types'
import { nextTick } from 'vue'
import { useTokenStore } from '@/store/token'
import { getLastPage, isDoubleTokenMode } from '@/utils'
import { ApiEncrypt } from '@/utils/encrypt'
import { toLoginPage } from '@/utils/toLoginPage'
import { ResultEnum } from './tools/enum'

// 刷新 token 状态管理
let refreshing = false // 防止重复刷新 token 标识
let refreshFailedReason: any = null // 刷新失败处理中的拒绝原因
let loginExpiredHandling = false // 防止重复处理登录失效
let taskQueue: RefreshTask[] = [] // 刷新 token 请求队列

interface RefreshTask {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  options: CustomRequestOptions
}

/** 拒绝刷新 token 队列 */
function rejectTaskQueue(reason?: any) {
  const tasks = [...taskQueue]
  taskQueue = []
  tasks.forEach(task => task.reject(reason))
}

/** 重放刷新 token 队列 */
async function replayTaskQueue() {
  while (taskQueue.length) {
    const tasks = [...taskQueue]
    taskQueue = []
    await Promise.allSettled(
      tasks.map(task =>
        http({ ...task.options, __isRefreshTokenRetry: true }).then(task.resolve).catch(task.reject),
      ),
    )
  }
}

/** 处理登录失效 */
async function handleLoginExpired(tokenStore: ReturnType<typeof useTokenStore>) {
  if (loginExpiredHandling) {
    return
  }
  loginExpiredHandling = true
  await nextTick()
  // 关闭其他弹窗
  uni.hideToast()
  uni.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
  })
  // 清除用户信息
  await tokenStore.logout()
  // 跳转到登录页
  setTimeout(() => {
    // 优化 by 芋艿：跳转登录页时，携带上次浏览的页面地址，登录成功后可以跳回去
    const lastPage = getLastPage()
    let queryString = ''
    if (lastPage) {
      const fullPath = lastPage.$page?.fullPath || `/${lastPage.route}`
      queryString = `?redirect=${encodeURIComponent(fullPath)}`
    }
    toLoginPage({ queryString })
    loginExpiredHandling = false
  }, 2000)
}

export function http<T>(options: CustomRequestOptions) {
  // 1. 返回 Promise 对象
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: async (res) => {
        let responseData = res.data as IResponse<T>
        // add by panda：检查是否需要解密响应数据
        const encryptHeader = ApiEncrypt.getEncryptHeader()
        const isEncryptResponse = res.header[encryptHeader] === 'true' || res.header[encryptHeader.toLowerCase()] === 'true'
        if (isEncryptResponse && typeof responseData === 'string') {
          try {
            // 解密响应数据
            responseData = ApiEncrypt.decryptResponse(responseData)
          } catch (error) {
            console.error('响应数据解密失败:', error)
            throw new Error(`响应数据解密失败: ${(error as Error).message}`)
          }
        }

        const { code } = responseData
        // 检查是否是401错误（包括HTTP状态码401或业务码401）
        const isTokenExpired = res.statusCode === 401 || code === 401

        if (isTokenExpired) {
          const tokenStore = useTokenStore()
          // 已在处理登录失效时，后续 401 直接拒绝，避免 logout 等请求再次触发刷新
          if (loginExpiredHandling) {
            return reject(res)
          }
          // 对应帖子：https://t.zsxq.com/UHHUR
          // 刷新 token 后重试仍 401，说明不是 accessToken 过期，避免进入无限刷新
          if (options.__isRefreshTokenRetry) {
            await handleLoginExpired(tokenStore)
            return reject(res)
          }
          // refresh-token 本身失效时直接抛给外层刷新流程处理
          if (options.url?.includes('/refresh-token')) {
            return reject(res)
          }
          if (!isDoubleTokenMode) {
            // 未启用双token策略，清理用户信息，跳转到登录页
            await handleLoginExpired(tokenStore)
            return reject(res)
          }

          /* -------- 无感刷新 token ----------- */
          if (refreshFailedReason) {
            return reject(refreshFailedReason)
          }

          const { refreshToken } = tokenStore.tokenInfo as IDoubleTokenRes || {}
          // token 失效的，且有刷新 token 的，才放到请求队列里
          if (refreshToken) {
            taskQueue.push({
              resolve,
              reject,
              options,
            })
          }

          // 如果有 refreshToken 且未在刷新中，发起刷新 token 请求
          if (refreshToken && !refreshing) {
            refreshing = true
            refreshFailedReason = null
            try {
              // 发起刷新 token 请求（使用 store 的 refreshToken 方法）
              await tokenStore.refreshToken()
              // 将任务队列的所有任务重新请求；重放期间晚到的旧 401 也纳入同一轮，避免再次刷新
              await replayTaskQueue()
            } catch (refreshErr) {
              console.error('刷新 token 失败:', refreshErr)
              refreshFailedReason = refreshErr
              rejectTaskQueue(refreshErr)
              // 刷新 token 失败，跳转到登录页
              await handleLoginExpired(tokenStore)
            } finally {
              refreshing = false
              // 不管刷新 token 成功与否，都清空任务队列
              if (refreshFailedReason) {
                rejectTaskQueue(refreshFailedReason)
              } else {
                taskQueue = []
              }
              refreshFailedReason = null
            }
          }

          if (!refreshToken) {
            await handleLoginExpired(tokenStore)
            return reject(res)
          }
          return
        }

        // 处理其他成功状态（HTTP状态码200-299）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // add by panda 25.12.10：如果设置了 original 为 true，则返回原始数据。例如说：滑块验证码，有自己的返回格式
          if (options.original) {
            return resolve(responseData as unknown as T)
          }
          // 处理业务逻辑错误
          if (code !== ResultEnum.Success0 && code !== ResultEnum.Success200) {
            // add by 芋艿：后端返回的 msg 提示
            !options.hideErrorToast
            && uni.showToast({
              icon: 'none',
              title: responseData.msg || responseData.message || '请求错误',
            })
            // add by 芋艿：reject 替代原本的 resolve，避免调用的地方以为请求成功
            return reject(responseData)
          }
          if (options.returnRawResponse) {
            return resolve(responseData as unknown as T)
          }
          return resolve(responseData.data)
        }

        // 处理其他错误
        !options.hideErrorToast
        && uni.showToast({
          icon: 'none',
          title: (res.data as any).msg || '请求错误',
        })
        reject(res)
      },
      // 响应失败
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @param options 其他配置项
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @param options 其他配置项
 * @returns
 */
export function httpPost<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}
/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, data?: Record<string, any>, query?: Record<string, any>, header?: Record<string, any>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

// 支持与 axios 类似的API调用
http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete
