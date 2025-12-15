/**
 * 文件上传工具
 *
 * 支持两种上传模式：
 * - server: 后端上传（默认）
 * - client: 前端直连上传（仅支持 S3 服务）
 *
 * 通过环境变量 VITE_UPLOAD_TYPE 配置
 */

import { useToast } from 'wot-design-uni'
import * as FileApi from '@/api/infra/file'

/** 上传类型 */
const UPLOAD_TYPE = {
  /** 客户端直接上传（只支持S3服务） */
  CLIENT: 'client',
  /** 客户端发送到后端上传 */
  SERVER: 'server',
}

/**
 * 读取文件二进制内容
 * @param uniFile 文件对象
 */
async function readFile(uniFile: { path: string, arrayBuffer?: () => Promise<ArrayBuffer> }): Promise<ArrayBuffer | string> {
  // 微信小程序
  if (uni.getFileSystemManager) {
    const fs = uni.getFileSystemManager()
    return fs.readFileSync(uniFile.path) as ArrayBuffer
  }
  // H5 等
  if (uniFile.arrayBuffer) {
    return uniFile.arrayBuffer()
  }
  throw new Error('不支持的文件读取方式')
}

/**
 * 创建文件记录（异步）
 * @param presignedInfo 预签名信息
 * @param file 文件信息
 */
function createFileRecord(presignedInfo: FileApi.FilePresignedUrlRespVO, file: { name: string, type?: string, size?: number }) {
  const fileVo: FileApi.FileCreateReqVO = {
    configId: presignedInfo.configId,
    url: presignedInfo.url,
    path: presignedInfo.path,
    name: file.name,
    type: file.type,
    size: file.size,
  }
  FileApi.createFile(fileVo).catch((err) => {
    console.error('创建文件记录失败:', err, fileVo)
  })
}

/**
 * 从文件路径上传文件（纯文件上传）
 * @param filePath 文件路径
 * @param directory 目录（可选）
 * @returns 文件访问 URL
 */
export async function uploadFileFromPath(filePath: string, directory?: string, fileType?: string): Promise<string> {
  const fileName = filePath.includes('/') ? filePath.substring(filePath.lastIndexOf('/') + 1) : filePath
  const uploadType = import.meta.env.VITE_UPLOAD_TYPE || UPLOAD_TYPE.SERVER
  // 根据文件后缀推断 MIME 类型
  const mimeType = fileType || getMimeType(fileName)

  // 情况一：前端直连上传
  if (uploadType === UPLOAD_TYPE.CLIENT) {
    // 1.1 获取文件预签名地址
    const presignedInfo = await FileApi.getFilePresignedUrl(fileName, directory)

    // 1.2 获取二进制文件对象
    const fileBuffer = await readFile({ path: filePath })

    // 返回上传的 Promise
    return new Promise((resolve, reject) => {
      // 1.3 上传到 S3
      uni.request({
        url: presignedInfo.uploadUrl,
        method: 'PUT',
        header: {
          'Content-Type': mimeType,
        },
        data: fileBuffer,
        success: () => {
          // 1.4. 记录文件信息到后端（异步）
          createFileRecord(presignedInfo, { name: fileName, type: mimeType })
          // 1.5 返回文件访问 URL
          resolve(presignedInfo.url)
        },
        fail: (err) => {
          console.error('上传到S3失败:', err, presignedInfo)
          reject(err)
        },
      })
    })
  } else {
    // 情况二：后端上传
    return FileApi.uploadFile(filePath, directory)
  }
}

