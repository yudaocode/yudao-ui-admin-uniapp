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
import {
  ResourceRequestKey,
  ResourceRequestMode,
  runResourceRequest,
} from '@/pages-im/utils/resourceRequest'

/** IM 表情 Store */
export const useFaceStore = defineStore('imFace', () => {
  const facePacks = ref<ImFacePackUserVO[]>([]) // 系统表情包
  const faceUserItems = ref<ImFaceUserItemVO[]>([]) // 个人表情
  const facePackLoading = ref(false) // 系统表情包加载状态
  const faceUserItemLoading = ref(false) // 个人表情加载状态
  const loading = computed(() => facePackLoading.value || faceUserItemLoading.value) // 表情加载状态

  /** 按需加载系统表情包 */
  async function ensureFacePackList(
  ): Promise<void> {
    await runResourceRequest(ResourceRequestKey.FACE_PACKS, async () => {
      facePackLoading.value = true
      try {
        const rows = await getFacePackList()
        facePacks.value = rows || []
      } finally {
        facePackLoading.value = false
      }
    }, { mode: ResourceRequestMode.CACHE_SUCCESS })
  }

  /** 按需加载个人表情 */
  async function ensureFaceUserItemList(
  ): Promise<void> {
    await runResourceRequest(ResourceRequestKey.FACE_USER_ITEMS, async () => {
      faceUserItemLoading.value = true
      try {
        const rows = await getFaceUserItemList()
        faceUserItems.value = rows || []
      } finally {
        faceUserItemLoading.value = false
      }
    }, { mode: ResourceRequestMode.CACHE_SUCCESS })
  }

  /** 添加个人表情 */
  async function addFaceUserItem(
    data: ImFaceUserItemSaveReq,
  ): Promise<boolean> {
    try {
      await ensureFaceUserItemList()
    } catch {
      // 快照加载失败不阻止 mutation；失败 entry 已释放，后续 GET 会包含本次服务端变更
    }
    const id = await createFaceUserItem(data)
    if (!id) {
      return false
    }
    if (!faceUserItems.value.some(item => item.id === id)) {
      faceUserItems.value.unshift({ id, ...data })
    }
    return true
  }

  /** 删除个人表情 */
  async function removeFaceUserItem(
    id: number,
  ): Promise<boolean> {
    try {
      await ensureFaceUserItemList()
    } catch {
      // 同添加：快照失败后仍允许 mutation，后续加载可重新收敛
    }
    try {
      await deleteFaceUserItem(id)
    } catch (error) {
      console.warn('[IM] 删除个人表情失败', { id }, error)
      return false
    }
    faceUserItems.value = faceUserItems.value.filter(item => item.id !== id)
    return true
  }

  /** 清理表情内存状态 */
  function clear() {
    facePacks.value = []
    faceUserItems.value = []
    facePackLoading.value = false
    faceUserItemLoading.value = false
  }

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
