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
          <wd-form-item
            title="升级固件"
            title-width="220rpx"
            prop="firmwareId"
            :is-link="!firmwareId"
            :value="firmwareLabel"
            placeholder="请选择升级固件"
            @click="openFirmwarePicker"
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
          <DevicePicker
            v-if="formData.deviceScope === IoTOtaTaskDeviceScopeEnum.SELECT.value"
            v-model="formData.deviceIds"
            label="指定设备"
            prop="deviceIds"
            :columns="deviceOptions"
            type="checkbox"
            placeholder="请选择设备"
            label-width="220rpx"
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

    <!-- 固件选择弹窗 -->
    <wd-popup v-model="firmwarePickerVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          选择升级固件
        </view>
        <view class="mb-24rpx flex gap-16rpx">
          <wd-input v-model="firmwareKeyword" class="flex-1" placeholder="请输入固件名称" clearable />
          <wd-button type="primary" @click="reloadFirmwareList">
            搜索
          </wd-button>
          <wd-button variant="plain" @click="resetFirmwareQuery">
            重置
          </wd-button>
        </view>
        <view class="h-[52vh]">
          <z-paging
            ref="firmwarePagingRef"
            v-model="firmwareList"
            :fixed="false"
            class="h-full"
            :default-page-size="10"
            :refresher-enabled="true"
            :inside-more="true"
            :loading-more-default-as-loading="true"
            empty-view-text="暂无固件数据"
            @query="queryFirmwareList"
          >
            <view class="pb-12rpx">
              <view
                v-for="item in firmwareList"
                :key="item.id"
                class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-20rpx"
                @click="handleSelectFirmware(item)"
              >
                <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                  <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-medium">
                    {{ item.name || '-' }}
                  </view>
                  <wd-tag v-if="String(item.id) === String(formData.firmwareId)" type="primary" variant="plain">
                    已选
                  </wd-tag>
                </view>
                <view class="mb-8rpx text-26rpx text-[#666]">
                  <text class="mr-8rpx text-[#999]">版本号：</text>{{ item.version || '-' }}
                </view>
                <view class="text-24rpx text-[#999]">
                  {{ item.productName || item.productId || '-' }}
                </view>
              </view>
            </view>
          </z-paging>
        </view>
        <wd-button class="mt-24rpx" block variant="plain" @click="firmwarePickerVisible = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Device } from '@/api/iot/device/device'
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import type { OtaTask } from '@/api/iot/ota/task'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getDeviceListByProductId } from '@/api/iot/device/device'
import { getOtaFirmware, getOtaFirmwarePage } from '@/api/iot/ota/firmware'
import { createOtaTask } from '@/api/iot/ota/task'
import { getIntDictOptions } from '@/hooks/useDict'
import DevicePicker from '@/pages-iot/device/device/components/device-picker.vue'
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
const firmwareList = ref<OtaFirmware[]>([]) // 固件列表
const firmwarePagingRef = ref<any>() // 固件分页组件引用
const firmwarePickerVisible = ref(false) // 固件选择弹窗显示状态
const firmwareKeyword = ref('') // 固件搜索关键字
const selectedFirmware = ref<OtaFirmware>() // 当前选中的固件
const deviceOptions = ref<Device[]>([]) // 设备选项
const formData = ref<OtaTask>({
  name: '',
  description: '',
  firmwareId,
  deviceScope: IoTOtaTaskDeviceScopeEnum.ALL.value,
  deviceIds: [],
}) // 表单数据
const firmwareLabel = computed(() => {
  if (selectedFirmware.value) {
    return [selectedFirmware.value.version, selectedFirmware.value.name].filter(Boolean).join(' / ')
  }
  return formData.value.firmwareId ? String(formData.value.firmwareId) : ''
}) // 固件展示文案
const formSchema = createFormSchema({
  name: [{ required: true, message: '任务名称不能为空' }],
  firmwareId: [{ required: true, message: '升级固件不能为空' }],
  deviceScope: [{ required: true, message: '升级范围不能为空' }],
  deviceIds: [{ required: model => model?.deviceScope === IoTOtaTaskDeviceScopeEnum.SELECT.value, message: '指定设备不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 切换升级固件时，按固件所属产品重新加载可选设备并清空已选 */
watch(() => formData.value.firmwareId, (targetFirmwareId) => {
  formData.value.deviceIds = []
  loadDeviceOptions(targetFirmwareId)
})

/** 按固件所属产品加载设备选项 */
async function loadDeviceOptions(targetFirmwareId?: number) {
  const currentProductId = getProductIdByFirmwareId(targetFirmwareId)
  deviceOptions.value = currentProductId ? await getDeviceListByProductId(currentProductId) : []
}

/** 获取固件所属产品编号 */
function getProductIdByFirmwareId(targetFirmwareId?: number) {
  if (selectedFirmware.value?.id === targetFirmwareId) {
    return selectedFirmware.value.productId
  }
  if (targetFirmwareId === firmwareId && productId) {
    return productId
  }
  const firmware = firmwareList.value.find(item => item.id === targetFirmwareId)
  return firmware?.productId
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/ota/task/index')
}

/** 打开固件选择弹窗 */
function openFirmwarePicker() {
  if (firmwareId) {
    return
  }
  firmwarePickerVisible.value = true
  nextTick(() => firmwarePagingRef.value?.reload())
}

/** 查询固件列表 */
async function queryFirmwareList(pageNo: number, pageSize: number) {
  try {
    const data = await getOtaFirmwarePage({
      pageNo,
      pageSize,
      name: firmwareKeyword.value || undefined,
    })
    firmwarePagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    firmwarePagingRef.value?.complete(false)
  }
}

/** 重新加载固件列表 */
function reloadFirmwareList() {
  firmwarePagingRef.value?.reload()
}

/** 重置固件搜索条件 */
function resetFirmwareQuery() {
  firmwareKeyword.value = ''
  reloadFirmwareList()
}

/** 选择固件 */
function handleSelectFirmware(item: OtaFirmware) {
  if (!item.id) {
    return
  }
  selectedFirmware.value = item
  formData.value.firmwareId = item.id
  firmwarePickerVisible.value = false
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
    selectedFirmware.value = await getOtaFirmware(firmwareId)
    if (!selectedFirmware.value.productId && productId) {
      selectedFirmware.value.productId = productId
    }
    await loadDeviceOptions(firmwareId)
  }
})
</script>
