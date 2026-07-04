import type { Action, Trigger, TriggerCondition } from '@/api/iot/rule/scene'
import { isEmptyValue } from '@/utils/is'
import { IotRuleSceneActionTypeEnum, IotRuleSceneTriggerConditionTypeEnum, IotRuleSceneTriggerTimeOperatorEnum, IotRuleSceneTriggerTypeEnum, isDeviceTrigger } from '@/utils/constants'

/** 执行器参数是否为空（空字符串 / 空对象视为空） */
export function isActionParamsEmpty(params?: string) {
  if (!params || !String(params).trim()) {
    return true
  }
  try {
    const parsed = JSON.parse(String(params))
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.keys(parsed).length === 0
    }
  } catch {
    return false
  }
  return false
}

/** 校验 CRON 表达式基础格式 */
export function isValidCronExpression(cronExpression?: string) {
  const expression = cronExpression?.trim()
  if (!expression) {
    return false
  }
  const parts = expression.split(/\s+/)
  if (![5, 6].includes(parts.length)) {
    return false
  }
  const configs = getCronFieldConfigs(parts.length)
  return parts.every((part, index) => isValidCronPart(part, configs[index]))
}

interface CronFieldConfig {
  min: number
  max: number
  names?: string[]
  allowQuestion?: boolean
  allowLast?: boolean
  allowWeekday?: boolean
  allowHash?: boolean
}

/** 获取 CRON 字段配置 */
function getCronFieldConfigs(length: number): CronFieldConfig[] {
  const minute = { min: 0, max: 59 }
  const hour = { min: 0, max: 23 }
  const dayOfMonth = { min: 1, max: 31, allowQuestion: true, allowLast: true, allowWeekday: true }
  const month = { min: 1, max: 12, names: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] }
  const dayOfWeek = { min: 0, max: 7, names: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], allowQuestion: true, allowLast: true, allowHash: true }
  return length === 6
    ? [{ min: 0, max: 59 }, minute, hour, dayOfMonth, month, dayOfWeek]
    : [minute, hour, dayOfMonth, month, dayOfWeek]
}

/** 校验 CRON 单个字段 */
function isValidCronPart(part: string, config: CronFieldConfig) {
  if (!/^[\dA-Z*,?/\-#]+$/i.test(part)) {
    return false
  }
  return part.split(',').every(token => isValidCronToken(token, config))
}

/** 校验 CRON 字段片段 */
function isValidCronToken(token: string, config: CronFieldConfig) {
  if (!token) {
    return false
  }
  if (token === '*' || (config.allowQuestion && token === '?')) {
    return true
  }
  const [range, step, extra] = token.split('/')
  if (extra !== undefined || (step !== undefined && !isValidCronNumber(step, { min: 1, max: config.max }))) {
    return false
  }
  if (range === '*') {
    return true
  }
  if (config.allowLast && range === 'L') {
    return true
  }
  if (config.allowWeekday && (range === 'LW' || /^\d+W$/.test(range))) {
    return range === 'LW' || isValidCronNumber(range.slice(0, -1), config)
  }
  if (config.allowLast && /^[\dA-Z]+L$/i.test(range)) {
    return isValidCronValue(range.slice(0, -1), config)
  }
  if (config.allowHash && /^[\dA-Z]+#\d+$/i.test(range)) {
    const [week, order] = range.split('#')
    return isValidCronValue(week, config) && isValidCronNumber(order, { min: 1, max: 5 })
  }
  const [start, end, redundant] = range.split('-')
  if (redundant !== undefined) {
    return false
  }
  if (end === undefined) {
    return isValidCronValue(start, config)
  }
  const startValue = parseCronValue(start, config)
  const endValue = parseCronValue(end, config)
  return startValue !== undefined && endValue !== undefined && startValue <= endValue
}

/** 校验 CRON 字段值 */
function isValidCronValue(value: string, config: CronFieldConfig) {
  return parseCronValue(value, config) !== undefined
}

/** 解析 CRON 字段值 */
function parseCronValue(value: string, config: CronFieldConfig) {
  const upperValue = value.toUpperCase()
  const nameIndex = config.names?.indexOf(upperValue) ?? -1
  if (nameIndex >= 0) {
    return config.names?.length === 12 ? nameIndex + 1 : nameIndex
  }
  if (!isValidCronNumber(value, config)) {
    return undefined
  }
  return Number(value)
}

/** 校验 CRON 数值范围 */
function isValidCronNumber(value: string, config: Pick<CronFieldConfig, 'min' | 'max'>) {
  if (!/^\d+$/.test(value)) {
    return false
  }
  const numberValue = Number(value)
  return numberValue >= config.min && numberValue <= config.max
}

/** 校验单个触发器（与触发器 UI 必填项保持一致） */
export function validateTriggerItem(trigger: Trigger, index: number): string | null {
  if (!trigger.type) {
    return `触发器 ${index + 1}：触发方式不能为空`
  }
  // 设备类触发器都需要产品、设备
  if (isDeviceTrigger(trigger.type)) {
    if (!trigger.productId) {
      return `触发器 ${index + 1}：产品不能为空`
    }
    if (!trigger.deviceId) {
      return `触发器 ${index + 1}：设备不能为空`
    }
    // 设备状态变更：只校验操作符 + 状态值
    if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
      if (!trigger.operator) {
        return `触发器 ${index + 1}：操作符不能为空`
      }
      if (isEmptyValue(trigger.value)) {
        return `触发器 ${index + 1}：设备状态不能为空`
      }
      return validateTriggerConditionGroups(trigger.conditionGroups, index)
    }
    if (!trigger.identifier) {
      return `触发器 ${index + 1}：监控项不能为空`
    }
    // 事件上报、服务调用只监听是否发生；属性上报需要比较条件
    const isEventOrService = trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST || trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    if (!isEventOrService) {
      if (!trigger.operator) {
        return `触发器 ${index + 1}：操作符不能为空`
      }
      if (isEmptyValue(trigger.value)) {
        return `触发器 ${index + 1}：比较值不能为空`
      }
    }
    return validateTriggerConditionGroups(trigger.conditionGroups, index)
  }
  // 定时触发器需要 CRON 表达式
  if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
    if (!trigger.cronExpression) {
      return `触发器 ${index + 1}：CRON 表达式不能为空`
    }
    if (!isValidCronExpression(trigger.cronExpression)) {
      return `触发器 ${index + 1}：CRON 表达式格式不正确`
    }
  }
  return validateTriggerConditionGroups(trigger.conditionGroups, index)
}

