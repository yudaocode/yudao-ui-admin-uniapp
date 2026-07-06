<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="批次追溯详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

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
          <wd-cell title="生产日期" :value="formatDateTime(formData?.produceDate) || '-'" />
          <wd-cell title="有效期" :value="formatDateTime(formData?.expireDate) || '-'" />
          <wd-cell title="入库日期" :value="formatDateTime(formData?.receiptDate) || '-'" />
          <wd-cell title="备注" :value="formData?.remark || '-'" />
        </wd-cell-group>

        <wd-cell-group title="产品物料" border class="mt-24rpx">
          <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
          <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
          <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
          <wd-cell title="单位" :value="formData?.unitName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="供应与销售" border class="mt-24rpx">
          <wd-cell title="供应商" :value="`${formData?.vendorCode || '-'} / ${formData?.vendorName || '-'}`" />
          <wd-cell title="客户" :value="`${formData?.clientCode || '-'} / ${formData?.clientName || '-'}`" />
          <wd-cell title="采购订单编号" :value="formData?.purchaseOrderCode || '-'" />
          <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
        </wd-cell-group>

        <wd-cell-group title="生产关联" border class="mt-24rpx">
          <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
          <wd-cell title="生产任务" :value="formData?.taskCode || '-'" />
          <wd-cell title="工作站" :value="formData?.workstationCode || '-'" />
          <wd-cell title="工具" :value="formData?.toolCode || '-'" />
        </wd-cell-group>

        <view class="mt-24rpx overflow-hidden rounded-12rpx bg-white">
          <wd-tabs v-model="activeTab">
            <wd-tab title="向前追溯" name="forward">
              <view class="p-24rpx">
                <BatchTraceList :batch-code="formData?.code" direction="forward" />
              </view>
            </wd-tab>
            <wd-tab title="向后追溯" name="backward">
              <view class="p-24rpx">
                <BatchTraceList :batch-code="formData?.code" direction="backward" />
              </view>
            </wd-tab>
          </wd-tabs>
        </view>
      </view>
      <view class="h-48rpx" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Batch } from '@/api/mes/wm/batch'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getBatch } from '@/api/mes/wm/batch'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import BatchTraceList from '../components/batch-trace-list.vue'

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
const activeTab = ref('forward') // 当前追溯方向

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/batchtrace/index')
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
onMounted(() => {
  getDetail()
})
</script>
