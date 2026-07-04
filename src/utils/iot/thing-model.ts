import { IoTDataSpecsDataTypeEnum, IoTThingModelAccessModeEnum } from '@/utils/constants'
import { isFiniteNumberValue } from '@/utils/format'
import { isEmptyValue } from '@/utils/is'

const SIMPLE_STRUCT_TYPES = [
  IoTDataSpecsDataTypeEnum.INT,
  IoTDataSpecsDataTypeEnum.FLOAT,
  IoTDataSpecsDataTypeEnum.DOUBLE,
  IoTDataSpecsDataTypeEnum.ENUM,
  IoTDataSpecsDataTypeEnum.BOOL,
  IoTDataSpecsDataTypeEnum.TEXT,
  IoTDataSpecsDataTypeEnum.DATE,
] as string[] // 结构体字段允许的子类型
const ARRAY_CHILD_TYPES = [
  IoTDataSpecsDataTypeEnum.STRUCT,
  IoTDataSpecsDataTypeEnum.INT,
  IoTDataSpecsDataTypeEnum.FLOAT,
  IoTDataSpecsDataTypeEnum.DOUBLE,
  IoTDataSpecsDataTypeEnum.TEXT,
] as string[] // 数组元素允许的子类型
const SPEC_NAME_PATTERN = /^[\u4E00-\u9FA5a-z0-9][\u4E00-\u9FA5\w-]{0,19}$/i // 枚举 / 布尔描述格式

/** 切换数据类型时初始化 dataSpecs / dataSpecsList */
export function seedDataSpecs(target: Record<string, any>, dataType: string) {
  target.dataType = dataType
  target.dataSpecs = {}
  target.dataSpecsList = []
  // 非列表型（枚举/布尔/结构体除外）才写入 dataSpecs.dataType
  if (![IoTDataSpecsDataTypeEnum.ENUM, IoTDataSpecsDataTypeEnum.BOOL, IoTDataSpecsDataTypeEnum.STRUCT, IoTDataSpecsDataTypeEnum.ARRAY].includes(dataType as any)) {
    target.dataSpecs.dataType = dataType
  }
  if (dataType === IoTDataSpecsDataTypeEnum.ENUM) {
    target.dataSpecsList.push({ dataType: IoTDataSpecsDataTypeEnum.ENUM, name: '', value: undefined })
  } else if (dataType === IoTDataSpecsDataTypeEnum.BOOL) {
    target.dataSpecsList.push(
      { dataType: IoTDataSpecsDataTypeEnum.BOOL, name: '', value: 0 },
      { dataType: IoTDataSpecsDataTypeEnum.BOOL, name: '', value: 1 },
    )
  } else if (dataType === IoTDataSpecsDataTypeEnum.ARRAY) {
    target.dataSpecs = {
      dataType: IoTDataSpecsDataTypeEnum.ARRAY,
      childDataType: IoTDataSpecsDataTypeEnum.INT,
      size: undefined,
    }
  }
}

/** 构建结构体字段 */
export function buildStructDataSpec(source: Record<string, any>) {
  const dataSpecs = cleanSimpleDataSpecs(source.dataSpecs)
  return {
    identifier: source.identifier,
    name: source.name,
    description: source.description,
    dataType: IoTDataSpecsDataTypeEnum.STRUCT,
    childDataType: source.dataType,
    accessMode: IoTThingModelAccessModeEnum.READ_WRITE.value,
    required: false,
    dataSpecs,
    dataSpecsList: source.dataSpecsList?.length ? cloneList(source.dataSpecsList) : undefined,
  }
}

/** 校验物模型参数列表 */
export function validateThingModelParamList(list: any[] = [], label: string) {
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index]
    const prefix = `${label}第 ${index + 1} 个参数`
    if (isEmptyValue(item.name)) {
      return `${prefix}名称不能为空`
    }
    if (isEmptyValue(item.identifier)) {
      return `${prefix}标识符不能为空`
    }
    const error = validateThingModelDataSpecs(item, `${prefix}数据定义`)
    if (error) {
      return error
    }
  }
}

/** 校验物模型数据定义 */
export function validateThingModelDataSpecs(target: Record<string, any>, label = '数据定义'): string | undefined {
  const dataType = getEffectiveDataType(target)
  const dataSpecs = target.dataSpecs || {}
  if ([IoTDataSpecsDataTypeEnum.INT, IoTDataSpecsDataTypeEnum.FLOAT, IoTDataSpecsDataTypeEnum.DOUBLE].includes(dataType as any)) {
    return validateNumberDataSpecs(dataSpecs, label)
  }
  if (dataType === IoTDataSpecsDataTypeEnum.TEXT) {
    return validateTextDataSpecs(dataSpecs, label)
  }
  if (dataType === IoTDataSpecsDataTypeEnum.ENUM) {
    return validateEnumDataSpecs(target.dataSpecsList, label)
  }
  if (dataType === IoTDataSpecsDataTypeEnum.BOOL) {
    return validateBoolDataSpecs(target.dataSpecsList, label)
  }
  if (dataType === IoTDataSpecsDataTypeEnum.ARRAY) {
    return validateArrayDataSpecs(dataSpecs, label)
  }
  if (dataType === IoTDataSpecsDataTypeEnum.STRUCT) {
    return validateStructDataSpecs(target.dataSpecsList, label)
  }
}

/** 清理简单类型数据定义 */
function cleanSimpleDataSpecs(dataSpecs?: Record<string, any>) {
  if (!dataSpecs || Object.keys(dataSpecs).length <= 1) {
    return undefined
  }
  return { ...dataSpecs }
}

