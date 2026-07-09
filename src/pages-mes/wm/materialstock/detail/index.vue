<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 库存台账详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="产品物料编码" :value="formData?.itemCode || '-'" />
        <wd-cell title="产品物料名称" :value="formData?.itemName || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="在库数量" :value="quantityText" />
        <wd-cell title="批次号" :value="formData?.batchCode || '-'" />
        <wd-cell title="仓库" :value="formData?.warehouseName || '-'" />
        <wd-cell title="库区" :value="formData?.locationName || '-'" />
        <wd-cell title="库位" :value="formData?.areaName || '-'" />
        <wd-cell title="供应商" :value="formData?.vendorName || '-'" />
        <wd-cell title="入库日期" :value="formatDate(formData?.receiptTime) || '-'" />
        <wd-cell title="冻结状态">
          <view
            class="inline-flex rounded-999rpx px-16rpx py-6rpx text-24rpx"
            :class="formData?.frozen ? 'bg-[#fff1f0] text-[#f5222d]' : 'bg-[#f6ffed] text-[#52c41a]'"
          >
            {{ formData?.frozen ? '已冻结' : '可用' }}
          </view>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canOperate" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="formData?.batchId"
          class="flex-1"
          type="primary"
          variant="plain"
          @click="handleBatchDetail"
        >
          查看批次
        </wd-button>
        <wd-button
          v-if="formData?.areaId"
          class="flex-1"
          type="primary"
          variant="plain"
          @click="handleAreaDetail"
        >
          查看库位
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:wm-material-stock:update'])"
          class="flex-1"
          :type="formData?.frozen ? 'success' : 'warning'"
          :loading="frozenLoading"
          @click="handleFrozenChange"
        >
          {{ formData?.frozen ? '解除冻结' : '冻结库存' }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import type { WmMaterialStock } from '@/api/mes/wm/materialstock'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getMaterialStock, updateMaterialStockFrozen } from '@/api/mes/wm/materialstock'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<WmMaterialStock>() // 详情数据
const frozenLoading = ref(false) // 冻结操作状态
const quantityText = computed(() => {
  if (!formData.value) {
    return '-'
  }
  return `${formData.value.quantity ?? '-'} ${formData.value.unitMeasureName || ''}`.trim()
})
const canOperate = computed(() => {
  return Boolean(formData.value?.batchId || formData.value?.areaId)
    || hasAccessByCodes(['mes:wm-material-stock:update'])
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
  try {
    toast.loading('加载中...')
    formData.value = await getMaterialStock(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 查看批次详情 */
function handleBatchDetail() {
  if (!formData.value?.batchId) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/batch/detail/index?id=${formData.value.batchId}`,
  })
}

/** 查看库位详情 */
function handleAreaDetail() {
  if (!formData.value?.areaId) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/warehouse/area/detail/index?id=${formData.value.areaId}`,
  })
}

/** 冻结状态切换 */
async function handleFrozenChange() {
  if (!formData.value || frozenLoading.value) {
    return
  }
  const targetFrozen = !formData.value.frozen
  const actionText = targetFrozen ? '冻结' : '解冻'
  try {
    await dialog.confirm({
      title: `${actionText}确认`,
      msg: `确定要${actionText}该库存记录吗？`,
    })
  } catch {
    return
  }
  frozenLoading.value = true
  try {
    await updateMaterialStockFrozen({ id: formData.value.id, frozen: targetFrozen })
    toast.success(`${actionText}成功`)
    formData.value.frozen = targetFrozen
    uni.$emit('mes:wm:materialstock:reload')
    await getDetail()
  } finally {
    frozenLoading.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
