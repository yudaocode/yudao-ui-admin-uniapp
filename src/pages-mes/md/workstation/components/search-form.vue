<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工作站编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作站名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工作站名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.workshopId"
        label="所在车间"
        :columns="workshopOptions"
        label-key="name"
        value-key="id"
        all-option
      />
      <yd-search-picker
        v-model="formData.processId"
        label="所属工序"
        :columns="processOptions"
        label-key="label"
        value-key="id"
        all-option
      />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.COMMON_STATUS" all-option />
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
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import type { ProProcess } from '@/api/mes/pro/process'
import { computed, onMounted, reactive, ref } from 'vue'
import { getWorkshopSimpleList } from '@/api/mes/md/workstation/workshop'
import { getProcessSimpleList } from '@/api/mes/pro/process'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  workshopId: -1,
  processId: -1,
  status: -1,
}) // 搜索表单数据
const workshopOptions = ref<MdWorkshop[]>([]) // 车间选项
const processOptions = ref<Array<{ id: number, label: string }>>([]) // 工序选项

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.workshopId !== -1) {
    const label = workshopOptions.value.find(item => item.id === formData.workshopId)?.name
    conditions.push(`车间:${label || formData.workshopId}`)
  }
  if (formData.processId !== -1) {
    const label = processOptions.value.find(item => item.id === formData.processId)?.label
    conditions.push(`工序:${label || formData.processId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工作站'
})

/** 加载筛选选项 */
async function loadOptions() {
  const [workshops, processes] = await Promise.all([
    getWorkshopSimpleList(),
    getProcessSimpleList(),
  ])
  workshopOptions.value = workshops || []
  processOptions.value = (processes || [])
    .filter((process): process is ProProcess & { id: number } => process.id !== undefined)
    .map(process => ({
      id: process.id,
      label: process.code ? `${process.name} (${process.code})` : process.name,
    }))
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    workshopId: formData.workshopId === -1 ? undefined : formData.workshopId,
    processId: formData.processId === -1 ? undefined : formData.processId,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.workshopId = -1
  formData.processId = -1
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