/** 克隆列表数据 */
function cloneList(list: any[]) {
  return list.map(item => ({
    ...item,
    dataSpecs: item.dataSpecs ? { ...item.dataSpecs } : undefined,
    dataSpecsList: item.dataSpecsList ? cloneList(item.dataSpecsList) : undefined,
  }))
}

/** 获取实际数据类型 */
function getEffectiveDataType(target: Record<string, any>) {
  return target.dataType === IoTDataSpecsDataTypeEnum.STRUCT && target.childDataType
    ? target.childDataType
    : target.dataType
}

/** 校验数值型数据定义 */
function validateNumberDataSpecs(dataSpecs: Record<string, any>, label: string) {
  if (isEmptyValue(dataSpecs.min)) {
    return `${label}最小值不能为空`
  }
  if (isEmptyValue(dataSpecs.max)) {
    return `${label}最大值不能为空`
  }
  if (isEmptyValue(dataSpecs.step)) {
    return `${label}步长不能为空`
  }
  if (!isNumberLike(dataSpecs.min) || !isNumberLike(dataSpecs.max) || !isNumberLike(dataSpecs.step)) {
    return `${label}最小值、最大值、步长必须为数字`
  }
  const min = Number(dataSpecs.min)
  const max = Number(dataSpecs.max)
  const step = Number(dataSpecs.step)
  if (min >= max) {
    return `${label}最小值必须小于最大值`
  }
  if (step <= 0 || step > max - min) {
    return `${label}步长必须大于 0 且不超过取值范围`
  }
  if (isEmptyValue(dataSpecs.unit)) {
    return `${label}单位不能为空`
  }
}

/** 校验文本型数据定义 */
function validateTextDataSpecs(dataSpecs: Record<string, any>, label: string) {
  if (isEmptyValue(dataSpecs.length)) {
    return `${label}数据长度不能为空`
  }
  if (!Number.isInteger(Number(dataSpecs.length)) || Number(dataSpecs.length) <= 0 || Number(dataSpecs.length) > 2048) {
    return `${label}数据长度必须为 1 到 2048 的整数`
  }
}

/** 校验枚举型数据定义 */
function validateEnumDataSpecs(list: any[] = [], label: string) {
  if (!list.length) {
    return `${label}至少需要一个枚举项`
  }
  const values = new Set<string>()
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index]
    const prefix = `${label}第 ${index + 1} 个枚举项`
    if (isEmptyValue(item.value)) {
      return `${prefix}参数值不能为空`
    }
    if (!isNumberLike(item.value)) {
      return `${prefix}参数值必须为数字`
    }
    if (values.has(String(item.value))) {
      return `${prefix}参数值不能重复`
    }
    values.add(String(item.value))
    const nameError = validateSpecName(item.name, `${prefix}描述`)
    if (nameError) {
      return nameError
    }
  }
}

/** 校验布尔型数据定义 */
function validateBoolDataSpecs(list: any[] = [], label: string) {
  const values = list.map(item => Number(item.value))
  if (list.length !== 2 || !values.includes(0) || !values.includes(1)) {
    return `${label}布尔值必须包含 0 和 1`
  }
  for (const item of list) {
    const nameError = validateSpecName(item.name, `${label}布尔值 ${item.value} 描述`)
    if (nameError) {
      return nameError
    }
  }
}

/** 校验数组型数据定义 */
function validateArrayDataSpecs(dataSpecs: Record<string, any>, label: string) {
  if (!ARRAY_CHILD_TYPES.includes(dataSpecs.childDataType)) {
    return `${label}元素类型不正确`
  }
  if (isEmptyValue(dataSpecs.size)) {
    return `${label}元素个数不能为空`
  }
  if (!Number.isInteger(Number(dataSpecs.size)) || Number(dataSpecs.size) <= 0) {
    return `${label}元素个数必须为正整数`
  }
  if (dataSpecs.childDataType === IoTDataSpecsDataTypeEnum.STRUCT) {
    return validateStructDataSpecs(dataSpecs.dataSpecsList, `${label}结构体字段`)
  }
}

/** 校验结构体字段 */
function validateStructDataSpecs(list: any[] = [], label: string) {
  if (!list.length) {
    return `${label}不能为空`
  }
  const identifiers = new Set<string>()
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index]
    const prefix = `${label}第 ${index + 1} 个字段`
    if (isEmptyValue(item.name)) {
      return `${prefix}名称不能为空`
    }
    if (isEmptyValue(item.identifier)) {
      return `${prefix}标识符不能为空`
    }
    if (identifiers.has(String(item.identifier))) {
      return `${prefix}标识符不能重复`
    }
    identifiers.add(String(item.identifier))
    if (!SIMPLE_STRUCT_TYPES.includes(item.childDataType)) {
      return `${prefix}数据类型不正确`
    }
    const error = validateThingModelDataSpecs(item, `${prefix}数据定义`)
    if (error) {
      return error
    }
  }
}

/** 校验枚举 / 布尔描述 */
function validateSpecName(name: any, label: string) {
  if (isEmptyValue(name)) {
    return `${label}不能为空`
  }
  if (!SPEC_NAME_PATTERN.test(String(name))) {
    return `${label}支持中文、字母、数字、下划线和短划线，不超过 20 个字符`
  }
}

/** 判断数字值 */
function isNumberLike(value: any) {
  return isFiniteNumberValue(value)
}
