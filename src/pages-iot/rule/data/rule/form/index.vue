<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="规则名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入规则名称" clearable />
          </wd-form-item>
          <wd-form-item title="规则状态" title-width="200rpx" center prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <DataSinkPicker v-model="formData.sinkIds" prop="sinkIds" :columns="sinkOptions" />
          <wd-form-item title="规则描述" title-width="200rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入规则描述" :maxlength="200" show-word-limit />
          </wd-form-item>
        </wd-cell-group>

        <view class="mt-24rpx px-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-30rpx text-[#333] font-semibold">
              数据源
            </view>
            <wd-button size="small" type="primary" @click="handleAddSource">
              添加数据源
            </wd-button>
          </view>

          <view v-if="sourceConfigs.length === 0" class="rounded-12rpx bg-white py-56rpx text-center text-28rpx text-[#999]">
            暂无数据源配置
          </view>

          <view v-for="(item, index) in sourceConfigs" :key="index" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx flex items-center justify-between">
              <view class="text-28rpx text-[#333] font-semibold">
                数据源 {{ index + 1 }}
              </view>
              <wd-button size="small" type="danger" variant="plain" @click="handleDeleteSource(index)">
                删除
              </wd-button>
            </view>
            <ProductFormPicker
              v-model="item.productId"
              label="产品"
              label-width="180rpx"
              placeholder="请选择产品"
              :columns="productOptions"
              @update:model-value="handleSourceProductChange(item)"
            />
            <DeviceFormPicker
              v-model="item.deviceId"
              label="设备"
              label-width="180rpx"
              placeholder="请选择设备"
              :columns="getDeviceOptions(item.productId)"
            />
            <yd-form-picker
              v-model="item.method"
              label="消息"
              :columns="upstreamMethodOptions"
              label-key="name"
              value-key="method"
              placeholder="请选择消息"
              label-width="180rpx"
              @update:model-value="handleSourceMethodChange(item)"
            />
            <ThingModelPicker
              v-if="shouldShowIdentifierSelect(item)"
              v-model="item.identifier"
              label="标识符"
              :columns="getThingModelOptions(item)"
              label-key="label"
              value-key="value"
              placeholder="请选择标识符"
              label-width="180rpx"
            />
          </view>
        </view>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DataRule } from '@/api/iot/rule/data/rule'
