<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="Modbus 配置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 连接配置 -->
    <view class="p-24rpx pb-0">
      <view class="mb-16rpx flex items-center justify-between">
        <view class="text-30rpx text-[#333] font-semibold">
          连接配置
        </view>
        <wd-button v-if="hasAccessByCodes(['iot:device:update'])" size="small" variant="plain" @click="handleEditConfig">
          编辑
        </wd-button>
      </view>
      <wd-cell-group border>
        <wd-cell title="协议类型" :value="productData?.protocolType || '-'" />
        <template v-if="isClient">
          <wd-cell title="IP 地址" :value="modbusConfig?.ip || '-'" />
          <wd-cell title="端口" :value="String(modbusConfig?.port || '-')" />
          <wd-cell title="连接超时" :value="modbusConfig?.timeout ? `${modbusConfig.timeout} ms` : '-'" />
          <wd-cell title="重试间隔" :value="modbusConfig?.retryInterval ? `${modbusConfig.retryInterval} ms` : '-'" />
        </template>
        <wd-cell title="从站地址" :value="String(modbusConfig?.slaveId || '-')" />
        <template v-if="isServer">
          <wd-cell title="工作模式">
            <dict-tag :type="DICT_TYPE.IOT_MODBUS_MODE" :value="modbusConfig?.mode" />
          </wd-cell>
          <wd-cell title="帧格式">
            <dict-tag :type="DICT_TYPE.IOT_MODBUS_FRAME_FORMAT" :value="modbusConfig?.frameFormat" />
          </wd-cell>
        </template>
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="modbusConfig?.status" />
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- 点位操作 -->
    <view class="flex items-center gap-16rpx p-24rpx pb-0">
      <view class="flex-1" @click="visible = true">
        <wd-search :placeholder="placeholder" hide-cancel disabled />
      </view>
      <wd-button v-if="hasAccessByCodes(['iot:device:update'])" size="small" type="primary" @click="handleCreatePoint">
        新增点位
      </wd-button>
    </view>

    <!-- 搜索弹窗 -->
    <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            属性名称
          </view>
          <wd-input v-model="formData.name" placeholder="请输入属性名称" clearable />
        </view>
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            标识符
          </view>
          <wd-input v-model="formData.identifier" placeholder="请输入标识符" clearable />
        </view>
        <yd-search-picker
          v-model="formData.functionCode"
          label="功能码"
          :columns="ModbusFunctionCodeOptions"
          all-option
        />
        <yd-search-picker
          v-model="formData.status"
          label="状态"
          :dict-type="DICT_TYPE.COMMON_STATUS"
          all-option
        />
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 点位列表 -->
    <z-paging ref="pagingRef" v-model="pointList" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无 Modbus 点位" @query="queryPointList">
      <view class="p-24rpx">
        <view v-for="item in pointList" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ item.name || item.identifier }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.identifier || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">功能码：</text>{{ getModbusFunctionCodeLabel(item.functionCode) }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">寄存器地址：</text>{{ formatRegisterAddress(item.registerAddress) }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">数据类型：</text>{{ item.rawDataType || '-' }} / {{ item.byteOrder || '-' }}
          </view>
          <view class="mb-16rpx text-24rpx text-[#999]">
            轮询间隔：{{ item.pollInterval ? `${item.pollInterval} ms` : '-' }}
          </view>
          <view v-if="hasAccessByCodes(['iot:device:update'])" class="flex justify-end gap-16rpx">
            <wd-button size="small" type="primary" variant="plain" @click="handleEditPoint(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDeletePoint(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 连接配置表单弹窗 -->
    <wd-popup v-model="configVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="bg-white pb-32rpx">
        <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-24rpx">
          <view class="text-32rpx text-[#333] font-semibold">
            编辑连接配置
          </view>
          <wd-icon name="close" size="36rpx" @click="configVisible = false" />
        </view>
        <scroll-view scroll-y class="max-h-60vh">
          <wd-form ref="configFormRef" :model="configFormData" :schema="configFormSchema">
            <wd-cell-group border>
              <template v-if="isClient">
                <wd-form-item title="IP 地址" title-width="200rpx" prop="ip">
                  <wd-input v-model="configFormData.ip" clearable placeholder="请输入服务器 IP 地址" />
                </wd-form-item>
                <wd-form-item title="端口" title-width="200rpx" prop="port">
                  <wd-input-number v-model="configFormData.port" :min="1" :max="65535" />
                </wd-form-item>
              </template>
              <wd-form-item title="从站地址" title-width="200rpx" prop="slaveId">
                <wd-input-number v-model="configFormData.slaveId" :min="1" :max="247" />
              </wd-form-item>
              <template v-if="isClient">
                <wd-form-item title="连接超时(ms)" title-width="200rpx" prop="timeout">
                  <wd-input-number v-model="configFormData.timeout" :min="1000" :step="1000" />
                </wd-form-item>
                <wd-form-item title="重试间隔(ms)" title-width="200rpx" prop="retryInterval">
                  <wd-input-number v-model="configFormData.retryInterval" :min="1000" :step="1000" />
                </wd-form-item>
              </template>
              <template v-if="isServer">
                <wd-form-item title="工作模式" title-width="200rpx" center prop="mode">
                  <wd-radio-group v-model="configFormData.mode" type="button">
                    <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.IOT_MODBUS_MODE)" :key="dict.value" :name="dict.value" :value="dict.value">
                      {{ dict.label }}
                    </wd-radio>
                  </wd-radio-group>
                </wd-form-item>
                <wd-form-item title="帧格式" title-width="200rpx" center prop="frameFormat">
                  <wd-radio-group v-model="configFormData.frameFormat" type="button">
                    <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.IOT_MODBUS_FRAME_FORMAT)" :key="dict.value" :name="dict.value" :value="dict.value">
                      {{ dict.label }}
                    </wd-radio>
                  </wd-radio-group>
                </wd-form-item>
              </template>
              <wd-form-item title="状态" title-width="200rpx" center prop="status">
                <wd-radio-group v-model="configFormData.status" type="button">
                  <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :name="dict.value" :value="dict.value">
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </scroll-view>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="configLoading" @click="handleConfigSubmit">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 点位表单弹窗 -->
    <wd-popup v-model="pointVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="bg-white pb-32rpx">
        <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-24rpx">
          <view class="text-32rpx text-[#333] font-semibold">
            {{ pointTitle }}
          </view>
          <wd-icon name="close" size="36rpx" @click="pointVisible = false" />
        </view>
        <scroll-view scroll-y class="max-h-60vh">
          <wd-form ref="pointFormRef" :model="pointFormData" :schema="pointFormSchema">
            <wd-cell-group border>
              <wd-form-item
                title="物模型属性" title-width="200rpx" prop="thingModelId"
                is-link :value="thingModelLabel" placeholder="请选择物模型属性"
                @click="thingModelPickerVisible = true"
              />
              <wd-form-item
                title="功能码" title-width="200rpx" prop="functionCode"
                is-link :value="functionCodeLabel" placeholder="请选择功能码"
                @click="functionCodePickerVisible = true"
              />
              <wd-form-item title="寄存器地址" title-width="200rpx" prop="registerAddress">
                <wd-input v-model.number="pointFormData.registerAddress" type="number" clearable placeholder="请输入寄存器地址">
                  <template #suffix>
                    <text class="text-[#999]">{{ registerAddressHex }}</text>
                  </template>
                </wd-input>
              </wd-form-item>
              <wd-form-item title="寄存器数量" title-width="200rpx" prop="registerCount">
                <wd-input-number v-model="pointFormData.registerCount" :min="1" :max="125" />
              </wd-form-item>
              <wd-form-item
                title="原始数据类型" title-width="200rpx" prop="rawDataType"
                is-link :value="rawDataTypeLabel" placeholder="请选择数据类型"
                @click="rawDataTypePickerVisible = true"
              />
              <wd-form-item
                title="字节序" title-width="200rpx" prop="byteOrder"
                is-link :value="byteOrderLabel" placeholder="请选择字节序"
                @click="byteOrderPickerVisible = true"
              />
              <wd-form-item title="缩放因子" title-width="200rpx" prop="scale">
                <wd-input-number v-model="pointFormData.scale" :precision="6" :step="0.1" />
              </wd-form-item>
              <wd-form-item title="轮询间隔(ms)" title-width="200rpx" prop="pollInterval">
                <wd-input-number v-model="pointFormData.pollInterval" :min="100" :step="1000" />
              </wd-form-item>
              <wd-form-item title="状态" title-width="200rpx" center prop="status">
                <wd-radio-group v-model="pointFormData.status" type="button">
                  <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :name="dict.value" :value="dict.value">
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
        </scroll-view>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="pointLoading" @click="handlePointSubmit">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 物模型属性选择器 -->
    <wd-select-picker
      v-model:visible="thingModelPickerVisible"
      :model-value="pointFormData.thingModelId ?? ''"
      title="请选择物模型属性"
      :columns="propertyOptions"
      value-key="id"
      label-key="label"
      type="radio"
      filterable
      @update:model-value="pointFormData.thingModelId = toOptionalNumber($event)"
      @confirm="handleThingModelConfirm"
    />
    <!-- 功能码选择器 -->
    <wd-select-picker
      v-model:visible="functionCodePickerVisible"
      :model-value="pointFormData.functionCode ?? ''"
      title="请选择功能码"
      :columns="ModbusFunctionCodeOptions"
      value-key="value"
      label-key="label"
      type="radio"
      @update:model-value="pointFormData.functionCode = toOptionalNumber($event)"
    />
    <!-- 原始数据类型选择器 -->
    <wd-select-picker
      v-model:visible="rawDataTypePickerVisible"
      :model-value="pointFormData.rawDataType ?? ''"
      title="请选择数据类型"
      :columns="rawDataTypeColumns"
      value-key="value"
      label-key="label"
      type="radio"
      @update:model-value="pointFormData.rawDataType = toOptionalString($event)"
      @confirm="handleRawDataTypeConfirm"
    />
    <!-- 字节序选择器 -->
    <wd-select-picker
      v-model:visible="byteOrderPickerVisible"
      :model-value="pointFormData.byteOrder ?? ''"
      title="请选择字节序"
      :columns="byteOrderColumns"
      value-key="value"
      label-key="label"
      type="radio"
      @update:model-value="pointFormData.byteOrder = toOptionalString($event)"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Device } from '@/api/iot/device/device'
