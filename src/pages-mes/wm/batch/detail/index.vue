<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="MES 批次详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group title="批次信息" border>
          <wd-cell title="批次编号" :value="formData?.code || '-'" />
          <wd-cell title="生产批号" :value="formData?.lotNumber || '-'" />
          <wd-cell title="质量状态">
            <dict-tag v-if="formData?.qualityStatus != null" :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="formData.qualityStatus" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="生产日期" :value="formatDate(formData?.produceDate) || '-'" />
          <wd-cell title="有效期" :value="formatDate(formData?.expireDate) || '-'" />
          <wd-cell title="入库日期" :value="formatDate(formData?.receiptDate) || '-'" />
          <wd-cell title="备注" :value="formData?.remark || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        </wd-cell-group>

        <wd-cell-group title="物料信息" border class="mt-24rpx">
          <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
          <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
          <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
          <wd-cell title="单位" :value="formData?.unitName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="供应与销售" border class="mt-24rpx">
          <wd-cell title="供应商编码" :value="formData?.vendorCode || '-'" />
          <wd-cell title="供应商名称" :value="formData?.vendorName || '-'" />
          <wd-cell title="客户编码" :value="formData?.clientCode || '-'" />
          <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
          <wd-cell title="采购订单编号" :value="formData?.purchaseOrderCode || '-'" />
          <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
        </wd-cell-group>

        <wd-cell-group title="生产关联" border class="mt-24rpx">
          <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
          <wd-cell title="生产任务" :value="formData?.taskCode || '-'" />
          <wd-cell title="工作站" :value="formData?.workstationCode || '-'" />
          <wd-cell title="工具" :value="formData?.toolCode || '-'" />
          <wd-cell title="模具" :value="formData?.moldId ? `模具 #${formData.moldId}` : '-'" />
        </wd-cell-group>
      </view>
      <view class="h-48rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import type { Batch } from '@/api/mes/wm/batch'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { getBatch } from '@/api/mes/wm/batch'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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

const toast = useToast()
const formData = ref<Batch>() // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/batch/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getBatch(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
