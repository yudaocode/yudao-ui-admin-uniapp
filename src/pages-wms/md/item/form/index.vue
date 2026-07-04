<template>
  <view class="yd-page-container pb-120rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="基础信息">
          <wd-form-item title="商品名称" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" :maxlength="60" clearable placeholder="请输入商品名称" />
          </wd-form-item>
          <ItemCategoryPicker v-model="formData.categoryId" prop="categoryId" />
          <wd-form-item title="商品编号" title-width="180rpx" prop="code">
            <view class="flex items-center gap-12rpx">
              <wd-input v-model="formData.code" class="flex-1" :maxlength="20" clearable placeholder="请输入商品编号" />
              <wd-button size="small" @click="formData.code = generateWmsCode('I')">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="商品单位" title-width="180rpx" prop="unit">
            <wd-input v-model="formData.unit" :maxlength="20" clearable placeholder="请输入单位" />
          </wd-form-item>
          <ItemBrandPicker v-model="formData.brandId" />
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="255" clearable />
          </wd-form-item>
        </wd-cell-group>

        <view class="mx-24rpx mb-16rpx mt-24rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">规格信息</text>
          <wd-button size="small" type="primary" @click="handleAddSku">
            新增规格
          </wd-button>
        </view>
        <view
          v-for="(sku, index) in formData.skus"
          :key="index"
          class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="flex items-center justify-between border-b border-b-[#f5f5f5] px-24rpx py-20rpx">
            <text class="text-28rpx text-[#333] font-semibold">规格 {{ index + 1 }}</text>
            <wd-button size="small" type="danger" @click="handleDeleteSku(index)">
              删除
            </wd-button>
          </view>
          <wd-cell-group border>
            <wd-form-item title="规格名称" title-width="180rpx">
              <wd-input v-model="sku.name" :maxlength="255" clearable placeholder="请输入规格名称" />
            </wd-form-item>
            <wd-form-item title="规格编号" title-width="180rpx">
              <view class="flex items-center gap-12rpx">
                <wd-input v-model="sku.code" class="flex-1" :maxlength="64" clearable placeholder="请输入规格编号" />
                <wd-button size="small" @click="sku.code = generateWmsCode('S')">
                  生成
                </wd-button>
              </view>
            </wd-form-item>
            <wd-form-item title="条码" title-width="180rpx">
              <view class="flex items-center gap-12rpx">
                <wd-input v-model="sku.barCode" class="flex-1" :maxlength="64" clearable placeholder="请输入条码" />
                <wd-button size="small" @click="sku.barCode = generateWmsCode()">
                  生成
                </wd-button>
              </view>
            </wd-form-item>
            <wd-form-item title="长/宽/高" title-width="180rpx">
              <view class="grid grid-cols-3 gap-12rpx">
                <wd-input-number v-model="sku.length" :min="0" :precision="DIMENSION_PRECISION" allow-null placeholder="长" />
                <wd-input-number v-model="sku.width" :min="0" :precision="DIMENSION_PRECISION" allow-null placeholder="宽" />
                <wd-input-number v-model="sku.height" :min="0" :precision="DIMENSION_PRECISION" allow-null placeholder="高" />
              </view>
            </wd-form-item>
            <wd-form-item title="净重/毛重" title-width="180rpx">
              <view class="grid grid-cols-2 gap-12rpx">
                <wd-input-number v-model="sku.netWeight" :min="0" :precision="WEIGHT_PRECISION" allow-null placeholder="净重" />
                <wd-input-number v-model="sku.grossWeight" :min="0" :precision="WEIGHT_PRECISION" allow-null placeholder="毛重" />
              </view>
            </wd-form-item>
            <wd-form-item title="成本/销售价" title-width="180rpx">
              <view class="grid grid-cols-2 gap-12rpx">
                <wd-input-number v-model="sku.costPrice" :min="0" :precision="PRICE_PRECISION" allow-null placeholder="成本价" />
                <wd-input-number v-model="sku.sellingPrice" :min="0" :precision="PRICE_PRECISION" allow-null placeholder="销售价" />
              </view>
            </wd-form-item>
          </wd-cell-group>
        </view>
      </wd-form>
    </view>

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
import type { Item } from '@/api/wms/md/item'
import type { ItemSku } from '@/api/wms/md/item/sku'
import type { InputNumberValue } from '@/pages-wms/utils/format'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createItem, getItem, updateItem } from '@/api/wms/md/item'
import ItemBrandPicker from '@/pages-wms/md/item/brand/components/item-brand-picker.vue'
import ItemCategoryPicker from '@/pages-wms/md/item/category/components/item-category-picker.vue'
import { generateWmsCode } from '@/pages-wms/utils/order'
import { DIMENSION_PRECISION, PRICE_PRECISION, toOptionalNumber, WEIGHT_PRECISION } from '@/pages-wms/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

