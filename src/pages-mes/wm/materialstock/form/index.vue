<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="库存冻结状态"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 库存信息 -->
    <view class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="产品物料编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="产品物料名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="在库数量" :value="quantityText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="库存位置" :value="stockPlaceText" />
        <wd-cell title="入库日期" :value="formatDate(formData?.receiptTime) || '-'" />
        <wd-cell title="当前状态" :value="formData?.frozen ? '已冻结' : '可用'" />
      </wd-cell-group>

      <view class="mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          冻结设置
        </view>
        <view class="mb-20rpx text-26rpx text-[#999]">
          冻结后该库存记录不可参与出库事务；解冻后恢复可用。
        </view>
        <wd-cell title="是否冻结" center>
          <wd-switch v-model="frozen" />
        </wd-cell>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存冻结状态
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getMaterialStock, updateMaterialStockFrozen } from '@/api/mes/wm/materialstock'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const formData = ref<WmMaterialStock>() // 库存详情
const frozen = ref(false) // 冻结状态
const quantityText = computed(() => {
  if (!formData.value) {
    return '-'
  }
  return `${formData.value.quantity ?? '-'} ${formData.value.unitMeasureName || ''}`.trim()
})
const stockPlaceText = computed(() => {
  if (!formData.value) {
    return '-'
  }
  return [
    formData.value.warehouseName,
    formData.value.locationName,
    formData.value.areaName,
  ].filter(Boolean).join(' / ') || '-'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/materialstock/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMaterialStock(Number(props.id))
  frozen.value = formData.value.frozen
}

/** 提交冻结状态 */
async function handleSubmit() {
  if (!formData.value) {
    return
  }
  if (formData.value.frozen === frozen.value) {
    toast.warning('冻结状态未变化')
    return
  }
  const actionText = frozen.value ? '冻结' : '解冻'
  try {
    await dialog.confirm({
      title: `${actionText}确认`,
      msg: `确定要${actionText}该库存记录吗？`,
    })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await updateMaterialStockFrozen({ id: formData.value.id, frozen: frozen.value })
    toast.success(`${actionText}成功`)
    uni.$emit('mes:wm:materialstock:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
