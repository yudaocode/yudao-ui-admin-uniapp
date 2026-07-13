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
      <UserSearchPicker ref="fromPickerRef" v-model="formData.fromUserId" label="发起人" placeholder="请选择发起人" />
      <UserSearchPicker ref="toPickerRef" v-model="formData.toUserId" label="接收人" placeholder="请选择接收人" />
      <yd-search-picker
        v-model="formData.handleResult"
        label="处理结果"
        :dict-type="DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT"
        all-option
      />
      <yd-search-picker v-model="formData.addSource" label="添加来源" :dict-type="DICT_TYPE.IM_FRIEND_ADD_SOURCE" all-option />
      <yd-search-date-range v-model="formData.createTime" label="申请时间" />
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
const fromPickerRef = ref<any>() // 发起人选择器引用
const toPickerRef = ref<any>() // 接收人选择器引用
const formData = reactive({
  fromUserId: undefined as number | undefined,
  toUserId: undefined as number | undefined,
  handleResult: undefined as number | undefined,
  addSource: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.fromUserId) {
    conditions.push(`发起人:${fromPickerRef.value?.format(formData.fromUserId) || formData.fromUserId}`)
  }
  if (formData.toUserId) {
    conditions.push(`接收人:${toPickerRef.value?.format(formData.toUserId) || formData.toUserId}`)
  }
  if (formData.handleResult !== undefined) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.IM_FRIEND_REQUEST_HANDLE_RESULT, formData.handleResult)}`)
  }
  if (formData.addSource !== undefined) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.IM_FRIEND_ADD_SOURCE, formData.addSource)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`申请时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索好友申请'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    fromUserId: formData.fromUserId,
    toUserId: formData.toUserId,
    handleResult: formData.handleResult,
    addSource: formData.addSource,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.fromUserId = undefined
  formData.toUserId = undefined
  formData.handleResult = undefined
  formData.addSource = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