type SkuNumberKey = 'length' | 'width' | 'height' | 'grossWeight' | 'netWeight' | 'costPrice' | 'sellingPrice'
type ItemSkuForm = Omit<ItemSku, SkuNumberKey> & Record<SkuNumberKey, InputNumberValue>
type ItemFormData = Omit<Item, 'skus'> & { skus?: ItemSkuForm[] }

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑商品' : '新增商品')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ItemFormData>({
  id: undefined,
  code: '',
  name: '',
  categoryId: undefined,
  unit: '',
  brandId: undefined,
  remark: '',
  skus: [buildEmptySku()],
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '商品编号不能为空' }],
  name: [{ required: true, message: '商品名称不能为空' }],
  categoryId: [{ required: true, message: '商品分类不能为空' }],
  skus: [{ required: true, message: '至少包含一个商品规格' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 构建空规格 */
function buildEmptySku(): ItemSkuForm {
  return {
    id: undefined,
    name: '',
    barCode: '',
    code: '',
    length: '',
    width: '',
    height: '',
    grossWeight: '',
    netWeight: '',
    costPrice: '',
    sellingPrice: '',
  }
}

/** 转换规格表单数据 */
function normalizeSkuForm(sku: ItemSku): ItemSkuForm {
  return {
    ...sku,
    length: sku.length ?? '',
    width: sku.width ?? '',
    height: sku.height ?? '',
    grossWeight: sku.grossWeight ?? '',
    netWeight: sku.netWeight ?? '',
    costPrice: sku.costPrice ?? '',
    sellingPrice: sku.sellingPrice ?? '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/md/item/index')
}

/** 加载商品详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const item = await getItem(Number(props.id))
  formData.value = {
    ...item,
    skus: item.skus?.length ? item.skus.map(normalizeSkuForm) : [buildEmptySku()],
  }
}

/** 添加规格 */
function handleAddSku() {
  formData.value.skus?.push(buildEmptySku())
}

/** 删除规格 */
function handleDeleteSku(index: number) {
  if (!formData.value.skus || formData.value.skus.length <= 1) {
    toast.error('至少包含一个商品规格')
    return
  }
  formData.value.skus.splice(index, 1)
}

/** 校验规格 */
function validateSkus() {
  if (!formData.value.skus?.length) {
    toast.error('至少包含一个商品规格')
    return false
  }
  for (let i = 0; i < formData.value.skus.length; i++) {
    if (!formData.value.skus[i].name) {
      toast.error(`第 ${i + 1} 个规格名称不能为空`)
      return false
    }
  }
  return true
}

/** 构建提交数据 */
function buildSubmitData(): Item {
  return {
    ...formData.value,
    skus: (formData.value.skus || []).map(sku => ({
      ...sku,
      length: toOptionalNumber(sku.length),
      width: toOptionalNumber(sku.width),
      height: toOptionalNumber(sku.height),
      grossWeight: toOptionalNumber(sku.grossWeight),
      netWeight: toOptionalNumber(sku.netWeight),
      costPrice: toOptionalNumber(sku.costPrice),
      sellingPrice: toOptionalNumber(sku.sellingPrice),
    })),
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !validateSkus()) {
    return
  }

  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (props.id) {
      await updateItem(data)
      toast.success('修改成功')
    } else {
      await createItem(data)
      toast.success('新增成功')
    }
    uni.$emit('wms:item:reload')
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
