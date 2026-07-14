import type { ImFacePackUserVO } from '@/api/im/face/pack'
import type { ImFaceUserItemSaveReq, ImFaceUserItemVO } from '@/api/im/face/useritem'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getFacePackList } from '@/api/im/face/pack'
import {
  createFaceUserItem,
  deleteFaceUserItem,
  getFaceUserItemList,
} from '@/api/im/face/useritem'

/** IM 表情 Store */
export const useFaceStore = defineStore('imFace', () => {
  const facePacks = ref<ImFacePackUserVO[]>([]) // 系统表情包
  const faceUserItems = ref<ImFaceUserItemVO[]>([]) // 个人表情
  const facePackLoading = ref(false) // 系统表情包加载状态
  const faceUserItemLoading = ref(false) // 个人表情加载状态
  const loading = computed(() => facePackLoading.value || faceUserItemLoading.value) // 表情加载状态
  let storeEpoch = 0 // 当前账号数据轮次
  let facePacksPromise: Promise<void> | null = null // 系统表情包加载任务
  let faceUserItemsPromise: Promise<void> | null = null // 个人表情加载任务

  /** 按需加载系统表情包 */
  async function ensureFacePackList(): Promise<void> {
    if (!facePacksPromise) {
      const requestEpoch = storeEpoch
      facePackLoading.value = true
      facePacksPromise = getFacePackList()
        .then((rows) => {
          if (requestEpoch !== storeEpoch) {
            return
          }
          facePacks.value = rows || []
        })
        .catch((error) => {
          console.warn('[IM] 拉取表情包失败', error)
          if (requestEpoch === storeEpoch) {
            facePacksPromise = null
          }
          throw error
        })
        .finally(() => {
          if (requestEpoch === storeEpoch) {
            facePackLoading.value = false
          }
        })
    }
    return facePacksPromise
  }

  /** 按需加载个人表情 */
  async function ensureFaceUserItemList(): Promise<void> {
    if (!faceUserItemsPromise) {
      const requestEpoch = storeEpoch
      faceUserItemLoading.value = true
      faceUserItemsPromise = getFaceUserItemList()
        .then((rows) => {
          if (requestEpoch !== storeEpoch) {
            return
          }
          faceUserItems.value = rows || []
        })
        .catch((error) => {
          console.warn('[IM] 拉取个人表情失败', error)
          if (requestEpoch === storeEpoch) {
            faceUserItemsPromise = null
          }
          throw error
        })
        .finally(() => {
          if (requestEpoch === storeEpoch) {
            faceUserItemLoading.value = false
          }
        })
    }
    return faceUserItemsPromise
  }

  /** 添加个人表情 */
  async function addFaceUserItem(data: ImFaceUserItemSaveReq): Promise<boolean> {
    const requestEpoch = storeEpoch
    const id = await createFaceUserItem(data)
    if (!id || requestEpoch !== storeEpoch) {
      return false
    }
    if (!faceUserItems.value.some(item => item.id === id)) {
      faceUserItems.value.unshift({ id, ...data })
    }
    return true
  }

  /** 删除个人表情 */
  async function removeFaceUserItem(id: number): Promise<boolean> {
    const requestEpoch = storeEpoch
    try {
      await deleteFaceUserItem(id)
    } catch (error) {
      console.warn('[IM] 删除个人表情失败', { id }, error)
      return false
    }
    if (requestEpoch !== storeEpoch) {
      return false
    }
    faceUserItems.value = faceUserItems.value.filter(item => item.id !== id)
    return true
  }

  /** 清理表情内存状态 */
  function clear() {
    storeEpoch++
    facePacks.value = []
    faceUserItems.value = []
    facePackLoading.value = false
    faceUserItemLoading.value = false
    facePacksPromise = null
    faceUserItemsPromise = null
  }

  uni.$on('auth:logout', clear)

  return {
    facePacks,
    faceUserItems,
    loading,
    ensureFacePackList,
    ensureFaceUserItemList,
    addFaceUserItem,
    removeFaceUserItem,
    clear,
  }
})
