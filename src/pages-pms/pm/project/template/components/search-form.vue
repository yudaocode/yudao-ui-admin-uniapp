<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模板名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入模板名称" clearable />
      </view>
      <yd-search-picker
        v-model="formData.projectType"
        label="项目类型"
        :columns="projectTypeOptions"
        all-option
        all-label="全部类型"
      />
      <yd-search-picker
        v-model="formData.status"
        label="状态"
        :dict-type="DICT_TYPE.COMMON_STATUS"
        all-option
        all-label="全部状态"
      />
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
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { PmsProjectType } from '@/pages-pms/pm/utils/constants'
import { formatProjectType } from '@/pages-pms/pm/utils/format'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: undefined as string | undefined,
  projectType: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

const projectTypeOptions = [ // 项目类型选项
  { label: '通用项目', value: PmsProjectType.GENERAL },
  { label: '敏捷开发项目', value: PmsProjectType.AGILE },
]

const placeholder = computed(() => { // 搜索条件 placeholder 拼接
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`模板名称:${formData.name}`)
  }
  if (formData.projectType !== undefined) {
    conditions.push(`类型:${formatProjectType(formData.projectType)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索模板名称'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    projectType: formData.projectType,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.projectType = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
