<template>
  <view class="mt-20rpx rounded-12rpx bg-[#fff7ed] p-20rpx">
    <view class="mb-16rpx flex items-center justify-between gap-16rpx">
      <view class="text-28rpx text-[#333] font-semibold">
        产品 BOM 配置
      </view>
      <wd-button v-if="editable" size="small" type="primary" variant="plain" :disabled="!activeProcessId" @click="openForm('create')">
        添加 BOM
      </wd-button>
    </view>

    <view v-if="processList.length > 0" class="mb-16rpx flex gap-12rpx overflow-x-auto">
      <view
        v-for="process in processList"
        :key="process.processId"
        class="shrink-0 rounded-999rpx px-20rpx py-10rpx text-24rpx"
        :class="activeProcessId === process.processId ? 'bg-[#1677ff] text-white' : 'bg-white text-[#666]'"
        @click="handleProcessChange(process.processId)"
      >
        {{ process.processName || process.processCode || process.processId }}
      </view>
    </view>
    <view v-else class="py-16rpx text-26rpx text-[#999]">
      请先配置路线工序，再维护产品 BOM。
    </view>

    <view v-if="loading" class="py-16rpx text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="activeProcessId && bomList.length === 0" class="py-16rpx text-26rpx text-[#999]">
      当前工序暂无 BOM 物料
    </view>
    <view v-else class="space-y-12rpx">
      <view v-for="bom in bomList" :key="bom.id" class="rounded-12rpx bg-white p-16rpx">
        <view class="mb-8rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ bom.itemName || '-' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ bom.itemCode || '-' }}
            </view>
          </view>
          <view class="flex shrink-0 gap-12rpx">
            <wd-button v-if="editable" size="small" type="warning" variant="plain" @click="openForm('update', bom)">
              编辑
            </wd-button>
            <wd-button v-if="editable" size="small" type="danger" variant="plain" @click="handleDelete(bom)">
              删除
            </wd-button>
          </view>
        </view>
        <view class="text-24rpx text-[#666] space-y-6rpx">
          <view>规格型号：{{ bom.specification || '-' }}</view>
          <view>单位：{{ bom.unitName || '-' }}</view>
          <view>用料比例：{{ formatDecimalValue(bom.quantity, 4, { trimTrailingZeros: true }) }}</view>
          <view v-if="bom.remark">
            备注：{{ bom.remark }}
          </view>
        </view>
      </view>
    </view>
  </view>

  <wd-popup v-model="formVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 82vh;">
    <view class="max-h-[82vh] flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">{{ formTitle }}</text>
        <wd-icon name="close" size="36rpx" @click="formVisible = false" />
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-cell title="工序" :value="activeProcessName" />
            <wd-form-item title="BOM 物料" title-width="220rpx" prop="itemId" is-link :value="bomDisplayValue" placeholder="请选择 BOM 物料" @click="openBomPicker" />
            <wd-form-item title="用料比例" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0" :precision="4" :step="0.1" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="h-120rpx" />
      </scroll-view>
      <view class="p-24rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <ProductBomPicker
    ref="productBomPickerRef"
    :item-id="productId"
    :existing-ids="existingBomItemIds"
    @confirm="handleBomItemConfirm"
  />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdProductBom } from '@/api/mes/md/item/productBom'
