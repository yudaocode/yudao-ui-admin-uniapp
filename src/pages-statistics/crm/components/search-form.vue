<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          开始日期
        </view>
        <wd-form-item
          is-link
          :value="formatDate(formData.startTime)"
          placeholder="请选择开始日期"
          @click="startVisible = true"
        />
        <wd-datetime-picker
          v-model="formData.startTime"
          v-model:visible="startVisible"
          title="请选择开始日期"
          type="date"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          结束日期
        </view>
        <wd-form-item
          is-link
          :value="formatDate(formData.endTime)"
          placeholder="请选择结束日期"
          @click="endVisible = true"
        />
        <wd-datetime-picker
          v-model="formData.endTime"
          v-model:visible="endVisible"
          title="请选择结束日期"
          type="date"
        />
      </view>
      <DeptSearchPicker ref="deptPickerRef" v-model="formData.deptId" label="归属部门" placeholder="请选择归属部门" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { DeptSearchPicker } from '@/components/system-select'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  defaultDeptId?: number
  deptId?: number
  initialEndTime: number
  initialStartTime: number
}>()

const emit = defineEmits<{
  search: [data: { deptId?: number, endTime: number, startTime: number }]
  reset: []
  ready: [data: { deptId?: number, endTime: number, startTime: number }]
}>()

const visible = ref(false) // 搜索弹窗显示状态
const startVisible = ref(false) // 开始日期选择器显隐
const endVisible = ref(false) // 结束日期选择器显隐
const deptPickerRef = ref<InstanceType<typeof DeptSearchPicker>>() // 部门选择器引用
const formData = reactive({
  startTime: props.initialStartTime,
  endTime: props.initialEndTime,
  deptId: props.deptId || props.defaultDeptId,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索入口展示文案
  const deptName = deptPickerRef.value?.format(formData.deptId) || formData.deptId
  const conditions = [
    `${formatDate(formData.startTime)} 至 ${formatDate(formData.endTime)}`,
    deptName ? `部门:${deptName}` : '',
  ].filter(Boolean)
  return conditions.length > 0 ? conditions.join(' | ') : '搜索统计'
})

watch(
  () => [props.deptId, props.defaultDeptId, props.initialStartTime, props.initialEndTime],
  () => {
    if (visible.value) {
      return
    }
    formData.startTime = props.initialStartTime
    formData.endTime = props.initialEndTime
    formData.deptId = props.deptId || props.defaultDeptId
  },
)

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.startTime = props.initialStartTime
  formData.endTime = props.initialEndTime
  formData.deptId = props.defaultDeptId
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  if (!formData.deptId) {
    formData.deptId = await deptPickerRef.value?.getFirstDeptId()
  }
  emit('ready', { ...formData })
})
</script>