import type { DeviceModbusConfig } from '@/api/iot/device/modbus/config'
import type { DeviceModbusPoint } from '@/api/iot/device/modbus/point'
import type { Product } from '@/api/iot/product/product'
import type { ThingModelData } from '@/api/iot/thingmodel'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { getDevice } from '@/api/iot/device/device'
import { getModbusConfig, saveModbusConfig } from '@/api/iot/device/modbus/config'
import { createModbusPoint, deleteModbusPoint, getModbusPoint, getModbusPointPage, updateModbusPoint } from '@/api/iot/device/modbus/point'
import { getProduct, ProtocolTypeEnum } from '@/api/iot/product/product'
import { getThingModelList } from '@/api/iot/thingmodel'
import { useAccess } from '@/hooks/useAccess'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, getByteOrderOptions, getModbusFunctionCodeLabel, IoTThingModelTypeEnum, ModbusFunctionCodeOptions, ModbusRawDataTypeOptions } from '@/utils/constants'
import { toOptionalNumber, toOptionalString } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ deviceId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const { hasAccessByCodes } = useAccess()

const deviceData = ref<Device>() // 设备数据
const productData = ref<Product>() // 产品数据
const modbusConfig = ref<Partial<DeviceModbusConfig>>({}) // 连接配置
const thingModelList = ref<ThingModelData[]>([]) // 物模型列表
const pointList = ref<DeviceModbusPoint[]>([]) // 点位列表
const pagingRef = ref<any>() // 分页组件引用
const visible = ref(false) // 搜索弹窗显示状态
const queryParams = ref<Record<string, any>>({}) // 查询参数
const formData = reactive({
  name: undefined as string | undefined,
  identifier: undefined as string | undefined,
  functionCode: -1,
  status: -1,
}) // 搜索表单数据
const isClient = computed(() => productData.value?.protocolType === ProtocolTypeEnum.MODBUS_TCP_CLIENT) // Client 模式
const isServer = computed(() => productData.value?.protocolType === ProtocolTypeEnum.MODBUS_TCP_SERVER) // Server 模式
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`属性:${formData.name}`)
  }
  if (formData.identifier) {
    conditions.push(`标识符:${formData.identifier}`)
  }
  if (formData.functionCode !== -1) {
    conditions.push(`功能码:${getModbusFunctionCodeLabel(formData.functionCode)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getIntDictOptions(DICT_TYPE.COMMON_STATUS).find(dict => dict.value === formData.status)?.label || formData.status}`)
  }
  return conditions.length ? conditions.join(' | ') : '搜索 Modbus 点位'
})

