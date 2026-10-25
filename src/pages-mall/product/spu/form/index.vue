<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 分组 tab：基础设置/价格库存/物流设置/商品详情/其它设置 -->
    <view class="bg-white">
      <wd-tabs v-model="activeTab" slidable="always">
        <wd-tab v-for="(tab, index) in SPU_FORM_TABS" :key="index" :title="tab" />
      </wd-tabs>
    </view>

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <view class="p-24rpx">
          <!-- 基础设置 -->
          <view v-show="activeTab === 0" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="商品名称" title-width="200rpx" prop="name">
                <wd-input v-model="formData.name" clearable placeholder="请输入商品名称" />
              </wd-form-item>
              <CategorySelect v-model="formData.categoryId" label="商品分类" label-width="200rpx" prop="categoryId" />
              <BrandSelect v-model="formData.brandId" label="商品品牌" label-width="200rpx" prop="brandId" />
              <wd-form-item title="关键字" title-width="200rpx" prop="keyword">
                <wd-input v-model="formData.keyword" clearable placeholder="请输入关键字" />
              </wd-form-item>
              <wd-form-item title="商品简介" title-width="200rpx" prop="introduction">
                <wd-textarea v-model="formData.introduction" clearable :maxlength="500" placeholder="请输入商品简介" />
              </wd-form-item>
              <wd-form-item title="商品封面" title-width="200rpx" prop="picUrl">
                <yd-upload-img v-model="formData.picUrl" />
              </wd-form-item>
              <wd-form-item title="轮播图" title-width="200rpx" prop="sliderPicUrls">
                <yd-upload-imgs v-model="formData.sliderPicUrls" :limit="9" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 价格库存 -->
          <view v-show="activeTab === 1" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="多规格" title-width="200rpx" prop="specType" center>
                <wd-radio-group v-model="formData.specType" type="button">
                  <wd-radio :value="false">
                    单规格
                  </wd-radio>
                  <wd-radio :value="true">
                    多规格
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item title="单独分佣" title-width="200rpx" prop="subCommissionType" center>
                <wd-radio-group v-model="formData.subCommissionType" type="button">
                  <wd-radio :value="false">
                    否
                  </wd-radio>
                  <wd-radio :value="true">
                    是
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </wd-cell-group>
            <view class="px-24rpx py-20rpx">
              <view class="mb-16rpx text-28rpx text-[#333] font-medium">
                SKU 规格与价格
              </view>
              <SkuEditor
                v-model="skus"
                :spec-type="formData.specType"
                :sub-commission-type="formData.subCommissionType"
              />
            </view>
          </view>

          <!-- 物流设置 -->
          <view v-show="activeTab === 2" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="配送方式" title-width="200rpx" prop="deliveryTypes" center>
                <wd-checkbox-group v-model="formData.deliveryTypes" type="button">
                  <wd-checkbox
                    v-for="dict in getIntDictOptions(DICT_TYPE.TRADE_DELIVERY_TYPE)"
                    :key="dict.value"
                    :name="dict.value"
                  >
                    {{ dict.label }}
                  </wd-checkbox>
                </wd-checkbox-group>
              </wd-form-item>
              <TemplateSelect
                v-if="formData.deliveryTypes?.includes(DeliveryTypeEnum.EXPRESS)"
                v-model="formData.deliveryTemplateId"
                label="运费模板"
                label-width="200rpx"
                prop="deliveryTemplateId"
              />
            </wd-cell-group>
          </view>

          <!-- 商品详情 -->
          <view v-show="activeTab === 3" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="详情内容" title-width="200rpx" prop="description">
                <wd-textarea v-model="formData.description" clearable :maxlength="10000" placeholder="请输入商品详情 HTML 或文本" />
              </wd-form-item>
            </wd-cell-group>
          </view>

          <!-- 其它设置 -->
          <view v-show="activeTab === 4" class="mb-160rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-cell-group border>
              <wd-form-item title="排序" title-width="200rpx" prop="sort">
                <wd-input-number v-model="formData.sort" :min="0" />
              </wd-form-item>
              <wd-form-item title="赠送积分" title-width="200rpx">
                <wd-input-number v-model="formData.giveIntegral" :min="0" />
              </wd-form-item>
              <wd-form-item title="虚拟销量" title-width="200rpx">
                <wd-input-number v-model="formData.virtualSalesCount" :min="0" />
              </wd-form-item>
            </wd-cell-group>
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
import { parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProductSku, ProductSpu } from '@/api/mall/product/spu'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductSpu, getProductSpu, updateProductSpu } from '@/api/mall/product/spu'
import { delay, navigateBackPlus } from '@/utils'
import { DeliveryTypeEnum, DICT_TYPE } from '@/utils/constants'
import BrandSelect from '@/pages-mall/product/brand/components/brand-select.vue'
import CategorySelect from '@/pages-mall/product/category/components/category-select.vue'
import SkuEditor from '@/pages-mall/product/spu/components/sku-editor.vue'
import TemplateSelect from '@/pages-mall/trade/delivery/express-template/components/template-select.vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { fenToYuan, yuanToFen } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formId = computed(() => props.id != null && props.id !== '' ? parseId(props.id) : undefined) // 商品编号（路由透传）
const activeTab = ref(0) // 当前分组 tab 下标
const SPU_FORM_TABS = ['基础设置', '价格库存', '物流设置', '商品详情', '其它设置'] // 分组 tab
const getTitle = computed(() => `${formId.value ? '编辑' : '新增'}商品`)
const formData = ref<ProductSpu>({
  name: '',
  categoryId: undefined,
  keyword: '',
  picUrl: '',
  sliderPicUrls: [],
  introduction: '',
  deliveryTypes: [DeliveryTypeEnum.EXPRESS],
  deliveryTemplateId: undefined,
  brandId: undefined,
  specType: false,
  subCommissionType: false,
  description: '',
  sort: 0,
  giveIntegral: 0,
  virtualSalesCount: 0,
})
const skus = ref<ProductSku[]>([]) // SKU 列表（金额单位元）
const formSchema = createFormSchema({
  name: [{ required: true, message: '商品名称不能为空' }],
  categoryId: [{ required: true, message: '商品分类不能为空' }],
  brandId: [{ required: true, message: '商品品牌不能为空' }],
  keyword: [{ required: true, message: '商品关键字不能为空' }],
  introduction: [{ required: true, message: '商品简介不能为空' }],
  picUrl: [{ required: true, message: '商品封面不能为空' }],
  sliderPicUrls: [{ required: true, message: '轮播图不能为空' }],
  deliveryTypes: [{ required: true, message: '配送方式不能为空' }],
  deliveryTemplateId: [{ required: (model: Record<string, any>) => !!model?.deliveryTypes?.includes(DeliveryTypeEnum.EXPRESS), message: '运费模板不能为空' }],
  specType: [{ required: true, message: '多规格不能为空' }],
  subCommissionType: [{ required: true, message: '单独分佣不能为空' }],
  description: [{ required: true, message: '商品详情不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
})
const PROP_TAB: Record<string, number> = {
  name: 0,
  categoryId: 0,
  brandId: 0,
  keyword: 0,
  introduction: 0,
  picUrl: 0,
  sliderPicUrls: 0,
  specType: 1,
  subCommissionType: 1,
  deliveryTypes: 2,
  deliveryTemplateId: 2,
  description: 3,
  sort: 4,
} // 字段 → 所属 tab 下标，校验失败时自动切到对应 tab

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/spu/index')
}

/** SKU 分→元 */
function toYuanSku(sku: ProductSku): ProductSku {
  return {
    ...sku,
    price: fenToYuan(sku.price),
    marketPrice: fenToYuan(sku.marketPrice),
    costPrice: fenToYuan(sku.costPrice),
    firstBrokeragePrice: fenToYuan(sku.firstBrokeragePrice),
    secondBrokeragePrice: fenToYuan(sku.secondBrokeragePrice),
  }
}

/** SKU 元→分 */
function toCentSku(sku: ProductSku): ProductSku {
  return {
    ...sku,
    name: sku.name || formData.value.name, // SKU 名称取商品名称
    picUrl: sku.picUrl || formData.value.picUrl || '', // SKU 图片默认取商品封面
    price: yuanToFen(sku.price),
    marketPrice: yuanToFen(sku.marketPrice),
    costPrice: yuanToFen(sku.costPrice),
    firstBrokeragePrice: yuanToFen(sku.firstBrokeragePrice),
    secondBrokeragePrice: yuanToFen(sku.secondBrokeragePrice),
  }
}

/** 默认单规格 SKU（元） */
function createDefaultSku(): ProductSku {
  return { price: 0, marketPrice: 0, costPrice: 0, stock: 0, barCode: '', weight: 0, volume: 0, picUrl: '', properties: [] }
}

/** 加载详情 */
async function loadDetail() {
  if (!formId.value) {
    skus.value = [createDefaultSku()]
    return
  }
  const data = await getProductSpu(formId.value)
  formData.value = {
    ...data,
    sliderPicUrls: data.sliderPicUrls || [],
    deliveryTypes: data.deliveryTypes || [],
  }
  skus.value = (data.skus || []).map(toYuanSku)
}

/** 构造提交数据 */
function buildSubmitData(): ProductSpu {
  const data = formData.value
  return {
    ...data,
    id: formId.value,
    sliderPicUrls: data.sliderPicUrls || [],
    deliveryTypes: data.deliveryTypes || [],
    skus: skus.value.map(toCentSku),
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (!result?.valid) {
    // 校验失败时切到首个错误字段所在的 tab
    const prop = result?.errors?.[0]?.prop
    if (prop != null && PROP_TAB[prop] != null) {
      activeTab.value = PROP_TAB[prop]
    }
    return
  }
  const data = buildSubmitData()
  if (!data.skus?.length) {
    activeTab.value = 1 // 价格库存
    toast.warning(formData.value.specType ? '请添加规格并生成 SKU' : '请完善 SKU 价格库存')
    return
  }
  // 逐 SKU 校验销售价/市场价大于 0，避免 0 价商品
  if (skus.value.some(sku => !(Number(sku.price) >= 0.01) || !(Number(sku.marketPrice) >= 0.01))) {
    activeTab.value = 1 // 价格库存
    toast.warning('请完善 SKU 的销售价与市场价（需大于 0）')
    return
  }
  formLoading.value = true
  try {
    if (formId.value) {
      await updateProductSpu(data)
      toast.success('修改成功')
    } else {
      await createProductSpu(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:product-spu:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadDetail()
})
</script>
