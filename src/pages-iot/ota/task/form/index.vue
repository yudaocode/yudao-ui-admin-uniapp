<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="创建 OTA 任务"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="任务名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入任务名称" clearable />
          </wd-form-item>
          <FirmwareFormPicker
            v-model="formData.firmwareId"
            label="升级固件"
            label-width="220rpx"
            prop="firmwareId"
            placeholder="请选择升级固件"
            :disabled="Boolean(firmwareId)"
            @change="handleFirmwareChange"
          />
          <wd-form-item title="升级范围" title-width="220rpx" center prop="deviceScope">
            <wd-radio-group v-model="formData.deviceScope" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <DeviceFormPicker
            v-if="formData.deviceScope === IoTOtaTaskDeviceScopeEnum.SELECT.value"
            v-model="formData.deviceIds"
            label="指定设备"
            label-width="220rpx"
            prop="deviceIds"
            placeholder="请选择设备"
            :columns="deviceOptions"
            type="checkbox"
          />
          <wd-form-item title="任务描述" title-width="220rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入任务描述"
              :maxlength="300"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部创建按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        创建
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Device } from '@/api/iot/device/device'
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import type { OtaTask } from '@/api/iot/ota/task'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getOtaFirmware } from '@/api/iot/ota/firmware'
import { createOtaTask } from '@/api/iot/ota/task'
import { getIntDictOptions } from '@/hooks/useDict'
import DeviceFormPicker from '@/pages-iot/device/device/components/device-form-picker.vue'
import FirmwareFormPicker from '@/pages-iot/ota/firmware/components/firmware-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, IoTOtaTaskDeviceScopeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  firmwareId?: number | any
  productId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const firmwareId = props.firmwareId ? Number(props.firmwareId) : undefined // 入口预置固件
const productId = props.productId ? Number(props.productId) : undefined // 入口预置产品
const formLoading = ref(false) // 表单提交状态
const selectedFirmware = ref<OtaFirmware>() // 当前选中的固件
const deviceOptions = ref<Device[]>([]) // 设备选项
const formData = ref<OtaTask>({
  name: '',
  description: '',
  firmwareId,
  deviceScope: IoTOtaTaskDeviceScopeEnum.ALL.value,
  deviceIds: [],
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '任务名称不能为空' }],
  firmwareId: [{ required: true, message: '升级固件不能为空' }],
  deviceScope: [{ required: true, message: '升级范围不能为空' }],
  deviceIds: [{ required: model => model?.deviceScope === IoTOtaTaskDeviceScopeEnum.SELECT.value, message: '指定设备不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 按固件所属产品加载设备选项 */
async function loadDeviceOptions(targetFirmwareId?: number) {
  const currentProductId = getProductIdByFirmwareId(targetFirmwareId)
  const options = currentProductId ? await getDeviceListByProductId(currentProductId) : []
  if (formData.value.firmwareId === targetFirmwareId) {
    deviceOptions.value = options
  }
}

/** 获取固件所属产品编号 */
function getProductIdByFirmwareId(targetFirmwareId?: number) {
  if (selectedFirmware.value?.id === targetFirmwareId) {
    return selectedFirmware.value.productId
  }
  if (targetFirmwareId === firmwareId && productId) {
    return productId
  }
  return undefined
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/ota/task/index')
}

/** 选择固件并刷新可选设备 */
async function handleFirmwareChange(item?: OtaFirmware) {
  selectedFirmware.value = item
  formData.value.deviceIds = []
  await loadDeviceOptions(item?.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await createOtaTask(formData.value)
    toast.success('创建成功')
    uni.$emit('iot:ota-task:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (firmwareId) {
    if (!productId) {
      selectedFirmware.value = await getOtaFirmware(firmwareId)
    }
    await loadDeviceOptions(firmwareId)
  }
})
</script>