// ========== 连接配置表单 ==========
const configVisible = ref(false) // 连接配置弹窗显示状态
const configLoading = ref(false) // 连接配置提交状态
const configFormRef = ref<FormInstance>() // 连接配置表单引用
const configFormData = ref<DeviceModbusConfig>(buildDefaultConfig()) // 连接配置表单数据
const configFormSchema = createFormSchema(() => { // 连接配置校验：Client/Server 字段差异
  const rules: Record<string, any[]> = {
    slaveId: [{ required: true, message: '请输入从站地址' }],
    status: [{ required: true, message: '请选择状态' }],
  }
  if (isClient.value) {
    rules.ip = [{ required: true, message: '请输入 IP 地址' }]
    rules.port = [{ required: true, message: '请输入端口' }]
    rules.timeout = [{ required: true, message: '请输入连接超时时间' }]
    rules.retryInterval = [{ required: true, message: '请输入重试间隔' }]
  }
  if (isServer.value) {
    rules.mode = [{ required: true, message: '请选择工作模式' }]
    rules.frameFormat = [{ required: true, message: '请选择帧格式' }]
  }
  return rules
})

// ========== 点位表单 ==========
const pointVisible = ref(false) // 点位弹窗显示状态
const pointLoading = ref(false) // 点位提交状态
const pointTitle = ref('') // 点位弹窗标题
const pointFormRef = ref<FormInstance>() // 点位表单引用
const pointFormData = ref<DeviceModbusPoint>(buildDefaultPoint()) // 点位表单数据
const thingModelPickerVisible = ref(false) // 物模型属性选择器显示状态
const functionCodePickerVisible = ref(false) // 功能码选择器显示状态
const rawDataTypePickerVisible = ref(false) // 原始数据类型选择器显示状态
const byteOrderPickerVisible = ref(false) // 字节序选择器显示状态
const pointFormSchema = createFormSchema({
  thingModelId: [{ required: true, message: '请选择物模型属性' }],
  functionCode: [{ required: true, message: '请选择功能码' }],
  registerAddress: [{ required: true, message: '请输入寄存器地址' }, { type: 'number', min: 0, max: 65535 }],
  registerCount: [{ required: true, message: '请输入寄存器数量' }],
  rawDataType: [{ required: true, message: '请选择数据类型' }],
  byteOrder: [{ required: true, message: '请选择字节序' }],
  pollInterval: [{ required: true, message: '请输入轮询间隔' }],
  status: [{ required: true, message: '请选择状态' }],
})