import type { DataSink } from '@/api/iot/rule/data/sink'
import type { Device } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import type { ThingModelData } from '@/api/iot/thingmodel'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimpleDeviceList } from '@/api/iot/device/device'
import { createDataRule, getDataRule, updateDataRule } from '@/api/iot/rule/data/rule'
import { getSimpleDataSinkList } from '@/api/iot/rule/data/sink'
import { getSimpleProductList } from '@/api/iot/product/product'
import { getThingModelList } from '@/api/iot/thingmodel'
import { getIntDictOptions } from '@/hooks/useDict'
import DeviceFormPicker from '@/pages-iot/device/device/components/device-form-picker.vue'
import ProductFormPicker from '@/pages-iot/product/product/components/product-form-picker.vue'
import DataSinkPicker from '@/pages-iot/rule/data/sink/components/data-sink-picker.vue'
import ThingModelPicker from '@/pages-iot/thingmodel/components/thing-model-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, IOT_ALL_DEVICE_OPTION, IotDeviceMessageMethodEnum, IoTThingModelTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑数据规则' : '新增数据规则')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DataRule>({ id: undefined, name: '', description: '', status: CommonStatusEnum.ENABLE, sourceConfigs: [], sinkIds: [] }) // 表单数据
const sourceConfigs = ref<any[]>([]) // 数据源配置
const sinkOptions = ref<DataSink[]>([]) // 数据目的选项
const productOptions = ref<Product[]>([]) // 产品选项
const deviceOptions = ref<Device[]>([]) // 设备选项
const thingModelCache = ref<Record<string, ThingModelData[]>>({}) // 物模型缓存
const formSchema = createFormSchema({
  name: [{ required: true, message: '规则名称不能为空' }],
  status: [{ required: true, message: '规则状态不能为空' }],
  sinkIds: [{ required: true, message: '数据目的不能为空' }],
  sourceConfigs: [{ required: true, message: '数据源不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const upstreamMethodOptions = computed(() => {
  return Object.values(IotDeviceMessageMethodEnum).filter(item => item.upstream)
})

watch(
  sourceConfigs,
  (items) => {
    items.forEach((item) => {
      if (shouldShowIdentifierSelect(item) && item.productId) {
        loadThingModel(Number(item.productId))
      }
    })
  },
  { deep: true },
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/rule/data/rule/index')
}

/** 加载数据规则详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDataRule(Number(props.id))
  sourceConfigs.value = [...(formData.value.sourceConfigs || [])]
  sourceConfigs.value.forEach((item) => {
    if (shouldShowIdentifierSelect(item) && item.productId) {
      loadThingModel(Number(item.productId))
    }
  })
}

/** 添加数据源 */
function handleAddSource() {
  sourceConfigs.value.push({
    productId: undefined,
    deviceId: 0,
    method: undefined,
    identifier: undefined,
  })
}

/** 删除数据源 */
function handleDeleteSource(index: number) {
  sourceConfigs.value.splice(index, 1)
}

/** 数据源产品变更 */
function handleSourceProductChange(item: any) {
  item.deviceId = 0
  item.method = undefined
  item.identifier = undefined
}

/** 数据源消息变更 */
function handleSourceMethodChange(item: any) {
  item.identifier = undefined
  if (shouldShowIdentifierSelect(item) && item.productId) {
    loadThingModel(Number(item.productId))
  }
}

/** 获取设备选项 */
function getDeviceOptions(productId?: number) {
  const devices = productId
    ? deviceOptions.value.filter(item => String(item.productId) === String(productId))
    : []
  return [
    IOT_ALL_DEVICE_OPTION,
    ...devices,
  ]
}

/** 是否需要选择标识符 */
function shouldShowIdentifierSelect(row: any) {
  return [
    IotDeviceMessageMethodEnum.EVENT_POST.method,
    IotDeviceMessageMethodEnum.PROPERTY_POST.method,
  ].includes(row.method)
}

/** 加载物模型 */
async function loadThingModel(productId: number) {
  const key = String(productId)
  if (thingModelCache.value[key]) {
    return
  }
  thingModelCache.value[key] = await getThingModelList({ productId })
}

/** 获取物模型标识符选项 */
function getThingModelOptions(row: any) {
  if (!row.productId || !shouldShowIdentifierSelect(row)) {
    return []
  }
  const list = thingModelCache.value[String(row.productId)] || []
  const targetType = row.method === IotDeviceMessageMethodEnum.EVENT_POST.method
    ? IoTThingModelTypeEnum.EVENT
    : IoTThingModelTypeEnum.PROPERTY
  return list
    .filter(item => item.type === targetType)
    .map(item => ({
      label: `${item.name || item.identifier} (${item.identifier})`,
      value: item.identifier,
    }))
}

/** 校验数据源 */
function validateSourceConfigs() {
  if (sourceConfigs.value.length === 0) {
    toast.warning('请至少添加一个数据源')
    return false
  }
  const invalidIndex = sourceConfigs.value.findIndex((item) => {
    const missingBase = !item.productId || (item.deviceId === undefined || item.deviceId === null) || !item.method
    const missingIdentifier = shouldShowIdentifierSelect(item) && !item.identifier
    return missingBase || missingIdentifier
  })
  if (invalidIndex >= 0) {
    toast.warning(`请完善数据源 ${invalidIndex + 1}`)
    return false
  }
  return true
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.sourceConfigs = sourceConfigs.value
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  if (!validateSourceConfigs()) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value, sourceConfigs: sourceConfigs.value }
    if (props.id) {
      await updateDataRule(data)
      toast.success('修改成功')
    } else {
      await createDataRule(data)
      toast.success('新增成功')
    }
    uni.$emit('iot:data-rule:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  const [sinks, products, devices] = await Promise.all([
    getSimpleDataSinkList(),
    getSimpleProductList(),
    getSimpleDeviceList(),
  ])
  sinkOptions.value = sinks
  productOptions.value = products
  deviceOptions.value = devices
  await getDetail()
})
</script>
