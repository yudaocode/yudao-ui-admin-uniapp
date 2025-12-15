/**
 * 下载工具类 - 支持多端（H5、小程序、APP）
 */

import { isH5, isMpWeixin } from '@uni-helper/uni-env'
import { useToast } from 'wot-design-uni'

const toast = useToast()

/** 保存图片到相册 */
export async function saveImageToAlbum(url: string, fileName?: string): Promise<void> {
  if (isH5) {
    await downloadFileH5(url, fileName)
    return
  }
  // 小程序和 APP 端保存图片到相册
  return new Promise((resolve, reject) => {
    // 如果是网络图片，先下载
    if (url.startsWith('http')) {
      uni.downloadFile({
        url,
        success: (downloadResult) => {
          if (downloadResult.statusCode === 200) {
            saveToAlbum(downloadResult.tempFilePath, resolve, reject)
          } else {
            // 注释 by 芋艿：使用 wd-toast 替代
            // uni.showToast({ icon: 'none', title: '下载失败' })
            toast.show('下载失败')
            reject(new Error('Download failed'))
          }
        },
        fail: (err) => {
          // 注释 by 芋艿：使用 wd-toast 替代
          // uni.showToast({ icon: 'none', title: '下载失败' })
          toast.show('下载失败')
          reject(err)
        },
      })
    } else {
      // 本地图片直接保存
      saveToAlbum(url, resolve, reject)
    }
  })
}

/** 保存图片到相册（内部方法） */
function saveToAlbum(
  filePath: string,
  resolve: () => void,
  reject: (err: unknown) => void,
): void {
  uni.saveImageToPhotosAlbum({
    filePath,
    success: () => {
      // uni.showToast({
      //   icon: 'success',
      //   title: '已保存到相册',
      // })
      toast.success('已保存到相册')
      resolve()
    },
    fail: (err) => {
      // 微信小程序需要授权
      if (isMpWeixin && err.errMsg?.includes('auth deny')) {
        uni.showModal({
          title: '提示',
          content: '需要您授权保存相册权限',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    // 重新尝试保存
                    saveToAlbum(filePath, resolve, reject)
                  } else {
                    reject(new Error('User denied'))
                  }
                },
              })
            } else {
              reject(new Error('User cancelled'))
            }
          },
        })
      } else {
        // uni.showToast({
        //   icon: 'none',
        //   title: '保存失败',
        // })
        toast.show('保存失败')
        reject(err)
      }
    },
  })
}

/** H5 端下载文件 */
async function downloadFileH5(url: string, fileName?: string): Promise<void> {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName || resolveFileName(url)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** 从 URL 中解析文件名 */
function resolveFileName(url: string): string {
  const defaultName = 'downloaded_file'
  try {
    const pathname = new URL(url).pathname
    return pathname.slice(pathname.lastIndexOf('/') + 1) || defaultName
  } catch {
    return url.slice(url.lastIndexOf('/') + 1) || defaultName
  }
}
