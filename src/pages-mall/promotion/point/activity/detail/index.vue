<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="积分商城详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
            <wd-cell title="备注" :value="formData.remark || '-'" />
            <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
          </wd-cell-group>
        </view>

        <!-- 积分商品 -->
        <view v-if="formData.products?.length" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
            兑换商品
          </view>
          <view class="p-16rpx">
            <SpuSkuView :products="formData.products" :fields="productFields" />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:point-activity:update', 'promotion:point-activity:delete', 'promotion:point-activity:close'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:point-activity:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:point-activity:close'])" class="flex-1" type="info" :loading="closing" @click="handleClose">
          关闭活动
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:point-activity:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionPointActivity } from '@/api/mall/promotion/point'
import type { SpuSkuViewField } from '@/pages-mall/promotion/components/spu-sku-view.vue'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  closePromotionPointActivity,
  deletePromotionPointActivity,
  getPromotionPointActivity,
} from '@/api/mall/promotion/point'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SpuSkuView from '@/pages-mall/promotion/components/spu-sku-view.vue'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PromotionPointActivity>({}) // 详情数据
const deleting = ref(false) // 删除状态
const closing = ref(false) // 关闭状态

const productFields: SpuSkuViewField[] = [
  { label: '积分', prop: 'point' },
  { label: '金额', prop: 'price', type: 'money' },
  { label: '库存', prop: 'stock' },
  { label: '兑换上限', prop: 'count' },
] // 兑换商品每个 SKU 展示的活动字段

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/point/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionPointActivity(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/point/activity/form/index?id=${props.id}` })
}

/** 关闭活动 */
async function handleClose() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要关闭该活动吗？' })
  } catch {
    return
  }
  closing.value = true
  try {
    await closePromotionPointActivity(props.id)
    toast.success('关闭成功')
    uni.$emit('mall:promotion-point-activity:reload')
    await getDetail()
  } finally {
    closing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该积分商城活动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionPointActivity(props.id)
    toast.success('删除成功')
    uni.$emit('mall:promotion-point-activity:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-point-activity:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-point-activity:reload', getDetail)
})
</script>