/** 根据文件名获取 MIME 类型 */
function getMimeType(fileName: string): string {
  const ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

export interface UploadOptions {
  /** 最大可选择的图片数量，默认为1 */
  count?: number
  /** 所选的图片的尺寸，original-原图，compressed-压缩图 */
  sizeType?: Array<'original' | 'compressed'>
  /** 选择图片的来源，album-相册，camera-相机 */
  sourceType?: Array<'album' | 'camera'>
  /** 文件大小限制，单位：MB */
  maxSize?: number //
  /** 上传进度回调函数 */
  onProgress?: (progress: number) => void
  /** 上传成功回调函数 */
  onSuccess?: (res: Record<string, any>) => void
  /** 上传失败回调函数 */
  onError?: (err: Error | UniApp.GeneralCallbackResult) => void
  /** 上传完成回调函数（无论成功失败） */
  onComplete?: () => void
}

/**
 * 文件上传钩子函数（带 formData）
 * @template T 上传成功后返回的数据类型
 * @param url 上传地址
 * @param formData 额外的表单数据
 * @param options 上传选项
 * @returns 上传状态和控制对象
 */
export function useUpload<T = string>(url: string, formData: Record<string, any> = {}, options: UploadOptions = {},
  /** 直接传入文件路径，跳过选择器 */
  directFilePath?: string) {
  /** 上传中状态 */
  const loading = ref(false)
  /** 上传错误状态 */
  const error = ref(false)
  /** 上传成功后的响应数据 */
  const data = ref<T>()
  /** 上传进度（0-100） */
  const progress = ref(0)
  const toast = useToast()

  /** 解构上传选项，设置默认值 */
  const {
    /** 最大可选择的图片数量 */
    count = 1,
    /** 所选的图片的尺寸 */
    sizeType = ['original', 'compressed'],
    /** 选择图片的来源 */
    sourceType = ['album', 'camera'],
    /** 文件大小限制（MB） */
    maxSize = 10,
    /** 进度回调 */
    onProgress,
    /** 成功回调 */
    onSuccess,
    /** 失败回调 */
    onError,
    /** 完成回调 */
    onComplete,
  } = options

  /**
   * 检查文件大小是否超过限制
   * @param size 文件大小（字节）
   * @returns 是否通过检查
   */
  const checkFileSize = (size: number) => {
    const sizeInMB = size / 1024 / 1024
    if (sizeInMB > maxSize) {
      // 注释 by 芋艿：使用 wd-toast 替代
      // uni.showToast({
      //   title: `文件大小不能超过${maxSize}MB`,
      //   icon: 'none',
      // })
      toast.show(`文件大小不能超过${maxSize}MB`)
      return false
    }
    return true
  }
  /**
   * 触发文件选择和上传
   * 根据平台使用不同的选择器：
   * - 微信小程序使用 chooseMedia
   * - 其他平台使用 chooseImage
   */
  const run = () => {
    if (directFilePath) {
      // 直接使用传入的文件路径
      loading.value = true
      progress.value = 0
      uploadFile<T>({
        url,
        tempFilePath: directFilePath,
        formData,
        data,
        error,
        loading,
        progress,
        onProgress,
        onSuccess,
        onError,
        onComplete,
      })
      return
    }

    // #ifdef MP-WEIXIN
    // 微信小程序环境下使用 chooseMedia API
    uni.chooseMedia({
      count,
      mediaType: ['image'], // 仅支持图片类型
      sourceType,
      success: (res) => {
        const file = res.tempFiles[0]
        // 检查文件大小是否符合限制
        if (!checkFileSize(file.size))
          return

        // 开始上传
        loading.value = true
        progress.value = 0
        uploadFile<T>({
          url,
          tempFilePath: file.tempFilePath,
          formData,
          data,
          error,
          loading,
          progress,
          onProgress,
          onSuccess,
          onError,
          onComplete,
        })
      },
      fail: (err) => {
        console.error('选择媒体文件失败:', err)
        error.value = true
        onError?.(err)
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    // 非微信小程序环境下使用 chooseImage API
    uni.chooseImage({
      count,
      sizeType,
      sourceType,
      success: (res) => {
        console.log('选择图片成功:', res)

        // 开始上传
        loading.value = true
        progress.value = 0
        uploadFile<T>({
          url,
          tempFilePath: res.tempFilePaths[0],
          formData,
          data,
          error,
          loading,
          progress,
          onProgress,
          onSuccess,
          onError,
          onComplete,
        })
      },
      fail: (err) => {
        console.error('选择图片失败:', err)
        error.value = true
        onError?.(err)
      },
    })
    // #endif
  }

  return { loading, error, data, progress, run }
}

/**
 * 文件上传选项接口
 * @template T 上传成功后返回的数据类型
 */
interface UploadFileOptions<T> {
  /** 上传地址 */
  url: string
  /** 临时文件路径 */
  tempFilePath: string
  /** 额外的表单数据 */
  formData: Record<string, any>
  /** 上传成功后的响应数据 */
  data: Ref<T | undefined>
  /** 上传错误状态 */
  error: Ref<boolean>
  /** 上传中状态 */
  loading: Ref<boolean>
  /** 上传进度（0-100） */
  progress: Ref<number>
  /** 上传进度回调 */
  onProgress?: (progress: number) => void
  /** 上传成功回调 */
  onSuccess?: (res: Record<string, any>) => void
  /** 上传失败回调 */
  onError?: (err: Error | UniApp.GeneralCallbackResult) => void
  /** 上传完成回调 */
  onComplete?: () => void
}

/**
 * 执行文件上传（带 formData）
 * @template T 上传成功后返回的数据类型
 * @param options 上传选项
 */
function uploadFile<T>({
  url,
  tempFilePath,
  formData,
  data,
  error,
  loading,
  progress,
  onProgress,
  onSuccess,
  onError,
  onComplete,
}: UploadFileOptions<T>) {
  try {
    // 创建上传任务
    const uploadTask = uni.uploadFile({
      url,
      filePath: tempFilePath,
      name: 'file', // 文件对应的 key
      formData,
      header: {
        // H5环境下不需要手动设置Content-Type，让浏览器自动处理multipart格式
        // #ifndef H5
        'Content-Type': 'multipart/form-data',
        // #endif
      },
      // 确保文件名称合法
      success: (uploadFileRes) => {
        console.log('上传文件成功:', uploadFileRes)
        try {
          // 解析响应数据
          const { data: _data } = JSON.parse(uploadFileRes.data)
          // 上传成功
          data.value = _data as T
          onSuccess?.(_data)
        } catch (err) {
          // 响应解析错误
          console.error('解析上传响应失败:', err)
          error.value = true
          onError?.(new Error('上传响应解析失败'))
        }
      },
      fail: (err) => {
        // 上传请求失败
        console.error('上传文件失败:', err)
        error.value = true
        onError?.(err)
      },
      complete: () => {
        // 无论成功失败都执行
        loading.value = false
        onComplete?.()
      },
    })

    // 监听上传进度
    uploadTask.onProgressUpdate((res) => {
      progress.value = res.progress
      onProgress?.(res.progress)
    })
  } catch (err) {
    // 创建上传任务失败
    console.error('创建上传任务失败:', err)
    error.value = true
    loading.value = false
    onError?.(new Error('创建上传任务失败'))
  }
}
