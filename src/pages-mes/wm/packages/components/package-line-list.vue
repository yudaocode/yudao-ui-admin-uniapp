<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle || editable" class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        <template v-if="showTitle">
          装箱清单
        </template>
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openLineForm()">
        添加明细
      </wd-button>
    </view>
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="10"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多装箱明细了"
      empty-view-text="暂无装箱明细"
      @query="queryList"
    >
      <view class="bg-[#f5f5f5] px-24rpx py-8rpx">
        <view
          v-for="item in list"
          :key="item.id || item.itemId"
          class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx">
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.itemCode || `明细 #${item.id}` }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.itemName || '-' }}
                </view>
              </view>
              <view class="shrink-0 text-26rpx text-[#1677ff]">
                {{ item.quantity ?? '-' }} {{ item.unitMeasureName || '' }}
              </view>
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">规格：</text>{{ item.specification || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">生产工单：</text>{{ item.workOrderCode || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">批次号：</text>{{ item.batchCode || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">有效期：</text>{{ formatDateTime(item.expireDate) || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">备注：</text>{{ item.remark || '-' }}
            </view>
          </view>
          <view v-if="editable" class="flex justify-end gap-16rpx px-24rpx pb-24rpx">
            <wd-button size="small" type="warning" variant="plain" @click="openLineForm(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDeleteLine(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>

  <!-- 明细表单弹窗 -->
  <wd-popup
    v-model="lineFormVisible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 88vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="lineFormVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ lineFormTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="lineFormLoading" @click="handleSubmitLine">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="lineFormRef" :model="lineFormData" :schema="lineFormSchema">
          <wd-cell-group border>
            <wd-form-item
              title="生产工单"
              title-width="220rpx"
              prop="workOrderId"
              is-link
              :value="workOrderDisplayValue"
              placeholder="请选择已确认工单"
              @click="openWorkOrderPicker"
            />
            <wd-form-item
              title="产品物料"
              title-width="220rpx"
              prop="itemId"
              is-link
              :value="itemDisplayValue"
              placeholder="请选择产品物料"
              @click="openItemPicker"
            />
            <wd-form-item title="装箱数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="lineFormData.quantity" allow-null :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item
              title="有效期"
              title-width="220rpx"
              prop="expireDate"
              is-link
              :value="formatDateTime(lineFormData.expireDate)"
              placeholder="请选择有效期"
              @click="expirePickerVisible = true"
            />
            <wd-form-item title="批次号" title-width="220rpx">
              <text>{{ lineFormData.batchCode || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="规格型号" title-width="220rpx">
              <text>{{ lineFormData.specification || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="单位" title-width="220rpx">
              <text>{{ lineFormData.unitMeasureName || '-' }}</text>
            </wd-form-item>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea
                v-model="lineFormData.remark"
                placeholder="请输入备注"
                :maxlength="200"
                show-word-limit
                clearable
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>

  <wd-datetime-picker
    v-model="lineFormData.expireDate"
    v-model:visible="expirePickerVisible"
    title="请选择有效期"
    type="date"
  />
  <WorkOrderPicker ref="workOrderPickerRef" @confirm="handleWorkOrderConfirm" />
  <ItemPicker ref="itemPickerRef" :multiple="false" title="选择产品物料" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import type { WmPackageLine } from '@/api/mes/wm/packages/line'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createPackageLine,
  deletePackageLine,
  getPackageLine,
  getPackageLinePage,
  updatePackageLine,
} from '@/api/mes/wm/packages/line'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import ItemPicker from '../../../md/item/components/item-picker.vue'
import WorkOrderPicker from '@/pages-mes/pro/workorder/components/workorder-picker.vue'

const props = withDefaults(defineProps<{
  packageId?: number
  editable?: boolean
  showTitle?: boolean
}>(), {
  packageId: undefined,
  editable: false,
  showTitle: true,
})

const dialog = useDialog()
const toast = useToast()
const list = ref<WmPackageLine[]>([]) // 装箱明细列表
const pagingRef = ref<ZPagingRef<WmPackageLine>>() // 分页组件引用
const lineFormVisible = ref(false) // 明细表单显示
const lineFormLoading = ref(false) // 明细提交状态
const lineFormRef = ref<FormInstance>() // 明细表单引用
const lineFormData = ref<WmPackageLine>(getDefaultLineFormData()) // 明细表单数据
const expirePickerVisible = ref(false) // 有效期选择器
const workOrderPickerRef = ref<InstanceType<typeof WorkOrderPicker>>() // 工单选择器
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器
const lineFormTitle = computed(() => lineFormData.value.id ? '编辑装箱明细' : '添加装箱明细')
const workOrderDisplayValue = computed(() => {
  return lineFormData.value.workOrderCode || ''
})
const itemDisplayValue = computed(() => {
  const code = lineFormData.value.itemCode || ''
  const name = lineFormData.value.itemName || ''
  return [code, name].filter(Boolean).join(' / ')
})
const lineFormSchema = createFormSchema({
  workOrderId: [{ required: true, message: '生产工单不能为空' }],
  itemId: [{ required: true, message: '产品物料不能为空' }],
  quantity: [
    { required: true, message: '装箱数量不能为空' },
    { validator: value => Number(value) > 0 || '装箱数量必须大于 0' },
  ],
})

/** 默认明细表单数据 */
function getDefaultLineFormData(): WmPackageLine {
  return {
    packageId: props.packageId,
  }
}

/** 查询装箱明细 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.packageId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getPackageLinePage({
      pageNo,
      pageSize,
      packageId: props.packageId,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开明细表单 */
async function openLineForm(item?: WmPackageLine) {
  lineFormVisible.value = true
  lineFormData.value = getDefaultLineFormData()
  if (!item?.id) {
    return
  }
  lineFormLoading.value = true
  try {
    const detail = await getPackageLine(item.id)
    lineFormData.value = detail
  } finally {
    lineFormLoading.value = false
  }
}

/** 打开工单选择器 */
function openWorkOrderPicker() {
  workOrderPickerRef.value?.open(lineFormData.value.workOrderId)
}

/** 确认选择工单 */
function handleWorkOrderConfirm(item: ProWorkOrder) {
  lineFormData.value.workOrderId = item.id
  lineFormData.value.workOrderCode = item.code
  lineFormData.value.batchCode = item.batchCode
}

/** 打开物料选择器 */
function openItemPicker() {
  itemPickerRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  lineFormData.value.itemId = item.id
  lineFormData.value.itemCode = item.code
  lineFormData.value.itemName = item.name
  lineFormData.value.specification = item.specification
  lineFormData.value.unitMeasureName = item.unitMeasureName
}

/** 提交明细 */
async function handleSubmitLine() {
  const { valid } = await lineFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.packageId) {
    return
  }
  lineFormLoading.value = true
  try {
    if (lineFormData.value.id) {
      await updatePackageLine(lineFormData.value)
      toast.success('修改成功')
    } else {
      await createPackageLine(lineFormData.value)
      toast.success('新增成功')
    }
    lineFormVisible.value = false
    reload()
  } finally {
    lineFormLoading.value = false
  }
}

/** 删除明细 */
async function handleDeleteLine(item: WmPackageLine) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除装箱明细「${item.itemCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deletePackageLine(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:packages:reload', reload)
})

/** 监听包装编号变化 */
watch(() => props.packageId, reload)

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:wm:packages:reload', reload)
})
</script>
