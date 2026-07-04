<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="告警记录详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="记录编号" :value="String(formData?.id || '-')" />
        <wd-cell title="告警名称" :value="formData?.configName || '-'" />
        <wd-cell title="告警级别">
          <dict-tag :type="DICT_TYPE.IOT_ALERT_LEVEL" :value="formData?.configLevel" />
        </wd-cell>
        <wd-cell title="产品" :value="productName || (formData?.productId != null ? String(formData.productId) : '-')" />
        <wd-cell title="设备" :value="deviceName || (formData?.deviceId != null ? String(formData.deviceId) : '-')" />
        <wd-cell title="是否处理">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.processStatus" />
        </wd-cell>
        <wd-cell title="处理结果" :value="formData?.processRemark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="m-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          设备消息
        </view>
        <text class="break-all text-24rpx text-[#666]">
          {{ formatJson(formData?.deviceMessage, '{}') }}
        </text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="!formData?.processStatus && hasAccessByCodes(['iot:alert-record:process'])" class="yd-detail-footer">
      <wd-button type="primary" block @click="processVisible = true">
        处理告警
      </wd-button>
    </view>

    <!-- 处理弹窗 -->
    <wd-popup v-model="processVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          处理告警
        </view>
        <wd-textarea v-model="processRemark" placeholder="请输入处理结果" :maxlength="300" show-word-limit />
        <wd-button class="mt-24rpx" type="primary" block :loading="processing" @click="handleProcess">
          确认处理
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { AlertRecord } from '@/api/iot/alert/record'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { getAlertRecord, processAlertRecord } from '@/api/iot/alert/record'
import { getDevice } from '@/api/iot/device/device'
import { getProduct } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<AlertRecord>() // 详情数据
const processVisible = ref(false) // 处理弹窗
const processing = ref(false) // 处理状态
const processRemark = ref('') // 处理结果
const productName = ref('') // 产品名称（本地解析）
const deviceName = ref('') // 设备名称（本地解析）

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/alert/record/index')
}

/** 加载告警记录详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAlertRecord(Number(props.id))
  productName.value = formData.value.productName || ''
  deviceName.value = formData.value.deviceName || ''
  // 记录仅返回产品/设备 ID，单独解析名称
  if (!productName.value && formData.value.productId) {
    productName.value = (await getProduct(formData.value.productId))?.name || ''
  }
  if (!deviceName.value && formData.value.deviceId) {
    deviceName.value = (await getDevice(formData.value.deviceId))?.deviceName || ''
  }
}

/** 处理告警 */
async function handleProcess() {
  if (!props.id || !processRemark.value.trim()) {
    toast.warning('请输入处理结果')
    return
  }
  processing.value = true
  try {
    await processAlertRecord(Number(props.id), processRemark.value)
    toast.success('处理成功')
    processVisible.value = false
    uni.$emit('iot:alert-record:reload')
    await getDetail()
  } finally {
    processing.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
