<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="秒杀活动详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="活动名称" :value="formData.name || '-'" />
            <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
            <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
            <wd-cell title="总限购" :value="formData.totalLimitCount != null ? String(formData.totalLimitCount) : '-'" />
            <wd-cell title="单次限购" :value="formData.singleLimitCount != null ? String(formData.singleLimitCount) : '-'" />
            <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
            <wd-cell title="备注" :value="formData.remark || '-'" />
            <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
          </wd-cell-group>
        </view>

        <!-- 秒杀商品 -->
        <view v-if="formData.products?.length" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
            秒杀商品
          </view>
          <view class="p-16rpx">
            <SpuSkuView :products="formData.products" :fields="productFields" />
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:seckill-activity:update', 'promotion:seckill-activity:delete', 'promotion:seckill-activity:close'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:seckill-activity:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:seckill-activity:close'])" class="flex-1" type="info" :loading="closing" @click="handleClose">
          关闭活动
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:seckill-activity:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionSeckillActivity } from '@/api/mall/promotion/seckill'
import type { SpuSkuViewField } from '@/pages-mall/promotion/components/spu-sku-view.vue'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  closePromotionSeckillActivity,
  deletePromotionSeckillActivity,
  getPromotionSeckillActivity,
} from '@/api/mall/promotion/seckill'
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
const formData = ref<PromotionSeckillActivity>({}) // 详情数据
const deleting = ref(false) // 删除状态
const closing = ref(false) // 关闭状态

const productFields: SpuSkuViewField[] = [
  { label: '秒杀价', prop: 'seckillPrice', type: 'money' },
  { label: '库存', prop: 'stock' },
] // 秒杀商品每个 SKU 展示的活动字段

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/seckill/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionSeckillActivity(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/seckill/activity/form/index?id=${props.id}` })
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
    await closePromotionSeckillActivity(props.id)
    toast.success('关闭成功')
    uni.$emit('mall:promotion-seckill-activity:reload')
    await getDetail()
  } finally {
    closing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该秒杀活动吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionSeckillActivity(props.id)
    toast.success('删除成功')
    uni.$emit('mall:promotion-seckill-activity:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-seckill-activity:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-seckill-activity:reload', getDetail)
})
</script>
