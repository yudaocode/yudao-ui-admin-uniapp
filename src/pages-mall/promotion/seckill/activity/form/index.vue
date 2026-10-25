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
              <wd-form-item title="总限购" title-width="200rpx" prop="totalLimitCount" center>
                <wd-input-number v-model="formData.totalLimitCount" :min="0" />
              </wd-form-item>
              <wd-form-item title="单次限购" title-width="200rpx" prop="singleLimitCount" center>
                <wd-input-number v-model="formData.singleLimitCount" :min="0" />
              </wd-form-item>
              <wd-form-item title="排序" title-width="200rpx" prop="sort" center>
                <wd-input-number v-model="formData.sort" :min="0" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="200rpx">
                <wd-textarea v-model="formData.remark" clearable :maxlength="500" placeholder="请输入备注" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 秒杀时段 -->
          <view class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              秒杀时段
            </view>
            <view class="p-24rpx">
              <wd-checkbox-group v-model="configIds" type="button">
                <wd-checkbox v-for="config in configList" :key="config.id" :name="config.id">
                  {{ config.name }}
                </wd-checkbox>
              </wd-checkbox-group>
            </view>
          </view>

          <!-- 秒杀商品 -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              秒杀商品
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
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">秒杀价(元)</text>
                    <wd-input-number v-model="row.seckillPrice" :min="0" :step="0.01" :precision="2" />
                  </view>
                  <view class="flex items-center gap-12rpx py-8rpx">
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">秒杀库存</text>
                    <wd-input-number v-model="row.stock" :min="0" />
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
import { isIdType, parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProductSku } from '@/api/mall/product/spu'
import type { PromotionSeckillActivity, PromotionSeckillConfig } from '@/api/mall/promotion/seckill'
import type { SpuSkuRow } from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionSeckillActivity,
  getPromotionSeckillActivity,
  getSimplePromotionSeckillConfigList,
  updatePromotionSeckillActivity,
} from '@/api/mall/promotion/seckill'
import SpuSkuEditor from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
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
const getTitle = computed(() => props.id ? '编辑秒杀活动' : '新增秒杀活动')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const editorRef = ref<InstanceType<typeof SpuSkuEditor>>() // 商品编辑器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const spuId = ref<number>() // 选中的 SPU 编号
const products = ref<SpuSkuRow[]>([]) // 每个 SKU 的秒杀配置（金额为元）
const configList = ref<PromotionSeckillConfig[]>([]) // 秒杀时段列表
const configIds = ref<number[]>([]) // 选中的秒杀时段编号
const formData = ref<PromotionSeckillActivity>({
  id: undefined,
  name: '',
  startTime: undefined,
  endTime: undefined,
  totalLimitCount: 0,
  singleLimitCount: 0,
  sort: 0,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '活动名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
})

/** 创建单个 SKU 的秒杀配置默认值 */
function createConfig(_sku: ProductSku) {
  return { seckillPrice: 0, stock: 0 }
}

/** 编辑回显：后端 product（分）→ 配置（元） */
function mergeConfig(_config: Record<string, any>, product: Record<string, any>) {
  return {
    seckillPrice: fenToYuan(product.seckillPrice),
    stock: product.stock ?? 0,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/seckill/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionSeckillActivity(props.id)
  formData.value = {
    ...data,
  }
  configIds.value = String(data.configIds || '').split(',').map(parseId).filter(isIdType).filter(Boolean)
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
  if (!configIds.value.length) {
    toast.warning('请选择秒杀时段')
    return
  }
  const submitProducts = products.value.map(row => ({
    spuId: spuId.value,
    skuId: row.skuId,
    seckillPrice: yuanToFen(row.seckillPrice),
    stock: Number(row.stock) || 0,
  }))
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      spuId: spuId.value,
      configIds: configIds.value,
      products: submitProducts,
    } as any
    if (props.id) {
      await updatePromotionSeckillActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionSeckillActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-seckill-activity:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  configList.value = await getSimplePromotionSeckillConfigList()
  await getDetail()
})
</script>
