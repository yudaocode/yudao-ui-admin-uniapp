<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备影子" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 影子内容 -->
    <view class="min-h-0 flex-1 overflow-y-auto p-24rpx pb-180rpx">
      <view v-if="!hasAccessByCodes(['iot:device:shadow-query'])" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无设备影子查询权限
      </view>
      <wd-loading v-else-if="loading" />
      <view v-else-if="loaded">
        <!-- 影子概览 -->
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-30rpx text-[#333] font-semibold">影子概览</text>
            <wd-button size="small" variant="plain" @click="loadShadow">
              刷新
            </wd-button>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">版本号：</text>{{ shadow.version ?? 0 }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">最后更新：</text>{{ formatTime(shadow.shadowTime) }}
          </view>
          <view class="flex items-center justify-between text-26rpx">
            <text class="text-[#999]">影子开关</text>
            <wd-switch
              :model-value="shadow.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
              :loading="statusUpdating"
              :disabled="!hasAccessByCodes(['iot:device:shadow-update'])"
              :before-change="handleBeforeStatusChange"
            />
          </view>
        </view>

        <!-- 属性对比 -->
        <view class="mb-24rpx">
          <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
            属性对比
          </view>
          <view v-if="shadow.properties.length === 0" class="rounded-12rpx bg-white py-60rpx text-center text-26rpx text-[#999] shadow-sm">
            暂无属性数据
          </view>
          <view
            v-for="item in shadow.properties"
            :key="item.identifier"
            class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isDelta(item) ? 'border-2rpx border-[#ffd591] border-solid' : ''"
          >
            <view class="mb-8rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-semibold">
                {{ item.name || item.identifier }}
              </view>
              <view v-if="isDelta(item)" class="shrink-0 rounded-6rpx bg-[#fff7e6] px-12rpx py-4rpx text-22rpx text-[#fa8c16]">
                待同步
              </view>
              <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-22rpx text-[#2f54eb]">
                {{ item.dataType || '-' }}
              </view>
            </view>
            <view class="mb-16rpx text-24rpx text-[#999]">
              标识符：{{ item.identifier }}
            </view>
            <view class="flex gap-16rpx">
              <view class="min-w-0 flex-1 rounded-8rpx bg-[#f7f8fa] p-16rpx">
                <view class="mb-8rpx text-22rpx text-[#999]">
                  期望值 (desired)
                </view>
                <view class="break-all text-26rpx" :class="isDelta(item) ? 'text-[#fa8c16] font-semibold' : 'text-[#333]'">
                  {{ formatValue(item.desiredValue) }}
                </view>
                <view class="mt-8rpx text-22rpx text-[#999]">
                  {{ formatTime(item.desiredTime) }}
                </view>
              </view>
              <view class="min-w-0 flex-1 rounded-8rpx bg-[#f7f8fa] p-16rpx">
                <view class="mb-8rpx text-22rpx text-[#999]">
                  上报值 (reported)
                </view>
                <view class="break-all text-26rpx" :class="isDelta(item) ? 'text-[#fa8c16] font-semibold' : 'text-[#333]'">
                  {{ formatValue(item.reportedValue) }}
                </view>
                <view class="mt-8rpx text-22rpx text-[#999]">
                  {{ formatTime(item.reportedTime) }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 下发期望 -->
        <view v-if="hasAccessByCodes(['iot:device:shadow-update'])" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">下发期望 (desired)</text>
            <wd-button size="small" variant="plain" @click="handleClearDesired">
              清空
            </wd-button>
          </view>
          <view v-if="isDisabled" class="mb-16rpx">
            <wd-notice-bar type="warning" wrapable :scrollable="false" text="影子已关闭，暂不能下发期望状态；查看和重置影子不受影响。" />
          </view>
          <view class="mb-16rpx text-24rpx text-[#999]">
            仅列出可写属性，只下发已填写的属性。
          </view>
          <view v-if="writableProperties.length === 0" class="py-40rpx text-center text-26rpx text-[#999]">
            暂无可写属性
          </view>
          <wd-form v-else :model="desiredForm">
            <wd-cell-group border>
              <template v-for="item in writableProperties" :key="item.identifier">
                <yd-form-picker
                  v-if="getDesiredInputType(item) === 'select'"
                  v-model="desiredForm[item.identifier]"
                  :label="item.name || item.identifier"
                  label-width="220rpx"
                  :columns="getSelectOptions(item)"
                  placeholder="不修改"
                  clearable
                />
                <wd-form-item
                  v-else-if="getDesiredInputType(item) === 'date'"
                  :title="item.name || item.identifier"
                  title-width="220rpx"
                  is-link
                  :value="formatDesiredTime(desiredForm[item.identifier])"
                  placeholder="不修改"
                  @click="openDatePicker(item.identifier)"
                />
                <wd-form-item v-else :title="item.name || item.identifier" title-width="220rpx">
                  <wd-input-number
                    v-if="getDesiredInputType(item) === 'number'"
                    :model-value="desiredForm[item.identifier] ?? ''"
                    allow-null
                    :min="NUMBER_MIN"
                    :precision="0"
                    :update-on-init="false"
                    placeholder="不修改"
                    @update:model-value="desiredForm[item.identifier] = $event"
                  />
                  <wd-input
                    v-else-if="getDesiredInputType(item) === 'decimal'"
                    v-model="desiredForm[item.identifier]"
                    placeholder="不修改，支持小数和负数"
                    clearable
                  />
                  <wd-textarea
                    v-else-if="getDesiredInputType(item) === 'json'"
                    v-model="desiredForm[item.identifier]"
                    :placeholder="item.property?.dataType === IoTDataSpecsDataTypeEnum.ARRAY ? '请输入 JSON 数组' : '请输入 JSON 对象'"
                    :maxlength="4000"
                    auto-height
                  />
                  <wd-input v-else v-model="desiredForm[item.identifier]" placeholder="不修改" clearable />
                </wd-form-item>
              </template>
            </wd-cell-group>
          </wd-form>
        </view>

        <!-- 原始影子文档 -->
        <view class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-collapse v-model="activeNames">
            <wd-collapse-item name="raw" title="原始影子文档 (JSON)">
              <view class="max-h-[760rpx] overflow-y-auto rounded-8rpx bg-[#f7f8fa] p-20rpx">
                <text class="whitespace-pre-wrap break-all text-24rpx text-[#333]">{{ rawJson }}</text>
              </view>
            </wd-collapse-item>
          </wd-collapse>
        </view>
      </view>
    </view>

    <!-- 期望时间选择器 -->
    <wd-datetime-picker v-model="dateValue" v-model:visible="dateVisible" title="请选择期望时间" type="datetime" :min-date="0" @confirm="handleDateConfirm" />

    <!-- 底部操作按钮 -->
    <view v-if="loaded && hasAccessByCodes(['iot:device:shadow-update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="danger" variant="plain" :loading="resetting" @click="handleReset">
          重置影子
        </wd-button>
        <wd-button class="flex-1" type="primary" :disabled="isDisabled || writableProperties.length === 0" :loading="updating" @click="handleUpdateDesired">
          下发期望
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DeviceShadow, DeviceShadowProperty } from '@/api/iot/device/shadow'
import type { DataSpecsEnumOrBoolData, ThingModelData } from '@/api/iot/thingmodel'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getDevice } from '@/api/iot/device/device'
import { getDeviceShadow, resetDeviceShadow, updateDeviceShadowDesired, updateDeviceShadowStatus } from '@/api/iot/device/shadow'
import { getThingModelList } from '@/api/iot/thingmodel'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, IoTDataSpecsDataTypeEnum, IoTThingModelAccessModeEnum, IoTThingModelTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

type WritableProperty = ThingModelData & { identifier: string } // 可写属性，标识符必填

const props = defineProps<{ deviceId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const NUMBER_MIN = Number.MIN_SAFE_INTEGER // 整数输入下限，允许 0 和负数

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 页面加载状态
const loaded = ref(false) // 影子是否已加载
const updating = ref(false) // 下发期望状态
const resetting = ref(false) // 重置状态
const statusUpdating = ref(false) // 开关更新状态
const shadow = ref<DeviceShadow>({ // 设备影子
  version: 0,
  shadowTime: 0,
  status: CommonStatusEnum.ENABLE,
  properties: [],
  desired: {},
  reported: {},
  metadata: {},
})
const thingModelList = ref<ThingModelData[]>([]) // 物模型列表
const desiredForm = ref<Record<string, any>>({}) // 期望值表单，只保存用户填写的属性
const activeNames = ref<string[]>([]) // 展开的折叠面板
const dateVisible = ref(false) // 时间选择器显示状态
const dateValue = ref<number | ''>('') // 时间选择器当前值
const dateIdentifier = ref('') // 正在选择时间的属性标识符
const isDisabled = computed(() => shadow.value.status === CommonStatusEnum.DISABLE) // 影子是否已关闭
const writableProperties = computed(() => { // 可写属性列表，引导填写 desired
  return thingModelList.value.filter((item): item is WritableProperty => {
    if (item.type !== IoTThingModelTypeEnum.PROPERTY || !item.identifier) {
      return false
    }
    const accessMode = item.property?.accessMode
    return accessMode === IoTThingModelAccessModeEnum.READ_WRITE.value
      || accessMode === IoTThingModelAccessModeEnum.WRITE_ONLY.value
  })
})
const rawJson = computed(() => JSON.stringify({ // 原始影子文档
  state: { desired: shadow.value.desired, reported: shadow.value.reported },
  metadata: shadow.value.metadata,
  version: shadow.value.version,
  timestamp: shadow.value.shadowTime,
}, null, 2))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 加载设备影子 */
async function loadShadow() {
  if (!props.deviceId) {
    return
  }
  loading.value = true
  try {
    shadow.value = await getDeviceShadow(props.deviceId)
    loaded.value = true
  } finally {
    loading.value = false
  }
}

/** 加载物模型，仅有修改权限时用于下发期望 */
async function loadThingModelList() {
  if (!props.deviceId || !hasAccessByCodes(['iot:device:shadow-update'])) {
    return
  }
  const device = await getDevice(props.deviceId)
  if (device.productId) {
    thingModelList.value = await getThingModelList({ productId: device.productId })
  }
}

/** 切换影子开关：请求成功才切换，失败时保持最近一次成功的状态 */
async function handleBeforeStatusChange(value: number | string | boolean) {
  if (statusUpdating.value || !props.deviceId) {
    return false
  }
  const status = value as number
  statusUpdating.value = true
  try {
    await updateDeviceShadowStatus({ deviceId: props.deviceId, status })
    shadow.value.status = status
    toast.success('影子开关已更新')
    return true
  } catch {
    // 请求层已提示错误，这里只阻止开关切换
    return false
  } finally {
    statusUpdating.value = false
  }
}

/** 期望值的输入方式，按物模型数据类型区分 */
function getDesiredInputType(item: ThingModelData) {
  switch (item.property?.dataType) {
    case IoTDataSpecsDataTypeEnum.ARRAY:
    case IoTDataSpecsDataTypeEnum.STRUCT:
      return 'json'
    case IoTDataSpecsDataTypeEnum.BOOL:
    case IoTDataSpecsDataTypeEnum.ENUM:
      return 'select'
    case IoTDataSpecsDataTypeEnum.DATE:
      return 'date'
    case IoTDataSpecsDataTypeEnum.DOUBLE:
    case IoTDataSpecsDataTypeEnum.FLOAT:
      return 'decimal'
    case IoTDataSpecsDataTypeEnum.INT:
      return 'number'
    default:
      return 'text'
  }
}

/** 布尔、枚举的可选值：保留物模型定义的原始值 */
function getSelectOptions(item: ThingModelData) {
  return ((item.property?.dataSpecsList || []) as DataSpecsEnumOrBoolData[]).map(spec => ({
    label: `${spec.name}（${spec.value}）`,
    value: spec.value,
  }))
}

/** 期望时间展示文案：0 毫秒也展示，未选择时返回空串 */
function formatDesiredTime(value?: number | null) {
  return value === undefined || value === null ? '' : formatDateTime(new Date(value))
}

/** 打开时间选择器 */
function openDatePicker(identifier: string) {
  dateIdentifier.value = identifier
  dateValue.value = desiredForm.value[identifier] ?? Date.now() // 未选择时定位到当前时间，确认后才写入表单
  dateVisible.value = true
}

/** 确认期望时间 */
function handleDateConfirm({ value }: { value: number }) {
  if (dateIdentifier.value) {
    desiredForm.value[dateIdentifier.value] = value
  }
}

/** 清空期望值表单 */
function handleClearDesired() {
  desiredForm.value = {}
}

/** 构建期望状态：只包含已填写的属性；校验失败时提示并返回 undefined */
function buildDesired() {
  const desired: Record<string, any> = {}
  for (const item of writableProperties.value) {
    const identifier = item.identifier
    const value = desiredForm.value[identifier]
    if (value === undefined || value === null || value === '') {
      continue
    }
    const label = item.name || identifier
    const inputType = getDesiredInputType(item)
    // 时间：提交毫秒时间戳
    if (inputType === 'date') {
      const timestamp = Number(value)
      if (!Number.isFinite(timestamp)) {
        toast.warning(`【${label}】需选择合法的时间`)
        return undefined
      }
      desired[identifier] = timestamp
      continue
    }
    // 浮点：文本转为有限数字，不截断精度
    if (inputType === 'decimal') {
      const text = String(value).trim()
      if (!text) {
        continue
      }
      const num = Number(text)
      if (!Number.isFinite(num)) {
        toast.warning(`【${label}】需填写合法的数字`)
        return undefined
      }
      desired[identifier] = num
      continue
    }
    // 整数：不允许小数
    if (item.property?.dataType === IoTDataSpecsDataTypeEnum.INT && !Number.isInteger(value)) {
      toast.warning(`【${label}】需填写整数`)
      return undefined
    }
    if (inputType !== 'json') {
      desired[identifier] = value
      continue
    }
    // 结构体、数组：解析为 JSON 对象、数组
    const isArray = item.property?.dataType === IoTDataSpecsDataTypeEnum.ARRAY
    let json: any
    try {
      json = JSON.parse(value)
    } catch {
      json = undefined
    }
    const isObject = json !== null && typeof json === 'object' && !Array.isArray(json)
    if (isArray ? !Array.isArray(json) : !isObject) {
      toast.warning(`【${label}】需填写合法的 JSON ${isArray ? '数组' : '对象'}`)
      return undefined
    }
    desired[identifier] = json
  }
  return desired
}

/** 下发期望状态：成功后清空表单并刷新；失败时保留输入 */
async function handleUpdateDesired() {
  if (!props.deviceId || isDisabled.value) {
    return
  }
  const desired = buildDesired()
  if (!desired) {
    return
  }
  if (Object.keys(desired).length === 0) {
    toast.warning('请至少填写一个期望值')
    return
  }
  updating.value = true
  try {
    await updateDeviceShadowDesired({ deviceId: props.deviceId, desired })
    toast.success('期望状态已下发')
    desiredForm.value = {}
    await loadShadow()
  } finally {
    updating.value = false
  }
}

/** 重置影子 */
async function handleReset() {
  if (!props.deviceId) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认重置该设备的影子文档？此操作将清空 desired、reported 和 metadata，版本号归 0。' })
  } catch {
    return
  }
  resetting.value = true
  try {
    await resetDeviceShadow(props.deviceId)
    toast.success('影子已重置')
    await loadShadow()
  } finally {
    resetting.value = false
  }
}

/** 按内容深比较，忽略对象 key 顺序 */
function isDeepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false
  }
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  return keysA.length === keysB.length
    && keysA.every(key => key in b && isDeepEqual(a[key], b[key]))
}

/** 期望值与上报值不一致（结构体、数组按内容深比较） */
function isDelta(item: DeviceShadowProperty) {
  if (item.desiredValue === undefined || item.desiredValue === null) {
    return false
  }
  return !isDeepEqual(item.desiredValue, item.reportedValue)
}

/** 格式化属性值 */
function formatValue(value: any) {
  if (value === undefined || value === null) {
    return '-'
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/** 格式化秒级时间戳 */
function formatTime(epochSecond?: number) {
  return epochSecond ? formatDateTime(epochSecond * 1000) : '-'
}

/** 初始化 */
onMounted(() => {
  // 无查询权限时不请求影子，避免深链绕过入口
  if (!hasAccessByCodes(['iot:device:shadow-query'])) {
    toast.warning('暂无设备影子查询权限')
    return
  }
  loadShadow()
  loadThingModelList()
})
</script>
