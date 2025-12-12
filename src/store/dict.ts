import type { DictData } from '@/api/system/dict/data'
import { defineStore } from 'pinia'

import { computed, ref } from 'vue'
import { getSimpleDictDataList } from '@/api/system/dict/data'

/** 字典项 */
export interface DictItem {
  label: string
  value: string
  colorType?: string
  cssClass?: string
}

/** 字典缓存类型 */
export type DictCache = Record<string, DictItem[]>

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
    const loadDictCache = async () => {
      if (isLoaded.value) {
        return
      }
      try {
        const dicts = await getSimpleDictDataList()
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
      } catch (error) {
        console.error('加载字典数据失败', error)
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
      dictCache.value = {}
    }

    return {
      dictCache,
      isLoaded,
      setDictCache,
      loadDictCache,
      getDictOptions,
      getDictData,
      clearDictCache,
    }
  },
  {
    persist: true,
  },
)