import type { ProRouteProcess } from '@/api/mes/pro/route/process'
import type { ProRouteProductBom } from '@/api/mes/pro/route/productbom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getRouteProcessListByRoute } from '@/api/mes/pro/route/process'
import {
  createRouteProductBom,
  deleteRouteProductBom,
  getRouteProductBomList,
  updateRouteProductBom,
} from '@/api/mes/pro/route/productbom'
import ProductBomPicker from '@/pages-mes/md/item/components/product-bom-picker.vue'
import { formatDecimalValue } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  editable: boolean
  productId: number
  productName?: string
  routeId: number
}>()
const emit = defineEmits<{ changed: [] }>()
const dialog = useDialog()
const toast = useToast()
const processList = ref<ProRouteProcess[]>([]) // 路线工序列表
const activeProcessId = ref<number>() // 当前工序编号
const bomList = ref<ProRouteProductBom[]>([]) // BOM 列表
const loading = ref(false) // 列表加载状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formData = ref<ProRouteProductBom>(createDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const productBomPickerRef = ref<InstanceType<typeof ProductBomPicker>>() // 产品 BOM 选择器引用
const formTitle = computed(() => formType.value === 'create' ? '添加 BOM 物料' : '编辑 BOM 物料')
const activeProcessName = computed(() => {
  const process = processList.value.find(item => item.processId === activeProcessId.value)
  return process?.processName || process?.processCode || '-'
})
const existingBomItemIds = computed(() => {
  return bomList.value.map(item => item.itemId).filter((id): id is number => id != null)
})
const bomDisplayValue = computed(() => {
  if (formData.value.itemName || formData.value.itemCode) {
    return `${formData.value.itemName || '-'} (${formData.value.itemCode || '-'})`
  }
  return formData.value.itemId ? String(formData.value.itemId) : ''
})
const formSchema = createFormSchema({
  itemId: [{ required: true, message: 'BOM 物料不能为空' }],
  quantity: [{ required: true, message: '用料比例不能为空' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): ProRouteProductBom {
  return {
    routeId: props.routeId,
    processId: activeProcessId.value,
    productId: props.productId,
    quantity: 1,
  }
}

/** 加载路线工序 */
async function loadProcessList() {
  const data = await getRouteProcessListByRoute(props.routeId)
  processList.value = [...(data || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  if (!activeProcessId.value || !processList.value.some(item => item.processId === activeProcessId.value)) {
    activeProcessId.value = processList.value[0]?.processId
  }
}

/** 加载当前工序 BOM 列表 */
async function getList() {
  if (!props.routeId || !props.productId || !activeProcessId.value) {
    bomList.value = []
    return
  }
  loading.value = true
  try {
    bomList.value = await getRouteProductBomList({
      routeId: props.routeId,
      processId: activeProcessId.value,
      productId: props.productId,
    })
  } finally {
    loading.value = false
  }
}

/** 切换工序 */
async function handleProcessChange(processId: number) {
  activeProcessId.value = processId
  await getList()
}

/** 打开新增或编辑弹层 */
function openForm(type: 'create' | 'update', row?: ProRouteProductBom) {
  if (!activeProcessId.value) {
    toast.warning('请先配置路线工序')
    return
  }
  formType.value = type
  formData.value = row ? { ...row } : createDefaultFormData()
  formVisible.value = true
  nextTick(() => formRef.value?.reset())
}

/** 打开 BOM 物料选择器 */
function openBomPicker() {
  productBomPickerRef.value?.open(formData.value.itemId)
}

/** 选择 BOM 物料 */
function handleBomItemConfirm(bom: MdProductBom) {
  formData.value.itemId = bom.bomItemId
  formData.value.itemCode = bom.bomItemCode
  formData.value.itemName = bom.bomItemName
  formData.value.specification = bom.bomItemSpecification
  formData.value.unitName = bom.unitMeasureName
  formData.value.quantity = bom.quantity ?? formData.value.quantity ?? 1
}

/** 提交 BOM 配置 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (formType.value === 'update' && !formData.value.id) {
    toast.error('缺少 BOM 配置编号')
    return
  }

  formLoading.value = true
  try {
    const data: ProRouteProductBom = {
      ...formData.value,
      routeId: props.routeId,
      processId: Number(activeProcessId.value),
      productId: props.productId,
      itemId: Number(formData.value.itemId),
    }
    if (formType.value === 'create') {
      await createRouteProductBom(data)
      toast.success('新增成功')
    } else {
      await updateRouteProductBom(data)
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
    emit('changed')
  } finally {
    formLoading.value = false
  }
}

/** 删除 BOM 配置 */
async function handleDelete(item: ProRouteProductBom) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.itemName || item.itemCode}」BOM 物料吗？` })
  } catch {
    return
  }
  await deleteRouteProductBom(item.id)
  toast.success('删除成功')
  await getList()
  emit('changed')
}

/** 监听路线和产品变化 */
watch(() => [props.routeId, props.productId], async () => {
  activeProcessId.value = undefined
  await loadProcessList()
  await getList()
})

/** 初始化 */
onMounted(async () => {
  await loadProcessList()
  await getList()
})
</script>
