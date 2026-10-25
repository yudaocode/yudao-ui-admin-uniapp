<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <view class="p-24rpx">
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              活动信息
            </view>
            <wd-cell-group border>
              <wd-form-item title="活动名称" title-width="200rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入活动名称" />
              </wd-form-item>
              <wd-form-item title="开始时间" title-width="200rpx" prop="startTime" is-link placeholder="请选择开始时间" :value="formatDateTime(formData.startTime)" @click="pickerVisible.startTime = true" />
              <wd-datetime-picker v-model="formData.startTime" v-model:visible="pickerVisible.startTime" title="请选择开始时间" type="datetime" />
              <wd-form-item title="结束时间" title-width="200rpx" prop="endTime" is-link placeholder="请选择结束时间" :value="formatDateTime(formData.endTime)" @click="pickerVisible.endTime = true" />
              <wd-datetime-picker v-model="formData.endTime" v-model:visible="pickerVisible.endTime" title="请选择结束时间" type="datetime" />
              <wd-form-item title="备注" title-width="200rpx">
                <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              优惠商品
            </view>
            <view class="p-24rpx">
              <SpuSkuEditor
                ref="editorRef"
                v-model="products"
                v-model:spu-id="spuId"
                :create-config="createConfig"
                :merge-config="mergeConfig"
              >
                <template #sku="{ row }">
                  <view class="flex items-center gap-12rpx py-8rpx">
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">优惠金额(元)</text>
                    <wd-input-number v-model="row.discountPrice" :min="0" :step="0.01" :precision="2" />
                  </view>
                  <view class="flex items-center gap-12rpx py-8rpx">
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">折扣百分比(%)</text>
                    <wd-input-number v-model="row.discountPercent" :min="0" :max="99.99" :step="0.01" :precision="2" />
                  </view>
                </template>
              </SpuSkuEditor>
            </view>
          </view>
        </view>
      </wd-form>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProductSku } from '@/api/mall/product/spu'
import type { PromotionDiscountActivity } from '@/api/mall/promotion/discount'
import type { SpuSkuRow } from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionDiscountActivity,
  getPromotionDiscountActivity,
  updatePromotionDiscountActivity,
} from '@/api/mall/promotion/discount'
import SpuSkuEditor from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { PromotionDiscountTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑限时折扣' : '新增限时折扣')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const editorRef = ref<InstanceType<typeof SpuSkuEditor>>() // 商品编辑器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const spuId = ref<number>() // 选中的 SPU 编号
const products = ref<SpuSkuRow[]>([]) // 每个 SKU 的优惠配置（金额为元）
const formData = ref<PromotionDiscountActivity>({
  id: undefined,
  name: '',
  startTime: undefined,
  endTime: undefined,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '活动名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
})

/** 创建单个 SKU 的优惠配置默认值 */
function createConfig(_sku: ProductSku) {
  return { discountType: PromotionDiscountTypeEnum.PRICE, discountPrice: 0, discountPercent: 0 }
}

/** 编辑回显：后端 product（分）→ 配置（元） */
function mergeConfig(_config: Record<string, any>, product: Record<string, any>) {
  return {
    discountType: product.discountType ?? PromotionDiscountTypeEnum.PRICE,
    discountPrice: fenToYuan(product.discountPrice),
    discountPercent: fenToYuan(product.discountPercent),
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/discount-activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionDiscountActivity(props.id)
  formData.value = {
    ...data,
  }
  // 回显商品与每个 SKU 的优惠配置
  if (data.products?.length) {
    spuId.value = data.products[0].spuId
    await editorRef.value?.setFromDetail(data.products[0].spuId!, data.products)
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) {
    return
  }
  if (!spuId.value || !products.value.length) {
    toast.warning('请选择活动商品')
    return
  }
  // 折扣百分比须 < 100
  if (products.value.some(row => Number(row.discountPercent) >= 100)) {
    toast.warning('折扣百分比需小于 100%')
    return
  }
  // 根据当前编辑的优惠类型，自动判定每个 SKU 的 discountType；金额元转分
  const submitProducts = products.value.map((row) => {
    const discountPercent = yuanToFen(Number(row.discountPercent) || 0)
    const discountType = discountPercent > 0 ? PromotionDiscountTypeEnum.PERCENT : PromotionDiscountTypeEnum.PRICE
    return {
      spuId: spuId.value,
      skuId: row.skuId,
      discountType,
      discountPrice: yuanToFen(row.discountPrice),
      discountPercent,
    }
  })
  formLoading.value = true
  try {
    const data: PromotionDiscountActivity = {
      ...formData.value,
      spuId: spuId.value,
      products: submitProducts,
    }
    if (props.id) {
      await updatePromotionDiscountActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionDiscountActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-discount-activity:reload')
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
