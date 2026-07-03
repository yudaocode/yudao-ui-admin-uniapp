<template>
  <view class="yd-page-container pb-120rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border title="基础信息">
        <wd-cell title="商品名称" :value="formData?.name || '-'" />
        <wd-cell title="商品编号" :value="formData?.code || '-'" />
        <wd-cell title="商品分类" :value="formData?.categoryName || '-'" />
        <wd-cell title="商品品牌" :value="formData?.brandName || '-'" />
        <wd-cell title="商品单位" :value="formData?.unit || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 规格列表 -->
      <view class="mx-24rpx mb-16rpx mt-24rpx text-30rpx text-[#333] font-semibold">
        规格信息
      </view>
      <view
        v-for="sku in formData?.skus || []"
        :key="sku.id || sku.code"
        class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="border-b border-b-[#f5f5f5] px-24rpx py-20rpx text-28rpx text-[#333] font-semibold">
          {{ sku.name || '-' }}
        </view>
        <wd-cell-group border>
          <wd-cell title="规格编号" :value="sku.code || '-'" />
          <wd-cell title="条码" :value="sku.barCode || '-'" />
          <wd-cell title="长宽高(cm)" :value="formatDimensionText(sku.length, sku.width, sku.height) || '-'" />
          <wd-cell title="净重(kg)" :value="formatWeight(sku.netWeight) || '-'" />
          <wd-cell title="毛重(kg)" :value="formatWeight(sku.grossWeight) || '-'" />
          <wd-cell title="成本价" :value="formatPrice(sku.costPrice) || '-'" />
          <wd-cell title="销售价" :value="formatPrice(sku.sellingPrice) || '-'" />
        </wd-cell-group>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['wms:item:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['wms:item:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Item } from '@/api/wms/md/item'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteItem, getItem } from '@/api/wms/md/item'
import { useAccess } from '@/hooks/useAccess'
import { formatDimensionText, formatPrice, formatWeight } from '@/pages-wms/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
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
const formData = ref<Item>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/item/index')
}

/** 加载商品详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getItem(Number(props.id))
}

/** 编辑商品 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-wms/md/item/form/index?id=${props.id}`,
  })
}

/** 删除商品 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该商品吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteItem(Number(props.id))
    toast.success('删除成功')
    uni.$emit('wms:item:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
