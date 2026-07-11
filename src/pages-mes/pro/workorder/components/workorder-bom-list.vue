<template>
  <view class="mx-24rpx mt-24rpx">
    <view v-if="showTitle" class="mb-16rpx flex items-center justify-between">
      <view class="text-30rpx text-[#333] font-semibold">
        工单 BOM
      </view>
      <view class="flex items-center gap-12rpx">
        <wd-tag type="primary" plain>
          {{ total }} 条
        </wd-tag>
        <wd-button
          v-if="canEditBom && hasAccessByCodes(['mes:pro-work-order:update'])"
          size="small"
          type="primary"
          variant="plain"
          @click="handleAdd"
        >
          添加物料
        </wd-button>
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="5"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多 BOM 物料了"
      empty-view-text="暂无工单 BOM"
      @query="queryList"
    >
      <view v-for="item in list" :key="item.id || item.itemId" class="mb-16rpx rounded-12rpx bg-white p-20rpx shadow-sm">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-28rpx text-[#333] font-semibold">
              {{ item.itemName || '-' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ item.itemCode || '-' }}
            </view>
          </view>
          <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
        </view>
        <view class="text-24rpx text-[#666] space-y-6rpx">
          <view>规格型号：{{ item.itemSpecification || '-' }}</view>
          <view>单位：{{ item.unitMeasureName || '-' }}</view>
          <view>预计使用量：{{ item.quantity ?? '-' }}</view>
          <view v-if="item.remark">
            备注：{{ item.remark }}
          </view>
        </view>
        <view v-if="canEditBom || canGenerateWorkOrder(item)" class="mt-16rpx flex gap-16rpx">
          <wd-button
            v-if="canEditBom && hasAccessByCodes(['mes:pro-work-order:update'])"
            class="flex-1"
            size="small"
            variant="plain"
            @click="handleEdit(item)"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="canEditBom && hasAccessByCodes(['mes:pro-work-order:update'])"
            class="flex-1"
            size="small"
            type="danger"
            variant="plain"
            @click="handleDelete(item)"
          >
            删除
          </wd-button>
          <wd-button
            v-if="canGenerateWorkOrder(item) && hasAccessByCodes(['mes:pro-work-order:create'])"
            class="flex-1"
            size="small"
            type="success"
            variant="plain"
            @click="handleGenerateWorkOrder(item)"
          >
            生成工单
          </wd-button>
        </view>
      </view>
    </z-paging>

    <!-- 产品 BOM 选择 -->
    <ProductBomPicker
      ref="productBomPickerRef"
      :item-id="workOrder?.productId"
      :existing-ids="existingBomItemIds"
      @confirm="handleConfirmBom"
    />

    <!-- 工单 BOM 表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 68vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formData.id ? '编辑 BOM 物料' : '添加 BOM 物料' }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-cell title="BOM 物料编码" :value="formData.itemCode || '-'" />
              <wd-cell title="BOM 物料名称" :value="formData.itemName || '-'" />
              <wd-cell title="规格型号" :value="formData.itemSpecification || '-'" />
              <wd-cell title="单位" :value="formData.unitMeasureName || '-'" />
              <wd-form-item title="预计使用量" title-width="220rpx" prop="quantity" center>
                <wd-input-number v-model="formData.quantity" :min="0" :precision="2" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdProductBom } from '@/api/mes/md/item/productBom'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { ProWorkOrderBom } from '@/api/mes/pro/workorder/bom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createWorkOrderBom,
  deleteWorkOrderBom,
  getWorkOrderBomListByWorkOrderId,
  getWorkOrderBomPage,
  updateWorkOrderBom,
} from '@/api/mes/pro/workorder/bom'
import { useAccess } from '@/hooks/useAccess'
import ProductBomPicker from '@/pages-mes/md/item/components/product-bom-picker.vue'
import { DICT_TYPE, MesProWorkOrderStatusEnum, MesProWorkOrderTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = withDefaults(defineProps<{
  workOrderId?: number
  workOrder?: ProWorkOrder
  readonly?: boolean
  showTitle?: boolean
}>(), {
  workOrderId: undefined,
  workOrder: undefined,
  readonly: false,
  showTitle: true,
})

const emit = defineEmits<{
  generateWorkOrder: [row: ProWorkOrderBom]
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const canEditBom = computed(() => { // 草稿工单可维护 BOM
  return !props.readonly
    && props.workOrder?.status === MesProWorkOrderStatusEnum.PREPARE
})
const list = ref<ProWorkOrderBom[]>([]) // 明细数据
const total = ref(0) // 明细总数
const pagingRef = ref<ZPagingRef<ProWorkOrderBom>>() // 分页组件引用
const existingBomItemIds = ref<number[]>([]) // 已有 BOM 物料编号
const formVisible = ref(false) // 表单弹层状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const productBomPickerRef = ref<InstanceType<typeof ProductBomPicker>>() // 产品 BOM 选择器引用
const formData = ref<ProWorkOrderBom>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  quantity: [{ required: true, message: '预计使用量不能为空' }],
})