/** 校验单个附加条件 */
export function validateTriggerCondition(condition: TriggerCondition, path: string): string | null {
  if (!condition.type) {
    return `${path}：条件类型不能为空`
  }
  if ([IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS, IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY].includes(condition.type as any)) {
    if (!condition.productId) {
      return `${path}：产品不能为空`
    }
    if (!condition.deviceId) {
      return `${path}：设备不能为空`
    }
  }
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS) {
    if (!condition.operator) {
      return `${path}：操作符不能为空`
    }
    if (isEmptyValue(condition.param)) {
      return `${path}：设备状态不能为空`
    }
    return null
  }
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY) {
    if (!condition.identifier) {
      return `${path}：监控项不能为空`
    }
    if (!condition.operator) {
      return `${path}：操作符不能为空`
    }
    if (isEmptyValue(condition.param)) {
      return `${path}：比较值不能为空`
    }
    return null
  }
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME) {
    if (!condition.operator) {
      return `${path}：时间条件不能为空`
    }
    if (condition.operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
      return null
    }
    if (isEmptyValue(condition.param)) {
      return `${path}：时间值不能为空`
    }
    if (condition.operator === IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value) {
      const parts = String(condition.param).split(',')
      if (!parts[0]?.trim() || !parts[1]?.trim()) {
        return `${path}：开始和结束时间不能为空`
      }
    }
  }
  return null
}

/** 校验触发器附加条件组 */
export function validateTriggerConditionGroups(groups: TriggerCondition[][] | undefined, triggerIndex: number): string | null {
  if (!groups?.length) {
    return null
  }
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const group = groups[groupIndex]
    if (!group?.length) {
      return `触发器 ${triggerIndex + 1} 子条件组 ${groupIndex + 1}：至少需要一个条件`
    }
    for (let conditionIndex = 0; conditionIndex < group.length; conditionIndex += 1) {
      const error = validateTriggerCondition(
        group[conditionIndex],
        `触发器 ${triggerIndex + 1} 子条件组 ${groupIndex + 1} 条件 ${conditionIndex + 1}`,
      )
      if (error) {
        return error
      }
    }
  }
  return null
}

/** 校验单个执行器（与执行器 UI 必填项保持一致） */
export function validateActionItem(action: Action, index: number): string | null {
  const prefix = `执行器 ${index + 1}`
  if (!action.type) {
    return `${prefix}：执行动作不能为空`
  }
  // 设备属性设置 / 服务调用：需要产品、设备和参数
  if (action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET || action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE) {
    if (!action.productId) {
      return `${prefix}：产品不能为空`
    }
    if (!action.deviceId) {
      return `${prefix}：设备不能为空`
    }
    if (action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE && !action.identifier) {
      return `${prefix}：服务不能为空`
    }
    if (isActionParamsEmpty(action.params)) {
      return `${prefix}：参数配置不能为空`
    }
    try {
      JSON.parse(String(action.params))
    } catch {
      return `${prefix}：参数格式须为合法 JSON`
    }
    return null
  }
  // 告警恢复：需要绑定告警配置
  if (action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER && !action.alertConfigId) {
    return `${prefix}：告警配置不能为空`
  }
  return null
}
