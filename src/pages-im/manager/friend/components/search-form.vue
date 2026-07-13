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
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <UserSearchPicker ref="friendPickerRef" v-model="formData.friendUserId" label="好友" placeholder="请选择好友" />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.IM_FRIEND_STATUS" all-option />
      <yd-search-picker v-model="formData.silent" label="免打扰" :columns="booleanOptions" all-option />
      <yd-search-date-range v-model="formData.addTime" label="添加时间" />
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
const userPickerRef = ref<any>() // 用户选择器引用
const friendPickerRef = ref<any>() // 好友选择器引用
const booleanOptions = [ // 布尔筛选选项
  { label: '是', value: true },
  { label: '否', value: false },
]
const formData = reactive({
  userId: undefined as number | undefined,
  friendUserId: undefined as number | undefined,
  status: undefined as number | undefined,
  silent: undefined as boolean | undefined,
  addTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.friendUserId) {
    conditions.push(`好友:${friendPickerRef.value?.format(formData.friendUserId) || formData.friendUserId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.IM_FRIEND_STATUS, formData.status)}`)
  }
  if (formData.silent !== undefined) {
    conditions.push(`免打扰:${formData.silent === true ? '是' : '否'}`)
  }
  if (formData.addTime?.[0] && formData.addTime?.[1]) {
    conditions.push(`添加时间:${formatDate(formData.addTime[0])}~${formatDate(formData.addTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索好友关系'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId,
    friendUserId: formData.friendUserId,
    status: formData.status,
    silent: formData.silent,
    addTime: formatDateRange(formData.addTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.friendUserId = undefined
  formData.status = undefined
  formData.silent = undefined
  formData.addTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