/** 查询明细列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.workOrderId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getWorkOrderBomPage({ pageNo, pageSize, workOrderId: props.workOrderId })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 加载已有 BOM 物料编号 */
async function loadExistingBomItemIds() {
  if (!props.workOrderId) {
    existingBomItemIds.value = []
    return
  }
  const list = await getWorkOrderBomListByWorkOrderId(props.workOrderId)
  const itemIds = list.map(item => item.itemId).filter((id): id is number => id != null)
  existingBomItemIds.value = Array.from(new Set(itemIds))
}

/** 默认表单数据 */
function getDefaultFormData(): ProWorkOrderBom {
  return {
    workOrderId: props.workOrderId,
    quantity: 1,
  }
}

/** 打开新增 */
async function handleAdd() {
  if (!props.workOrder?.productId) {
    toast.warning('请先选择工单产品')
    return
  }
  await loadExistingBomItemIds()
  await nextTick()
  productBomPickerRef.value?.open()
}

/** 确认产品 BOM */
function handleConfirmBom(bom: MdProductBom) {
  if (!bom.bomItemId) {
    return
  }
  formData.value = {
    workOrderId: props.workOrderId,
    itemId: bom.bomItemId,
    itemCode: bom.bomItemCode,
    itemName: bom.bomItemName,
    itemSpecification: bom.bomItemSpecification,
    unitMeasureName: bom.unitMeasureName,
    quantity: bom.quantity ?? 1,
  }
  formVisible.value = true
}

/** 编辑 BOM */
function handleEdit(item: ProWorkOrderBom) {
  formData.value = {
    ...item,
  }
  formVisible.value = true
}

/** 提交 BOM */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.value.workOrderId || !formData.value.itemId) {
    toast.warning('BOM 物料不能为空')
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateWorkOrderBom(formData.value)
      toast.success('修改成功')
    } else {
      await createWorkOrderBom(formData.value)
      toast.success('新增成功')
    }
    formVisible.value = false
    reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除 BOM */
async function handleDelete(item: ProWorkOrderBom) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除 BOM 物料「${item.itemName || item.itemCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteWorkOrderBom(item.id)
  toast.success('删除成功')
  reload()
}

/** 是否可从 BOM 生成子工单 */
function canGenerateWorkOrder(item: ProWorkOrderBom) {
  return props.workOrder?.status === MesProWorkOrderStatusEnum.CONFIRMED
    && props.workOrder?.type === MesProWorkOrderTypeEnum.SELF
    && item.itemOrProduct === 'PRODUCT'
}

/** 生成子工单 */
function handleGenerateWorkOrder(item: ProWorkOrderBom) {
  emit('generateWorkOrder', item)
}

/** 监听工单变化 */
watch(() => props.workOrderId, reload)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:pro:workorder:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:pro:workorder:reload', reload)
})
</script>
