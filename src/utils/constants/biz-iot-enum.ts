/** IoT 设备状态枚举 */
export enum DeviceStateEnum {
  INACTIVE = 0,
  ONLINE = 1,
  OFFLINE = 2,
}

/** IoT 产品状态枚举 */
export enum ProductStatusEnum {
  UNPUBLISHED = 0,
  PUBLISHED = 1,
}

/** IoT 设备编号 - 全部设备 */
export const IOT_DEVICE_ID_ALL = 0

/** IoT 设备选择器 - 全部设备选项 */
export const IOT_ALL_DEVICE_OPTION = {
  id: IOT_DEVICE_ID_ALL,
  deviceName: '全部设备',
} as const

/** IoT 产品物模型类型枚举 */
export const IoTThingModelTypeEnum = {
  PROPERTY: 1,
  SERVICE: 2,
  EVENT: 3,
} as const

/** IoT 告警接收方式枚举 */
export const IotAlertReceiveTypeEnum = {
  SMS: 1,
  MAIL: 2,
  NOTIFY: 3,
} as const

/** IoT 设备消息方法枚举 */
export const IotDeviceMessageMethodEnum = {
  STATE_UPDATE: { method: 'thing.state.update', name: '设备状态更新', upstream: true },
  TOPO_ADD: { method: 'thing.topo.add', name: '添加拓扑关系', upstream: true },
  TOPO_DELETE: { method: 'thing.topo.delete', name: '删除拓扑关系', upstream: true },
  TOPO_GET: { method: 'thing.topo.get', name: '获取拓扑关系', upstream: true },
  TOPO_CHANGE: { method: 'thing.topo.change', name: '拓扑关系变更通知', upstream: false },
  DEVICE_REGISTER: { method: 'thing.auth.register', name: '设备动态注册', upstream: true },
  SUB_DEVICE_REGISTER: { method: 'thing.auth.register.sub', name: '子设备动态注册', upstream: true },
  PROPERTY_POST: { method: 'thing.property.post', name: '属性上报', upstream: true },
  PROPERTY_SET: { method: 'thing.property.set', name: '属性设置', upstream: false },
  PROPERTY_PACK_POST: { method: 'thing.event.property.pack.post', name: '批量上报（属性 + 事件 + 子设备）', upstream: true },
  EVENT_POST: { method: 'thing.event.post', name: '事件上报', upstream: true },
  SERVICE_INVOKE: { method: 'thing.service.invoke', name: '服务调用', upstream: false },
  CONFIG_PUSH: { method: 'thing.config.push', name: '配置推送', upstream: false },
  OTA_UPGRADE: { method: 'thing.ota.upgrade', name: 'OTA 固件信息推送', upstream: false },
  OTA_PROGRESS: { method: 'thing.ota.progress', name: 'OTA 升级进度上报', upstream: true },
} as const

/** IoT 产品物模型访问模式枚举 */
export const IoTThingModelAccessModeEnum = {
  READ_WRITE: { label: '读写', value: 'rw' },
  READ_ONLY: { label: '只读', value: 'r' },
  WRITE_ONLY: { label: '只写', value: 'w' },
} as const

/** IoT 产品物模型服务调用方式枚举 */
export const IoTThingModelServiceCallTypeEnum = {
  ASYNC: { label: '异步', value: 'async' },
  SYNC: { label: '同步', value: 'sync' },
} as const

/** IoT 产品物模型事件类型枚举 */
export const IoTThingModelEventTypeEnum = {
  INFO: { label: '信息', value: 'info' },
  ALERT: { label: '告警', value: 'alert' },
  ERROR: { label: '故障', value: 'error' },
} as const

/** 属性值的数据类型 */
export const IoTDataSpecsDataTypeEnum = {
  INT: 'int',
  FLOAT: 'float',
  DOUBLE: 'double',
  ENUM: 'enum',
  BOOL: 'bool',
  TEXT: 'text',
  DATE: 'date',
  STRUCT: 'struct',
  ARRAY: 'array',
} as const

/** IoT OTA 任务设备范围枚举 */
export const IoTOtaTaskDeviceScopeEnum = {
  ALL: { label: '全部设备', value: 1 },
  SELECT: { label: '指定设备', value: 2 },
} as const

/** IoT OTA 任务状态枚举 */
export const IoTOtaTaskStatusEnum = {
  IN_PROGRESS: { label: '进行中', value: 10 },
  END: { label: '已结束', value: 20 },
  CANCELED: { label: '已取消', value: 30 },
} as const

/** IoT OTA 升级记录状态枚举 */
export const IoTOtaTaskRecordStatusEnum = {
  PENDING: { label: '待推送', value: 0 },
  PUSHED: { label: '已推送', value: 10 },
  UPGRADING: { label: '升级中', value: 20 },
  SUCCESS: { label: '升级成功', value: 30 },
  FAILURE: { label: '升级失败', value: 40 },
  CANCELED: { label: '升级取消', value: 50 },
} as const

