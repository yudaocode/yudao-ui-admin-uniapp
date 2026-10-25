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
              <wd-form-item title="排序" title-width="200rpx" prop="sort" center>
                <wd-input-number v-model="formData.sort" :min="0" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="200rpx">
                <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 积分商品 -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              积分商品
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
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">兑换积分</text>
                    <wd-input-number v-model="row.point" :min="0" />
                  </view>
                  <view class="flex items-center gap-12rpx py-8rpx">
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">兑换金额(元)</text>
                    <wd-input-number v-model="row.price" :min="0" :step="0.01" :precision="2" />
                  </view>
                  <view class="flex items-center gap-12rpx py-8rpx">
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">兑换库存</text>
                    <wd-input-number v-model="row.stock" :min="0" />
                  </view>
                  <view class="flex items-center gap-12rpx py-8rpx">
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">每人限兑</text>
                    <wd-input-number v-model="row.count" :min="0" />
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
import type { PromotionPointActivity } from '@/api/mall/promotion/point'
import type { SpuSkuRow } from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionPointActivity,
  getPromotionPointActivity,
  updatePromotionPointActivity,
} from '@/api/mall/promotion/point'
import SpuSkuEditor from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑积分商城' : '新增积分商城')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const editorRef = ref<InstanceType<typeof SpuSkuEditor>>() // 商品编辑器引用
const spuId = ref<number>() // 选中的 SPU 编号
const products = ref<SpuSkuRow[]>([]) // 每个 SKU 的兑换配置（金额为元）
const formData = ref<PromotionPointActivity>({
  id: undefined,
  sort: 0,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({})

/** 创建单个 SKU 的兑换配置默认值 */
function createConfig(_sku: ProductSku) {
  return { point: 0, price: 0, stock: 0, count: 0 }
}

/** 编辑回显：后端 product（分）→ 配置（元） */
function mergeConfig(_config: Record<string, any>, product: Record<string, any>) {
  return {
    point: product.point ?? 0,
    price: fenToYuan(product.price),
    stock: product.stock ?? 0,
    count: product.count ?? 0,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/point/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionPointActivity(props.id)
  formData.value = { ...data }
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
  const submitProducts = products.value.map(row => ({
    spuId: spuId.value,
    skuId: row.skuId,
    point: Number(row.point) || 0,
    price: yuanToFen(row.price),
    stock: Number(row.stock) || 0,
    count: Number(row.count) || 0,
  }))
  formLoading.value = true
  try {
    const data: PromotionPointActivity = {
      ...formData.value,
      spuId: spuId.value,
      products: submitProducts,
    }
    if (props.id) {
      await updatePromotionPointActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionPointActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-point-activity:reload')
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
