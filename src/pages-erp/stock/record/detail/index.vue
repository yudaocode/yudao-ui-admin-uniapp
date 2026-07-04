<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="库存明细详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="产品名称" :value="formData?.productName || '-'" />
        <wd-cell title="产品分类" :value="formData?.categoryName || '-'" />
        <wd-cell title="产品单位" :value="formData?.unitName || '-'" />
        <wd-cell title="仓库" :value="formData?.warehouseName || '-'" />
        <wd-cell title="业务类型">
          <dict-tag :type="DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE" :value="formData?.bizType" />
        </wd-cell>
        <wd-cell title="业务单号" :value="formData?.bizNo || '-'" />
        <wd-cell title="出入库日期" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="出入库数量" :value="formatCount(formData?.count)" />
        <wd-cell title="库存量" :value="formatCount(formData?.totalCount)" />
        <wd-cell title="操作人" :value="formData?.creatorName || '-'" />
        <wd-cell title="业务编号" :value="formData?.bizId ?? '-'" />
        <wd-cell title="业务项编号" :value="formData?.bizItemId ?? '-'" />
      </wd-cell-group>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { StockRecord } from '@/api/erp/stock/record'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getStockRecord } from '@/api/erp/stock/record'
import { buildErpDocumentDetail } from '@/pages-erp/utils/erp'
import { formatCount } from '@/pages-erp/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<StockRecord>() // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/record/index')
}

/** 加载库存明细详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await buildErpDocumentDetail(await getStockRecord(props.id), 'stock-record') as StockRecord
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