/** IoT 场景联动触发器类型枚举 */
export const IotRuleSceneTriggerTypeEnum = {
  DEVICE_STATE_UPDATE: 1,
  DEVICE_PROPERTY_POST: 2,
  DEVICE_EVENT_POST: 3,
  DEVICE_SERVICE_INVOKE: 4,
  TIMER: 100,
} as const

/** IoT 场景联动执行器类型枚举 */
export const IotRuleSceneActionTypeEnum = {
  DEVICE_PROPERTY_SET: 1,
  DEVICE_SERVICE_INVOKE: 2,
  ALERT_TRIGGER: 100,
  ALERT_RECOVER: 101,
} as const

/** 场景联动触发器类型选项 */
export const triggerTypeOptions = [ // 触发器类型选项
  { value: IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE, label: '设备状态变更' },
  { value: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST, label: '设备属性上报' },
  { value: IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST, label: '设备事件上报' },
  { value: IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE, label: '设备服务调用' },
  { value: IotRuleSceneTriggerTypeEnum.TIMER, label: '定时触发' },
]

/** 场景联动执行器类型选项 */
export const actionTypeOptions = [ // 执行器类型选项
  { value: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET, label: '设备属性设置' },
  { value: IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE, label: '设备服务调用' },
  { value: IotRuleSceneActionTypeEnum.ALERT_TRIGGER, label: '触发告警' },
  { value: IotRuleSceneActionTypeEnum.ALERT_RECOVER, label: '恢复告警' },
]

/** 判断是否为设备类触发器 */
export function isDeviceTrigger(type?: number) {
  return [
    IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE,
    IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
  ].includes(type as any)
}

/** 获取触发器类型标签 */
export function getTriggerTypeLabel(type?: number) {
  return triggerTypeOptions.find(item => item.value === type)?.label || '未知类型'
}

/** 获取执行器类型标签 */
export function getActionTypeLabel(type?: number) {
  return actionTypeOptions.find(item => item.value === type)?.label || '未知类型'
}

/** 场景联动触发条件操作符枚举 */
export const IotRuleSceneTriggerConditionParameterOperatorEnum = {
  EQUALS: { name: '等于', value: '=' },
  NOT_EQUALS: { name: '不等于', value: '!=' },
  GREATER_THAN: { name: '大于', value: '>' },
  GREATER_THAN_OR_EQUALS: { name: '大于等于', value: '>=' },
  LESS_THAN: { name: '小于', value: '<' },
  LESS_THAN_OR_EQUALS: { name: '小于等于', value: '<=' },
  IN: { name: '在...之中', value: 'in' },
  NOT_IN: { name: '不在...之中', value: 'not in' },
  BETWEEN: { name: '在...之间', value: 'between' },
  NOT_BETWEEN: { name: '不在...之间', value: 'not between' },
  LIKE: { name: '字符串匹配', value: 'like' },
  NOT_NULL: { name: '非空', value: 'not null' },
} as const

/** 操作符选项（场景联动比较条件） */
export const operatorOptions = Object.values(IotRuleSceneTriggerConditionParameterOperatorEnum).map(item => ({ label: item.name, value: item.value })) // 操作符选项

/** 场景联动触发条件类型枚举 */
export const IotRuleSceneTriggerConditionTypeEnum = {
  DEVICE_STATUS: 1,
  DEVICE_PROPERTY: 2,
  CURRENT_TIME: 3,
} as const

export const conditionTypeOptions = [ // 触发条件类型选项
  { value: IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS, label: '设备状态' },
  { value: IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY, label: '设备属性' },
  { value: IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME, label: '当前时间' },
]

/** 场景联动触发时间操作符枚举 */
export const IotRuleSceneTriggerTimeOperatorEnum = {
  BEFORE_TIME: { name: '在时间之前', value: 'before_time' },
  AFTER_TIME: { name: '在时间之后', value: 'after_time' },
  BETWEEN_TIME: { name: '在时间之间', value: 'between_time' },
  AT_TIME: { name: '在指定时间', value: 'at_time' },
  TODAY: { name: '在今日之间', value: 'today' },
} as const

export const timeOperatorOptions = Object.values(IotRuleSceneTriggerTimeOperatorEnum).map(item => ({ label: item.name, value: item.value })) // 当前时间操作符

export const statusOperatorOptions = [ // 设备状态操作符
  { label: IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.name, value: IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value },
  { label: IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS.name, value: IotRuleSceneTriggerConditionParameterOperatorEnum.NOT_EQUALS.value },
]

