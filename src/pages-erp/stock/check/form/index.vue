<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="盘点单号" :value="formData.no || '保存时自动生成'" />
          <wd-form-item title="盘点时间" title-width="220rpx" prop="checkTime" is-link :value="formatDate(formData.checkTime) || ''" placeholder="请选择盘点时间" @click="dateVisible.checkTime = true" />
          <wd-datetime-picker v-model:visible="dateVisible.checkTime" :model-value="formatDate(formData.checkTime)" title="请选择盘点时间" type="date" @update:model-value="value => formData.checkTime = formatOptionalDate(value)" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file v-model="formData.fileUrl" :limit="1" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 盘点明细 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">盘点产品清单</text>
          <wd-button size="small" type="primary" variant="plain" @click="itemEditorRef?.handleAdd()">
            添加
          </wd-button>
        </view>
        <view class="px-24rpx">
          <CheckItemForm ref="itemEditorRef" v-model="formData.items" :product-options="productOptions" :warehouse-options="warehouseOptions" />
        </view>

        <!-- 合计信息 -->
        <view class="flex items-center justify-between px-24rpx py-16rpx">
          <text class="text-28rpx text-[#333] font-semibold">合计信息</text>
        </view>
        <wd-cell-group border>
          <wd-cell title="盈亏数量" :value="formatCount(formData.totalCount)" />
          <wd-cell title="盈亏金额" :value="formatMoney(formData.totalPrice)" />
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
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
import type { Product } from '@/api/erp/product/product'
import type { StockCheck } from '@/api/erp/stock/check'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getProductSimpleList } from '@/api/erp/product/product'
import { createStockCheck, getStockCheck, updateStockCheck } from '@/api/erp/stock/check'
import { getWarehouseSimpleList } from '@/api/erp/stock/warehouse'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate, formatOptionalDate } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import CheckItemForm from '../components/check-item-form.vue'
import { formatCount, roundPrice } from '@/pages-erp/utils/format'
import { formatMoney, toNumber } from '@/utils/format'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑库存盘点' : '新增库存盘点')
const formLoading = ref(false) // 表单提交状态
const formData = ref<StockCheck>({
  id: undefined,
  no: undefined,
  checkTime: formatDate(Date.now()),
  remark: undefined,
  fileUrl: '',
  totalCount: 0,
  totalPrice: 0,
  items: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const itemEditorRef = ref<InstanceType<typeof CheckItemForm>>() // 明细组件引用
const productOptions = ref<Product[]>([]) // 产品选项
const warehouseOptions = ref<Warehouse[]>([]) // 仓库选项
const dateVisible = reactive({
  checkTime: false,
}) // 日期选择器状态
const formSchema = createFormSchema({
  checkTime: [{ required: true, message: '盘点时间不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/check/index')
}

/** 刷新盘点金额 */
function refreshAmount() {
  const items = Array.isArray(formData.value.items) ? formData.value.items : []
  const totalCount = items.reduce((sum, item) => sum + toNumber(item.count), 0)
  const totalPrice = items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0)
  formData.value.totalCount = Number(totalCount.toFixed(3))
  formData.value.totalPrice = roundPrice(totalPrice)
}

/** 加载基础选项 */
async function loadOptions() {
  const [products, warehouses] = await Promise.all([
    getProductSimpleList(),
    getWarehouseSimpleList(),
  ])
  productOptions.value = products || []
  warehouseOptions.value = warehouses || []
}

/** 加载库存盘点详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getStockCheck(props.id)
  } finally {
    toast.close()
  }
  refreshAmount()
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !itemEditorRef.value?.validate()) {
    return
  }

  refreshAmount()
  formLoading.value = true
  try {
    if (props.id) {
      await updateStockCheck(formData.value)
      toast.success('修改成功')
    } else {
      await createStockCheck(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:stock-check:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 明细变更后刷新金额 */
watch(() => formData.value.items, refreshAmount, { deep: true })

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