const propertyOptions = computed(() => { // 属性类型物模型选项（下拉用）
  return thingModelList.value
    .filter(item => item.type === IoTThingModelTypeEnum.PROPERTY)
    .map(item => ({ id: item.id!, label: `${item.name} (${item.identifier})` }))
})
const rawDataTypeColumns = computed(() => ModbusRawDataTypeOptions.map(item => ({ value: item.value, label: `${item.label} - ${item.description}` }))) // 数据类型下拉项
const byteOrderColumns = computed(() => getByteOrderOptions(pointFormData.value.rawDataType).map(item => ({ value: item.value, label: `${item.label} - ${item.description}` }))) // 字节序下拉项（随数据类型变化）
const thingModelLabel = computed(() => propertyOptions.value.find(item => item.id === pointFormData.value.thingModelId)?.label || '')
const functionCodeLabel = computed(() => getModbusFunctionCodeLabel(pointFormData.value.functionCode))
const rawDataTypeLabel = computed(() => pointFormData.value.rawDataType || '')
const byteOrderLabel = computed(() => pointFormData.value.byteOrder || '')
const registerAddressHex = computed(() => { // 寄存器地址十六进制显示
  const address = pointFormData.value.registerAddress
  if (address === undefined || address === null) {
    return ''
  }
  return `0x${address.toString(16).toUpperCase().padStart(4, '0')}`
})

/** 构造连接配置默认值 */
function buildDefaultConfig(): DeviceModbusConfig {
  return {
    deviceId: Number(props.deviceId),
    ip: '',
    port: 502,
    slaveId: 1,
    timeout: 3000,
    retryInterval: 10000,
    mode: 1,
    frameFormat: 1,
    status: CommonStatusEnum.ENABLE,
  }
}

