<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 82vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 弹窗标题 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          关闭
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          查看条码
        </view>
        <wd-button
          v-if="canGenerate"
          size="small"
          type="primary"
          :loading="creating"
          @click="handleGenerate"
        >
          生成
        </wd-button>
        <view v-else class="w-96rpx" />
      </view>

      <!-- 条码内容 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <view v-if="loading" class="flex justify-center py-80rpx">
          <wd-loading />
        </view>
        <view v-else class="p-24rpx">
          <view v-if="loadError" class="mb-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#d46b08] leading-38rpx">
            条码查询失败，请稍后重试。
          </view>
          <BarcodePreview :content="barcodeData.content" :format="barcodeData.format" />
          <wd-cell-group border class="mt-24rpx">
            <wd-cell title="条码格式">
              <dict-tag v-if="barcodeData.format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="barcodeData.format" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="业务类型">
              <dict-tag v-if="barcodeData.bizType != null" :type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" :value="barcodeData.bizType" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="条码内容" :value="barcodeData.content || '-'" />
            <wd-cell title="业务编码" :value="barcodeData.bizCode || '-'" />
            <wd-cell title="业务名称" :value="barcodeData.bizName || '-'" />
            <wd-cell title="状态">
              <dict-tag v-if="barcodeData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="barcodeData.status" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="创建时间" :value="formatDateTime(barcodeData.createTime) || '-'" />
          </wd-cell-group>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { WmBarcode } from '@/api/mes/wm/barcode'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { createBarcode, getBarcodeByBusiness } from '@/api/mes/wm/barcode'
import { useAccess } from '@/hooks/useAccess'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import BarcodePreview from './barcode-preview.vue'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 条码加载状态
const creating = ref(false) // 条码生成状态
const loadError = ref(false) // 条码加载失败状态
const barcodeData = ref<Partial<WmBarcode>>({}) // 条码数据
const canGenerate = computed(() => {
  return visible.value
    && !loading.value
    && !loadError.value
    && !barcodeData.value.content
    && barcodeData.value.bizType != null
    && barcodeData.value.bizId != null
    && hasAccessByCodes(['mes:wm-barcode:create'])
})

/** 打开弹窗 */
function open(row: Partial<WmBarcode>) {
  visible.value = true
  loadError.value = false
  barcodeData.value = { ...row }
}

/** 按业务对象打开弹窗 */
async function openByBusiness(bizId: number, bizType: number, bizCode?: string, bizName?: string) {
  visible.value = true
  loading.value = true
  loadError.value = false
  barcodeData.value = { bizId, bizType, bizCode, bizName }
  try {
    const data = await getBarcodeByBusiness(bizType, bizId)
    barcodeData.value = data ? { ...data } : { bizId, bizType, bizCode, bizName }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

/** 生成条码 */
async function handleGenerate() {
  const { bizId, bizType, bizCode, bizName } = barcodeData.value
  if (bizId == null || bizType == null) {
    toast.warning('缺少业务对象，无法生成条码')
    return
  }
  creating.value = true
  try {
    await createBarcode({
      bizId,
      bizType,
      bizCode,
      bizName,
      status: CommonStatusEnum.ENABLE,
    })
    const data = await getBarcodeByBusiness(bizType, bizId)
    barcodeData.value = data ? { ...data } : { bizId, bizType, bizCode, bizName }
    toast.success('生成成功')
  } finally {
    creating.value = false
  }
}

defineExpose({ open, openByBusiness })
</script>
