import { useToast } from 'wot-design-uni'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

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

/**
 * 上传文件到后端
 *
 * @param filePath 本地文件路径
 * @param directory 目录（可选）
 * @returns 文件访问 URL
 */
export function uploadFile(filePath: string, directory?: string): Promise<string> {
  const tokenStore = useTokenStore()
  const userStore = useUserStore()
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${import.meta.env.VITE_SERVER_BASEURL}/infra/file/upload`,
      filePath,
      name: 'file',
      header: {
        'Accept': '*/*',
        'tenant-id': userStore.tenantId,
        'Authorization': `Bearer ${tokenStore.validToken}`,
      },
      formData: directory ? { directory } : undefined,
      success: (res) => {
        if (res.statusCode === 200) {
          const result = JSON.parse(res.data)
          if (result.code === 0) {
            resolve(result.data)
          } else {
            const toast = useToast()
            toast.show(result.msg || '上传失败')
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
  })
}