/** 构造点位默认值 */
function buildDefaultPoint(): DeviceModbusPoint {
  return {
    deviceId: Number(props.deviceId),
    thingModelId: undefined,
    identifier: '',
    name: '',
    functionCode: undefined,
    registerAddress: undefined,
    registerCount: undefined,
    byteOrder: undefined,
    rawDataType: undefined,
    scale: 1,
    pollInterval: 5000,
    status: CommonStatusEnum.ENABLE,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 初始化详情 */
async function getDetail() {
  if (!props.deviceId) {
    return
  }
  deviceData.value = await getDevice(Number(props.deviceId))
  if (deviceData.value.productId) {
    productData.value = await getProduct(Number(deviceData.value.productId))
    thingModelList.value = await getThingModelList({ productId: deviceData.value.productId })
  }
  modbusConfig.value = await getModbusConfig(Number(props.deviceId)) || {}
}

/** 查询点位列表 */
async function queryPointList(pageNo: number, pageSize: number) {
  if (!props.deviceId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getModbusPointPage({
      ...queryParams.value,
      deviceId: Number(props.deviceId),
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 格式化寄存器地址 */
function formatRegisterAddress(address?: number) {
  if (address === undefined || address === null) {
    return '-'
  }
  return `0x${address.toString(16).toUpperCase().padStart(4, '0')}`
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  queryParams.value = {
    name: formData.name || undefined,
    identifier: formData.identifier || undefined,
    functionCode: formData.functionCode === -1 ? undefined : formData.functionCode,
    status: formData.status === -1 ? undefined : formData.status,
  }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.identifier = undefined
  formData.functionCode = -1
  formData.status = -1
  visible.value = false
  queryParams.value = {}
  pagingRef.value?.reload()
}

/** 编辑连接配置 */
function handleEditConfig() {
  configFormData.value = modbusConfig.value?.id
    ? { ...buildDefaultConfig(), ...modbusConfig.value }
    : buildDefaultConfig()
  configVisible.value = true
}

/** 提交连接配置 */
async function handleConfigSubmit() {
  const { valid } = await configFormRef.value.validate()
  if (!valid) {
    return
  }

  configLoading.value = true
  try {
    const data = { ...configFormData.value, deviceId: Number(props.deviceId) }
    await saveModbusConfig(data)
    toast.success('保存成功')
    configVisible.value = false
    modbusConfig.value = await getModbusConfig(Number(props.deviceId)) || {}
  } finally {
    configLoading.value = false
  }
}

/** 新增点位 */
function handleCreatePoint() {
  pointTitle.value = '新增点位'
  pointFormData.value = buildDefaultPoint()
  pointVisible.value = true
}

/** 编辑点位 */
async function handleEditPoint(item: DeviceModbusPoint) {
  pointTitle.value = '编辑点位'
  pointVisible.value = true
  pointLoading.value = true
  try {
    pointFormData.value = await getModbusPoint(item.id!)
  } finally {
    pointLoading.value = false
  }
}

/** 删除点位 */
async function handleDeletePoint(item: DeviceModbusPoint) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该点位吗？' })
  } catch {
    return
  }
  await deleteModbusPoint(item.id!)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 提交点位 */
async function handlePointSubmit() {
  const { valid } = await pointFormRef.value.validate()
  if (!valid) {
    return
  }

  pointLoading.value = true
  try {
    const data = { ...pointFormData.value, deviceId: Number(props.deviceId) }
    if (data.id) {
      await updateModbusPoint(data)
      toast.success('更新成功')
    } else {
      await createModbusPoint(data)
      toast.success('创建成功')
    }
    pointVisible.value = false
    pagingRef.value?.reload()
  } finally {
    pointLoading.value = false
  }
}

/** 物模型属性选择确认：同步标识符、名称 */
function handleThingModelConfirm({ value }: { value: any }) {
  const thingModel = thingModelList.value.find(item => item.id === value)
  if (thingModel) {
    pointFormData.value.identifier = thingModel.identifier!
    pointFormData.value.name = thingModel.name!
  }
}

/** 数据类型选择确认：自动算寄存器数量、重置字节序 */
function handleRawDataTypeConfirm({ value }: { value: any }) {
  const option = ModbusRawDataTypeOptions.find(item => item.value === value)
  if (option && option.registerCount > 0) {
    pointFormData.value.registerCount = option.registerCount
  }
  const byteOrderOptions = getByteOrderOptions(value)
  pointFormData.value.byteOrder = byteOrderOptions[0]?.value
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