/** 设备在线状态选项（设备状态变更触发器的比较值） */
export const deviceStatusOptions = [ // 设备在线状态
  { label: '在线', value: '1' },
  { label: '离线', value: '2' },
]

/** 获取数据类型选项 */
export function getDataTypeOptions() {
  return [
    { value: IoTDataSpecsDataTypeEnum.INT, label: '整数型' },
    { value: IoTDataSpecsDataTypeEnum.FLOAT, label: '单精度浮点型' },
    { value: IoTDataSpecsDataTypeEnum.DOUBLE, label: '双精度浮点型' },
    { value: IoTDataSpecsDataTypeEnum.ENUM, label: '枚举型' },
    { value: IoTDataSpecsDataTypeEnum.BOOL, label: '布尔型' },
    { value: IoTDataSpecsDataTypeEnum.TEXT, label: '文本型' },
    { value: IoTDataSpecsDataTypeEnum.DATE, label: '时间型' },
    { value: IoTDataSpecsDataTypeEnum.STRUCT, label: '结构体' },
    { value: IoTDataSpecsDataTypeEnum.ARRAY, label: '数组' },
  ]
}

/** 获取数据类型显示名称 */
export function getDataTypeOptionsLabel(value?: string) {
  if (!value) {
    return ''
  }
  const dataType = getDataTypeOptions().find(option => option.value === value)
  return dataType ? `${dataType.value}(${dataType.label})` : value
}

/** 获取访问模式标签 */
export function getAccessModeLabel(value?: string) {
  return Object.values(IoTThingModelAccessModeEnum).find(type => type.value === value)?.label || value || ''
}

/** 获取普通枚举标签 */
export function getIotOptionLabel<T extends { label: string, value: any }>(options: T[], value: any) {
  return options.find(option => String(option.value) === String(value))?.label || ''
}

/** 获取设备消息方法选项 */
export function getDeviceMessageMethodOptions() {
  return Object.values(IotDeviceMessageMethodEnum).map(item => ({
    label: item.name,
    value: item.method,
  }))
}

/** 获取设备消息方法名称 */
export function getDeviceMessageMethodLabel(method?: string) {
  if (!method) {
    return ''
  }
  return Object.values(IotDeviceMessageMethodEnum).find(item => item.method === method)?.name || method
}

/** Modbus 功能码选项 */
export const ModbusFunctionCodeOptions = [
  { value: 1, label: '01 - 读线圈' },
  { value: 2, label: '02 - 读离散输入' },
  { value: 3, label: '03 - 读保持寄存器' },
  { value: 4, label: '04 - 读输入寄存器' },
]

/** 获取 Modbus 功能码名称 */
export function getModbusFunctionCodeLabel(code?: number) {
  if (code === undefined || code === null) {
    return '-'
  }
  return ModbusFunctionCodeOptions.find(item => item.value === code)?.label || String(code)
}

/** Modbus 原始数据类型选项 */
export const ModbusRawDataTypeOptions = [
  { value: 'INT16', label: 'INT16', description: '有符号16位整数', registerCount: 1 },
  { value: 'UINT16', label: 'UINT16', description: '无符号16位整数', registerCount: 1 },
  { value: 'INT32', label: 'INT32', description: '有符号32位整数', registerCount: 2 },
  { value: 'UINT32', label: 'UINT32', description: '无符号32位整数', registerCount: 2 },
  { value: 'FLOAT', label: 'FLOAT', description: '32位浮点数', registerCount: 2 },
  { value: 'DOUBLE', label: 'DOUBLE', description: '64位浮点数', registerCount: 4 },
  { value: 'BOOLEAN', label: 'BOOLEAN', description: '布尔值', registerCount: 1 },
  { value: 'STRING', label: 'STRING', description: '字符串', registerCount: 0 },
]

/** Modbus 字节序选项 - 16位 */
export const ModbusByteOrder16Options = [
  { value: 'AB', label: 'AB', description: '大端序' },
  { value: 'BA', label: 'BA', description: '小端序' },
]

/** Modbus 字节序选项 - 32位 */
export const ModbusByteOrder32Options = [
  { value: 'ABCD', label: 'ABCD', description: '大端序' },
  { value: 'CDAB', label: 'CDAB', description: '大端字交换' },
  { value: 'DCBA', label: 'DCBA', description: '小端序' },
  { value: 'BADC', label: 'BADC', description: '小端字交换' },
]

/** 根据数据类型获取字节序选项 */
export function getByteOrderOptions(rawDataType?: string) {
  if (rawDataType && ['INT32', 'UINT32', 'FLOAT', 'DOUBLE'].includes(rawDataType)) {
    return ModbusByteOrder32Options
  }
  return ModbusByteOrder16Options
}
