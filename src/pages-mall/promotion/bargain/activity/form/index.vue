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
              <wd-form-item title="起始价(元)" title-width="200rpx" prop="bargainFirstPrice" center>
                <wd-input-number v-model="formData.bargainFirstPrice" :min="0" :step="0.01" :precision="2" />
              </wd-form-item>
              <wd-form-item title="底价(元)" title-width="200rpx" prop="bargainMinPrice" center>
                <wd-input-number v-model="formData.bargainMinPrice" :min="0" :step="0.01" :precision="2" />
              </wd-form-item>
              <wd-form-item title="随机最小(元)" title-width="200rpx" prop="randomMinPrice" center>
                <wd-input-number v-model="formData.randomMinPrice" :min="0" :step="0.01" :precision="2" />
              </wd-form-item>
              <wd-form-item title="随机最大(元)" title-width="200rpx" prop="randomMaxPrice" center>
                <wd-input-number v-model="formData.randomMaxPrice" :min="0" :step="0.01" :precision="2" />
              </wd-form-item>
              <wd-form-item title="库存" title-width="200rpx" prop="stock" center>
                <wd-input-number v-model="formData.stock" :min="0" />
              </wd-form-item>
              <wd-form-item title="总限购" title-width="200rpx" prop="totalLimitCount" center>
                <wd-input-number v-model="formData.totalLimitCount" :min="0" />
              </wd-form-item>
              <wd-form-item title="助力人数" title-width="200rpx" prop="helpMaxCount" center>
                <wd-input-number v-model="formData.helpMaxCount" :min="1" />
              </wd-form-item>
              <wd-form-item title="帮砍次数" title-width="200rpx" prop="bargainCount" center>
                <wd-input-number v-model="formData.bargainCount" :min="1" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 活动商品（单 SKU） -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              活动商品
            </view>
            <view class="p-24rpx">
              <SpuSkuEditor
                ref="editorRef"
                v-model="products"
                v-model:spu-id="spuId"
                single
                :create-config="createConfig"
              />
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
import type { PromotionBargainActivity } from '@/api/mall/promotion/bargain'
import type { SpuSkuRow } from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionBargainActivity,
  getPromotionBargainActivity,
  updatePromotionBargainActivity,
} from '@/api/mall/promotion/bargain'
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
const getTitle = computed(() => props.id ? '编辑砍价活动' : '新增砍价活动')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const editorRef = ref<InstanceType<typeof SpuSkuEditor>>() // 商品编辑器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const spuId = ref<number>() // 选中的 SPU 编号
const products = ref<SpuSkuRow[]>([]) // 选中的 SKU（单个）
const formData = ref<PromotionBargainActivity>({
  id: undefined,
  name: '',
  startTime: undefined,
  endTime: undefined,
  bargainFirstPrice: 0,
  bargainMinPrice: 0,
  randomMinPrice: 0,
  randomMaxPrice: 0,
  stock: 0,
  totalLimitCount: 1,
  helpMaxCount: 2,
  bargainCount: 2,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '活动名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
})

/** 选择 SKU 时仅取标识 */
function createConfig(_sku: ProductSku) {
  return {}
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/bargain/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionBargainActivity(props.id)
  formData.value = {
    ...data,
    bargainFirstPrice: fenToYuan(data.bargainFirstPrice),
    bargainMinPrice: fenToYuan(data.bargainMinPrice),
    randomMinPrice: fenToYuan(data.randomMinPrice),
    randomMaxPrice: fenToYuan(data.randomMaxPrice),
  }
  if (data.spuId) {
    spuId.value = data.spuId
    await editorRef.value?.setFromDetail(data.spuId, data.skuId ? [{ spuId: data.spuId, skuId: data.skuId }] : undefined)
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) {
    return
  }
  const skuId = products.value[0]?.skuId
  if (!spuId.value || !skuId) {
    toast.warning('请选择活动商品')
    return
  }
  formLoading.value = true
  try {
    const data: PromotionBargainActivity = {
      ...formData.value,
      spuId: spuId.value,
      skuId,
      bargainFirstPrice: yuanToFen(formData.value.bargainFirstPrice),
      bargainMinPrice: yuanToFen(formData.value.bargainMinPrice),
      randomMinPrice: yuanToFen(formData.value.randomMinPrice),
      randomMaxPrice: yuanToFen(formData.value.randomMaxPrice),
    }
    if (props.id) {
      await updatePromotionBargainActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionBargainActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-bargain-activity:reload')
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
