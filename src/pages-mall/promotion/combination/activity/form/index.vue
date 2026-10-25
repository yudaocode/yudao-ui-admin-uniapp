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
              <wd-form-item title="成团人数" title-width="200rpx" prop="userSize" center>
                <wd-input-number v-model="formData.userSize" :min="2" />
              </wd-form-item>
              <wd-form-item title="限制时长(时)" title-width="200rpx" prop="limitDuration" center>
                <wd-input-number v-model="formData.limitDuration" :min="0" />
              </wd-form-item>
              <wd-form-item title="总限购" title-width="200rpx" prop="totalLimitCount" center>
                <wd-input-number v-model="formData.totalLimitCount" :min="0" />
              </wd-form-item>
              <wd-form-item title="单次限购" title-width="200rpx" prop="singleLimitCount" center>
                <wd-input-number v-model="formData.singleLimitCount" :min="0" />
              </wd-form-item>
              <wd-form-item title="虚拟成团" title-width="200rpx" prop="virtualGroup" center>
                <wd-radio-group v-model="formData.virtualGroup" type="button">
                  <wd-radio :value="true">
                    是
                  </wd-radio>
                  <wd-radio :value="false">
                    否
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 拼团商品 -->
          <view class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="border-b border-[#f0f0f0] px-24rpx py-18rpx text-30rpx text-[#333] font-semibold">
              拼团商品
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
                    <text class="w-160rpx shrink-0 text-26rpx text-[#666]">拼团价(元)</text>
                    <wd-input-number v-model="row.combinationPrice" :min="0" :step="0.01" :precision="2" />
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
import type { PromotionCombinationActivity } from '@/api/mall/promotion/combination'
import type { SpuSkuRow } from '@/pages-mall/promotion/components/spu-sku-editor.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionCombinationActivity,
  getPromotionCombinationActivity,
  updatePromotionCombinationActivity,
} from '@/api/mall/promotion/combination'
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
const getTitle = computed(() => props.id ? '编辑拼团活动' : '新增拼团活动')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const editorRef = ref<InstanceType<typeof SpuSkuEditor>>() // 商品编辑器引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const spuId = ref<number>() // 选中的 SPU 编号
const products = ref<SpuSkuRow[]>([]) // 每个 SKU 的拼团配置（金额为元）
const formData = ref<PromotionCombinationActivity>({
  id: undefined,
  name: '',
  startTime: undefined,
  endTime: undefined,
  userSize: 2,
  limitDuration: 24,
  totalLimitCount: 0,
  singleLimitCount: 0,
  virtualGroup: false,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '活动名称不能为空' }],
  startTime: [{ required: true, message: '开始时间不能为空' }],
  endTime: [{ required: true, message: '结束时间不能为空' }],
  userSize: [{ required: true, message: '成团人数不能为空' }],
  limitDuration: [{ required: true, message: '限制时长不能为空' }],
  totalLimitCount: [{ required: true, message: '总限购数量不能为空' }],
  singleLimitCount: [{ required: true, message: '单次限购数量不能为空' }],
  virtualGroup: [{ required: true, message: '虚拟成团不能为空' }],
})

/** 创建单个 SKU 的拼团配置默认值 */
function createConfig(_sku: ProductSku) {
  return { combinationPrice: 0 }
}

/** 编辑回显：后端 product（分）→ 配置（元） */
function mergeConfig(_config: Record<string, any>, product: Record<string, any>) {
  return { combinationPrice: fenToYuan(product.combinationPrice) }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/combination/activity/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getPromotionCombinationActivity(props.id)
  formData.value = {
    ...data,
    virtualGroup: !!data.virtualGroup,
  }
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
    combinationPrice: yuanToFen(row.combinationPrice),
  }))
  formLoading.value = true
  try {
    const data: PromotionCombinationActivity = {
      ...formData.value,
      spuId: spuId.value,
      products: submitProducts,
    }
    if (props.id) {
      await updatePromotionCombinationActivity(data)
      toast.success('修改成功')
    } else {
      await createPromotionCombinationActivity(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-combination-activity:reload')
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
