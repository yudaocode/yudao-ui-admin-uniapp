<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        设备清单
      </view>
      <wd-button v-if="!readonly" size="small" type="primary" variant="plain" @click="openCreateForm">
        添加设备
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无关联设备
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
            {{ item.machineryName || item.machineryCode || '-' }}
          </view>
          <view class="shrink-0 text-24rpx text-[#999]">
            {{ item.machineryCode || '-' }}
          </view>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">品牌：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.machineryBrand || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.machinerySpecification || '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
        <view v-if="!readonly" class="mt-16rpx flex justify-end">
          <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete(item)">
            {{ deletingId === item.id ? '删除中...' : '删除' }}
          </wd-button>
        </view>
      </view>
    </view>
  </view>

  <!-- 添加设备弹窗 -->
  <wd-popup
    v-model="formVisible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          添加设备
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item
              title="设备"
              title-width="200rpx"
              prop="machineryId"
              is-link
              :value="selectedMachineryText"
              placeholder="请选择设备"
              @click="openMachineryPicker"
            />
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <MachineryPicker ref="machineryPickerRef" :existing-ids="existingMachineryIds" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
import type { DvCheckPlanMachinery } from '@/api/mes/dv/checkplan/machinery'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { create, deleteCheckPlanMachinery, getListByPlan } from '@/api/mes/dv/checkplan/machinery'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import MachineryPicker from '../../machinery/components/machinery-picker.vue'

const props = defineProps<{
  planId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvCheckPlanMachinery[]>([]) // 设备清单
const formVisible = ref(false) // 添加弹窗显示状态
const formLoading = ref(false) // 添加提交状态
const deletingId = ref<number>() // 删除中编号
const formRef = ref<FormInstance>() // 表单引用
const formData = ref({
  machineryId: undefined,
  remark: '',
}) // 添加表单数据
const selectedMachinery = ref<DvMachinery>() // 当前选择设备
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器引用
const formSchema = createFormSchema({
  machineryId: [{ required: true, message: '设备不能为空' }],
})
const existingMachineryIds = computed(() => list.value.map(item => item.machineryId))
const selectedMachineryText = computed(() => {
  if (!selectedMachinery.value) {
    return ''
  }
  return `${selectedMachinery.value.code || '-'} ${selectedMachinery.value.name || ''}`.trim()
})

/** 查询设备清单 */
async function getList() {
  if (!props.planId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

/** 打开添加弹窗 */
function openCreateForm() {
  formData.value = {
    machineryId: undefined,
    remark: '',
  }
  selectedMachinery.value = undefined
  formVisible.value = true
}

/** 打开设备选择器 */
function openMachineryPicker() {
  machineryPickerRef.value?.open()
}

/** 确认选择设备 */
function handleMachineryConfirm(item: DvMachinery) {
  selectedMachinery.value = item
  formData.value.machineryId = item.id
}

/** 提交添加设备 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.planId || !formData.value.machineryId) {
    return
  }
  formLoading.value = true
  try {
    await create({
      planId: props.planId,
      machineryId: formData.value.machineryId,
      remark: formData.value.remark || undefined,
    })
    toast.success('添加成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除设备 */
async function handleDelete(item: DvCheckPlanMachinery) {
  if (deletingId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除设备「${item.machineryName || item.machineryCode || item.id}」吗？`,
      confirmButtonText: '删除',
    })
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    await deleteCheckPlanMachinery(item.id)
    toast.success('删除成功')
    await getList()
  } finally {
    deletingId.value = undefined
  }
}

/** 监听方案编号变化 */
watch(
  () => props.planId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
