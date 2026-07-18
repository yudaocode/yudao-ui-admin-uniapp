import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

/** 文件信息 */
export interface FileVO {
  id?: number
  configId?: number
  path: string
  name?: string
  url?: string
  size?: number
  type?: string
  createTime?: Date
}

/** 文件预签名信息 */
export interface FilePresignedUrlRespVO {
  configId: number // 配置编号
  uploadUrl: string // 文件上传 URL
  url: string // 文件访问 URL
  path: string // 文件路径
}

/** 创建文件请求 */
export interface FileCreateReqVO {
  configId: number
  url: string
  path: string
  name: string
  type?: string
  size?: number
}

/** 获取文件预签名地址 */
export function getFilePresignedUrl(name: string, directory?: string) {
  return http.get<FilePresignedUrlRespVO>('/infra/file/presigned-url', { name, directory })
}

/** 创建文件记录 */
export function createFile(data: FileCreateReqVO) {
  return http.post<string>('/infra/file/create', data)
}

/** 获取文件分页列表 */
export function getFilePage(params: PageParam) {
  return http.get<PageResult<FileVO>>('/infra/file/page', params)
}

/** 获取文件详情 */
export function getFile(id: number) {
  return http.get<FileVO>(`/infra/file/get?id=${id}`)
}

/** 删除文件 */
export function deleteFile(id: number) {
  return http.delete(`/infra/file/delete?id=${id}`)
}

/**
 * 上传文件到后端
 *
 * @param filePath 本地文件路径
 * @param directory 目录（可选）
 * @returns 文件访问 URL
 */
export async function uploadFile(
  filePath: string,
  directory?: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const userStore = useUserStore()
  const token = await useTokenStore().tryGetValidToken()
  return new Promise((resolve, reject) => {
    const task = uni.uploadFile({
      url: `${getEnvBaseUrl()}/infra/file/upload`,
      filePath,
      name: 'file',
      header: {
        'Accept': '*/*',
        'tenant-id': userStore.tenantId,
        'Authorization': `Bearer ${token}`,
      },
      formData: directory ? { directory } : undefined,
      success: (res) => {
        if (res.statusCode === 200) {
          const result = JSON.parse(res.data)
          if (result.code === 0) {
            resolve(result.data)
          } else {
            reject(new Error(result.msg || '上传失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        console.error('上传失败：', err)
        reject(err)
      },
    })
    task.onProgressUpdate?.(event => onProgress?.(event.progress))
  })
}
