<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品库存详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <view class="mb-24rpx rounded-12rpx bg-white p-32rpx text-center shadow-sm">
          <view class="text-28rpx text-[#999]">
            当前库存
          </view>
          <view class="mt-8rpx text-48rpx text-[#9254de] font-semibold">
            {{ formatCount(formData?.count) }}
          </view>
        </view>
      </view>
      <wd-cell-group border>
        <wd-cell title="产品名称" :value="formData?.productName || '-'" />
        <wd-cell title="产品分类" :value="formData?.categoryName || '-'" />
        <wd-cell title="产品单位" :value="formData?.unitName || '-'" />
        <wd-cell title="仓库" :value="formData?.warehouseName || '-'" />
        <wd-cell title="库存数量" :value="formatCount(formData?.count)" />
        <wd-cell title="产品编号" :value="formData?.productId ?? '-'" />
        <wd-cell title="仓库编号" :value="formData?.warehouseId ?? '-'" />
      </wd-cell-group>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Stock } from '@/api/erp/stock/stock'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getStock } from '@/api/erp/stock/stock'
import { buildErpDocumentDetail } from '@/pages-erp/utils/erp'
import { formatCount } from '@/pages-erp/utils/format'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<Stock>() // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/stock/index')
}

/** 加载产品库存详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await buildErpDocumentDetail(await getStock(props.id), 'stock') as Stock
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
