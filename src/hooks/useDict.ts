import type { DictItem } from '@/store/dict'
import { useDictStore } from '@/store/dict'

type ColorType = 'error' | 'info' | 'primary' | 'success' | 'warning'

export interface DictDataType {
  dictType?: string
  label: string
  value: boolean | number | string
  colorType?: string
  cssClass?: string
}

export interface NumberDictDataType extends DictDataType {
  value: number
}

export interface StringDictDataType extends DictDataType {
  value: string
}

/**
 * 获取字典标签
 *
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典标签
 */
export function getDictLabel(dictType: string, value: any): string {
  const dictStore = useDictStore()
  const dictObj = dictStore.getDictData(dictType, value)
  return dictObj ? dictObj.label : ''
}

/**
 * 获取字典对象
 *
 * @param dictType 字典类型
 * @param value 字典值
 * @returns 字典对象
 */
export function getDictObj(dictType: string, value: any): DictItem | null {
  const dictStore = useDictStore()
  const dictObj = dictStore.getDictData(dictType, value)
  return dictObj || null
}

export function getIntDictOptions(dictType: string): NumberDictDataType[] {
  // 获得通用的 DictDataType 列表
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  // 转换成 number 类型的 NumberDictDataType 类型
  // why 需要特殊转换：避免 IDEA 在 v-for="dict in getIntDictOptions(...)" 时，el-option 的 key 会告警
  const dictOption: NumberDictDataType[] = []
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: Number.parseInt(`${dict.value}`),
    })
  })
  return dictOption
}

export function getStrDictOptions(dictType: string) {
  // 获得通用的 DictDataType 列表
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  // 转换成 string 类型的 StringDictDataType 类型
  // why 需要特殊转换：避免 IDEA 在 v-for="dict in getStrDictOptions(...)" 时，el-option 的 key 会告警
  const dictOption: StringDictDataType[] = []
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: `${dict.value}`,
    })
  })
  return dictOption
}

export function getBoolDictOptions(dictType: string) {
  const dictOption: DictDataType[] = []
  const dictOptions: DictDataType[] = getDictOptions(dictType)
  dictOptions.forEach((dict: DictDataType) => {
    dictOption.push({
      ...dict,
      value: `${dict.value}` === 'true',
    })
  })
  return dictOption
}

/**
 * 获取字典数组，用于 picker、radio 等
 *
 * @param dictType 字典类型
 * @param valueType 字典值类型，默认 string 类型
 * @returns 字典数组
 */
export function getDictOptions(
  dictType: string,
  valueType: 'boolean' | 'number' | 'string' = 'string',
): DictDataType[] {
  const dictStore = useDictStore()
  const dictOpts = dictStore.getDictOptions(dictType)
  const dictOptions: DictDataType[] = []

  if (dictOpts.length > 0) {
    let dictValue: boolean | number | string = ''
    dictOpts.forEach((dict) => {
      switch (valueType) {
        case 'boolean': {
          dictValue = `${dict.value}` === 'true'
          break
        }
        case 'number': {
          dictValue = Number.parseInt(`${dict.value}`)
          break
        }
        case 'string': {
          dictValue = `${dict.value}`
          break
        }
      }
      dictOptions.push({
        value: dictValue,
        label: dict.label,
        colorType: dict.colorType as ColorType,
        cssClass: dict.cssClass,
      })
    })
  }

  return dictOptions
}
