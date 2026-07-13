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
          群名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入群名称" clearable />
      </view>
      <UserSearchPicker ref="ownerPickerRef" v-model="formData.ownerUserId" label="群主" placeholder="请选择群主" />
      <yd-search-picker v-model="formData.status" label="群状态" :dict-type="DICT_TYPE.IM_GROUP_STATUS" all-option />
      <yd-search-picker v-model="formData.banned" label="封禁状态" :columns="bannedOptions" all-option />
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const ownerPickerRef = ref<any>() // 群主选择器引用
const bannedOptions = [ // 封禁状态选项
  { label: '已封禁', value: true },
  { label: '未封禁', value: false },
]
const formData = reactive({
  name: undefined as string | undefined,
  ownerUserId: undefined as number | undefined,
  status: undefined as number | undefined,
  banned: undefined as boolean | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.ownerUserId) {
    conditions.push(`群主:${ownerPickerRef.value?.format(formData.ownerUserId) || formData.ownerUserId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.IM_GROUP_STATUS, formData.status)}`)
  }
  if (formData.banned !== undefined) {
    conditions.push(`封禁:${formData.banned === true ? '已封禁' : '未封禁'}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`创建时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索群组'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    ownerUserId: formData.ownerUserId,
    status: formData.status,
    banned: formData.banned,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.ownerUserId = undefined
  formData.status = undefined
  formData.banned = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
