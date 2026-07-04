<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.productId"
            label="所属产品"
            prop="productId"
            :columns="productOptions"
            label-key="name"
            value-key="id"
            placeholder="请选择产品"
            label-width="220rpx"
            :disabled="!!props.id"
          />
          <wd-form-item title="DeviceName" title-width="220rpx" prop="deviceName">
            <wd-input v-model="formData.deviceName" placeholder="请输入 DeviceName" :disabled="!!props.id" clearable />
          </wd-form-item>
          <wd-form-item title="备注名称" title-width="220rpx" prop="nickname">
            <wd-input v-model="formData.nickname" placeholder="请输入备注名称" clearable />
          </wd-form-item>
          <wd-form-item title="设备图片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" directory="iot/device" />
          </wd-form-item>
          <DeviceGroupPicker
            v-model="formData.groupIds"
            label-width="220rpx"
          />
          <wd-form-item title="设备序列号" title-width="220rpx" prop="serialNumber">
            <wd-input v-model="formData.serialNumber" placeholder="请输入设备序列号" clearable />
          </wd-form-item>
          <wd-form-item title="经度" title-width="220rpx" prop="longitude" center>
            <wd-input-number
              v-model="longitudeModel"
              :min="-180"
              :max="180"
              :step="0.000001"
              :precision="6"
              input-width="280rpx"
              allow-null
            />
          </wd-form-item>
          <wd-form-item title="纬度" title-width="220rpx" prop="latitude" center>
            <wd-input-number
              v-model="latitudeModel"
              :min="-90"
              :max="90"
              :step="0.000001"
              :precision="6"
              input-width="280rpx"
              allow-null
            />
          </wd-form-item>
        </wd-cell-group>
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
import type { Device } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createDevice, getDevice, updateDevice } from '@/api/iot/device/device'
import { getSimpleProductList } from '@/api/iot/product/product'
import DeviceGroupPicker from '@/pages-iot/device/group/components/device-group-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { toFiniteNumber } from '@/utils/format'
import { isEmptyValue } from '@/utils/is'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑设备' : '新增设备')
type DeviceFormData = Omit<Device, 'longitude' | 'latitude'> & {
  longitude?: number | string
  latitude?: number | string
}
const formLoading = ref(false) // 表单提交状态
const productOptions = ref<Product[]>([]) // 产品选项
const formData = ref<DeviceFormData>({
  id: undefined,
  productId: undefined,
  deviceName: '',
  nickname: '',
  picUrl: '',
  deviceType: undefined,
  serialNumber: '',
  longitude: '',
  latitude: '',
  config: '',
  groupIds: [],
}) // 表单数据
const formSchema = createFormSchema({
  productId: [{ required: true, message: '所属产品不能为空' }],
  deviceName: [
    { required: true, message: 'DeviceName 不能为空' },
    { pattern: /^[\w.\-:@]{4,32}$/, message: 'DeviceName 长度 4~32，支持字母、数字和 _-.:@' },
  ],
  nickname: [{ pattern: /^.{2,64}$/, message: '备注名称长度为 2~64 个字符' }],
  longitude: [{ validator: validateLongitude, message: '经度需在 -180 ~ 180 之间' }],
  latitude: [{ validator: validateLatitude, message: '纬度需在 -90 ~ 90 之间' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const longitudeModel = computed({
  get: () => formData.value.longitude ?? '',
  set: value => formData.value.longitude = value ?? '',
}) // 经度输入模型
const latitudeModel = computed({
  get: () => formData.value.latitude ?? '',
  set: value => formData.value.latitude = value ?? '',
}) // 纬度输入模型

watch(
  () => formData.value.productId,
  (productId) => {
    const product = productOptions.value.find(item => String(item.id) === String(productId))
    if (product?.deviceType !== undefined) {
      formData.value.deviceType = product.deviceType
    }
  },
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/device/device/index')
}

/** 校验经度 */
function validateLongitude(value: unknown, model: Record<string, any>) {
  if (!isEmptyValue(value)) {
    const longitude = Number(value)
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      return false
    }
    if (isEmptyValue(model.latitude)) {
      return '请同时填写纬度'
    }
  }
  return true
}

/** 校验纬度 */
function validateLatitude(value: unknown, model: Record<string, any>) {
  if (!isEmptyValue(value)) {
    const latitude = Number(value)
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      return false
    }
    if (isEmptyValue(model.longitude)) {
      return '请同时填写经度'
    }
  }
  return true
}

/** 表单详情数据 */
function normalizeFormData(data: Device): DeviceFormData {
  return {
    ...data,
    picUrl: data.picUrl || '',
    longitude: data.longitude ?? '',
    latitude: data.latitude ?? '',
    groupIds: data.groupIds || [],
  }
}

/** 加载设备详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = normalizeFormData(await getDevice(Number(props.id)))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: Device = {
      ...formData.value,
      longitude: toFiniteNumber(formData.value.longitude),
      latitude: toFiniteNumber(formData.value.latitude),
    }
    if (props.id) {
      await updateDevice(data)
      toast.success('修改成功')
    } else {
      await createDevice(data)
      toast.success('新增成功')
    }
    uni.$emit('iot:device:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getSimpleProductList()
  await getDetail()
})
</script>
