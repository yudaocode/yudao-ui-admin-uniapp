import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

const baseUrl = '/mp/material'

/** 公众号素材 */
export interface Material {
  id: number
  accountId?: number
  appId?: string
  type?: string
  permanent?: boolean
  name?: string
  mediaId?: string
  url?: string
  mpUrl?: string
  title?: string
  introduction?: string
  createTime?: Date
}

/** 公众号素材分页查询参数 */
export interface MaterialPageParam extends PageParam {
  accountId: number
  type?: string
  permanent?: boolean
}

/** 获取公众号素材分页 */
export function getMaterialPage(params: MaterialPageParam) {
  return http.get<PageResult<Material>>(`${baseUrl}/page`, params)
}

/** 删除公众号永久素材 */
export function deletePermanentMaterial(id: number) {
  return http.delete<boolean>(`${baseUrl}/delete-permanent?id=${id}`)
}

/** 上传公众号永久素材 */
export function uploadPermanentMaterial(
  filePath: string,
  data: { accountId: number, type: string, title?: string, introduction?: string },
) {
  return doUploadMaterial('upload-permanent', filePath, data)
}

/** 上传公众号临时素材（自动回复 / 客服 / 菜单回复用临时素材） */
export function uploadTemporaryMaterial(
  filePath: string,
  data: { accountId: number, type: string },
) {
  return doUploadMaterial('upload-temporary', filePath, data)
}

/** 执行素材上传 */
async function doUploadMaterial(path: string, filePath: string, data: Record<string, any>) {
  const tokenStore = useTokenStore()
  const userStore = useUserStore()
  const token = await tokenStore.tryGetValidToken()
  return new Promise<Material>((resolve, reject) => {
    uni.uploadFile({
      url: getUploadUrl(path),
      filePath,
      name: 'file',
      header: {
        'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'tenant-id': userStore.tenantId,
      },
      formData: data,
      success: (res) => {
        let result: any
        try {
          result = JSON.parse(res.data)
        } catch {
          reject(new Error('上传响应解析失败'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && (result.code === 0 || result.code === 200)) {
          resolve(result.data)
        } else {
          reject(result)
        }
      },
      fail: reject,
    })
  })
}

/** 获取素材上传地址 */
function getUploadUrl(path: string) {
  // #ifdef H5
  if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
    return `${import.meta.env.VITE_APP_PROXY_PREFIX}${baseUrl}/${path}`
  }
  // #endif
  return `${getEnvBaseUrl()}${baseUrl}/${path}`
}
