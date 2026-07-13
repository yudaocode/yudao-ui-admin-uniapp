import { uploadFile } from '@/api/infra/file'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'
import { useToast } from '@wot-ui/ui/components/wd-toast'

export interface SelectedChatFile {
  path: string
  name?: string
  size?: number
  type?: string
}

/** 提供聊天媒体选择、校验与上传能力 */
export function useMediaUploader() {
  const toast = useToast()

  /** 按当前平台选择一个聊天文件 */
  function chooseChatFile(): Promise<SelectedChatFile | undefined> {
    return new Promise((resolve) => {
      // #ifdef MP-WEIXIN
      wx.chooseMessageFile({
        count: 1,
        type: 'file',
        success: res => resolve(res.tempFiles?.[0] as SelectedChatFile | undefined),
        fail: () => resolve(undefined),
      })
      return
      // #endif

      // #ifdef H5 || APP-PLUS
      const chooseFile = (uni as any).chooseFile
      if (typeof chooseFile !== 'function') {
        // App 的任意文档选择依赖较新的运行基座
        // #ifdef APP-PLUS
        toast.show('当前 App 基座不支持选择文档，请升级后重试')
        // #endif
        resolve(undefined)
        return
      }
      chooseFile({
        count: 1,
        success: (res: { tempFiles?: SelectedChatFile[] }) => resolve(res.tempFiles?.[0]),
        fail: () => resolve(undefined),
      })
      // #endif
    })
  }

  /** 校验上传文件体积 */
  function validateFileSize(size: number | undefined, maxBytes: number) {
    if (size && size > maxBytes) {
      toast.show(`文件不能超过 ${Math.round(maxBytes / 1024 / 1024)} MB`)
      return false
    }
    return true
  }

  /** 上传本地临时文件 */
  function uploadLocalFile(filePath: string, directory: string) {
    return uploadFile(filePath, directory)
  }

  /** 上传 H5 Blob 文件 */
  async function uploadBlob(blob: Blob, fileName: string, directory: string) {
    const token = await useTokenStore().tryGetValidToken()
    const formData = new FormData()
    formData.append('file', blob, fileName)
    formData.append('directory', directory)
    const response = await fetch(`${getEnvBaseUrl()}/infra/file/upload`, {
      method: 'POST',
      headers: {
        'tenant-id': String(useUserStore().tenantId),
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    const result = await response.json()
    if (!response.ok || result.code !== 0) {
      throw new Error(result.msg || '上传失败')
    }
    return result.data as string
  }

  /** 获取本地图片信息 */
  function getLocalImageInfo(src: string) {
    return new Promise<UniApp.GetImageInfoSuccessData | null>((resolve) => {
      uni.getImageInfo({ src, success: resolve, fail: () => resolve(null) })
    })
  }

  return {
    chooseChatFile,
    validateFileSize,
    uploadLocalFile,
    uploadBlob,
    getLocalImageInfo,
  }
}
