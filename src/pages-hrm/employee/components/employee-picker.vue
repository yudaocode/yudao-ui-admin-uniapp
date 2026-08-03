<template>
  <view v-if="$slots.default" @click="open">
    <slot :value="displayValue" :employees="selectedEmployees" />
  </view>

  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!canConfirm" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.name" placeholder="员工姓名" clearable />
        <wd-input v-model="queryParams.jobNumber" placeholder="工号" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 员工列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选员工"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx flex items-center gap-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="[
              isTempSelected(item.id) ? 'ring-2 ring-[#1677ff]' : '',
              isDisabled(item.id) ? 'opacity-50' : '',
            ]"
            @click="toggleItem(item)"
          >
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-10rpx truncate text-24rpx text-[#999]">
                {{ item.deptName || '-' }} · {{ item.jobNumber || '-' }} · {{ item.mobile || '-' }}
              </view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { computed, ref, watch } from 'vue'
import { getEmployeeSimpleList, getEmployeeSimplePage } from '@/api/hrm/employee'

const props = withDefaults(defineProps<{
  modelValue?: number | number[]
  type?: 'radio' | 'checkbox'
  title?: string
  disabled?: boolean
  entryStatus?: number
  disabledIds?: number[]
}>(), {
  type: 'radio',
  title: '选择员工',
  disabled: false,
  disabledIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  'confirm': [employees: Employee[]]
}>()

const visible = ref(false) // 弹窗显示状态
const list = ref<Employee[]>([]) // 员工列表
const selectedEmployees = ref<Employee[]>([]) // 已确认选中
const tempSelected = ref<Employee[]>([]) // 临时选中
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({
  name: '',
  jobNumber: '',
}) // 查询参数

const displayValue = computed(() =>
  selectedEmployees.value.map(item => item.name).filter(Boolean).join('、'),
)
const canConfirm = computed(() => tempSelected.value.length > 0 || props.type === 'checkbox')
const disabledIdSet = computed(() => new Set(props.disabledIds))

/** 是否禁用 */
function isDisabled(id?: number) {
  return id != null && disabledIdSet.value.has(id)
}

/** 是否临时选中 */
function isTempSelected(id?: number) {
  return tempSelected.value.some(item => item.id === id)
}

/** 切换选中 */
function toggleItem(item: Employee) {
  if (item.id == null || isDisabled(item.id)) {
    return
  }
  if (props.type === 'checkbox') {
    if (isTempSelected(item.id)) {
      tempSelected.value = tempSelected.value.filter(row => row.id !== item.id)
      return
    }
    tempSelected.value = [...tempSelected.value, item]
    return
  }
  tempSelected.value = [item]
}

/** 查询员工列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getEmployeeSimplePage({
      pageNo,
      pageSize,
      name: queryParams.value.name || undefined,
      jobNumber: queryParams.value.jobNumber || undefined,
      entryStatus: props.entryStatus,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = { name: '', jobNumber: '' }
  handleQuery()
}

/** 打开选择器 */
function open() {
  if (props.disabled) {
    return
  }
  visible.value = true
  tempSelected.value = [...selectedEmployees.value]
  queryParams.value = { name: '', jobNumber: '' }
  setTimeout(() => pagingRef.value?.reload(), 50)
}

/** 确认选择 */
function handleConfirm() {
  const nextEmployees = [...tempSelected.value]
  selectedEmployees.value = nextEmployees
  const nextValue = props.type === 'checkbox'
    ? nextEmployees.map(item => item.id!).filter(Boolean)
    : nextEmployees[0]?.id
  emit('update:modelValue', nextValue)
  emit('confirm', nextEmployees)
  visible.value = false
}

/** 取消选择 */
function handleCancel() {
  visible.value = false
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
}

/** 规范化编号数组 */
function normalizeIds(value?: number | number[]) {
  return Array.isArray(value) ? value : value == null ? [] : [value]
}

/** 回显已选员工 */
async function resolveSelected(value?: number | number[]) {
  const ids = normalizeIds(value)
  if (!ids.length) {
    selectedEmployees.value = []
    return
  }
  if (
    selectedEmployees.value.length === ids.length
    && selectedEmployees.value.every((item, index) => item.id === ids[index])
  ) {
    return
  }
  selectedEmployees.value = await getEmployeeSimpleList(ids)
}

/** 格式化员工编号 */
function format(value?: number | number[]) {
  const currentValue = arguments.length > 0 ? value : props.modelValue
  const ids = normalizeIds(currentValue)
  return selectedEmployees.value
    .filter(item => item.id != null && ids.includes(item.id))
    .map(item => item.name)
    .filter(Boolean)
    .join('、')
}

watch(() => props.modelValue, (value) => {
  resolveSelected(value)
}, { immediate: true })

defineExpose({ open, format })
</script>
