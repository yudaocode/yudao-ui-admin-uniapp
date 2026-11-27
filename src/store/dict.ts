import type { DictData } from '@/api/system/dict/data'
import { defineStore } from 'pinia'

import { computed, ref } from 'vue'
import { getSimpleDictDataList } from '@/api/system/dict/data'
import { sleep } from '@/utils/promise'

/** 字典项 */
export interface DictItem {
  label: string
  value: string
  colorType?: string
  cssClass?: string
}

/** 字典缓存类型 */
export type DictCache = Record<string, DictItem[]>

let loadingPromise: Promise<void> | null = null
let loadSeq = 0 // 加载序号：强制刷新、清空缓存后，较早发起的加载结果作废，避免旧数据覆盖新数据

export const useDictStore = defineStore(
  'dict',
  () => {
    const dictCache = ref<DictCache>({}) // 字典缓存
    const isLoaded = computed(() => Object.keys(dictCache.value).length > 0) // 是否已加载（基于 dictCache 非空判断）

    /** 设置字典缓存 */
    const setDictCache = (dicts: DictCache) => {
      dictCache.value = dicts
    }

    /** 通过 API 加载字典数据 */
    const loadDictCache = async (force = false) => {
      if (!force && isLoaded.value) {
        return
      }
      if (!force && loadingPromise) {
        return loadingPromise
      }

      const seq = ++loadSeq
      const promise = (async () => {
        const dicts = (await getSimpleDictDataList()) || []
        if (seq !== loadSeq) {
          // 已被更新的加载取代：等待其结果，让等待方拿到最新数据
          await loadingPromise
          return
        }
        // 返回空列表时同样覆盖，清除旧的字典数据
        const dictCacheData: DictCache = {}
        dicts.forEach((dict: DictData) => {
          if (!dictCacheData[dict.dictType]) {
            dictCacheData[dict.dictType] = []
          }
          dictCacheData[dict.dictType].push({
            label: dict.label,
            value: dict.value,
            colorType: dict.colorType,
            cssClass: dict.cssClass,
          })
        })
        setDictCache(dictCacheData)
      })()
      loadingPromise = promise

      try {
        await promise
      } finally {
        if (loadingPromise === promise) {
          loadingPromise = null
        }
      }
    }

    /** 重试加载字典数据，用于微信等环境下缓存丢失或网络抖动后的补偿 */
    const loadDictCacheWithRetry = async (maxRetry = 3) => {
      for (let i = 0; i <= maxRetry; i++) {
        try {
          await loadDictCache()
          return
        } catch (error) {
          console.error(`加载字典数据失败，第 ${i + 1} 次`, error)
          if (i >= maxRetry) {
            return
          }
          await sleep(800 * (i + 1))
        }
      }
    }

    /** 强制刷新字典缓存，用于字典增删改成功后同步最新数据；失败时保留原缓存并记录日志，不影响调用方的操作结果 */
    const refreshDictCache = async () => {
      try {
        await loadDictCache(true)
      } catch (error) {
        console.error('刷新字典缓存失败', error)
      }
    }

    /** 获取字典选项列表 */
    const getDictOptions = (dictType: string): DictItem[] => {
      return dictCache.value[dictType] || []
    }

    /** 获取字典数据对象 */
    const getDictData = (dictType: string, value: any): DictItem | undefined => {
      const dict = dictCache.value[dictType]
      if (!dict) {
        return undefined
      }
      return dict.find(d => d.value === value || d.value === String(value))
    }

    /** 清空字典缓存 */
    const clearDictCache = () => {
      // 作废进行中的加载（如登出、切换租户前发起的刷新），避免其结果回写
      loadSeq++
      loadingPromise = null
      dictCache.value = {}
    }

    return {
      dictCache,
      isLoaded,
      setDictCache,
      loadDictCache,
      loadDictCacheWithRetry,
      refreshDictCache,
      getDictOptions,
      getDictData,
      clearDictCache,
    }
  },
  {
    persist: true,
  },
)
