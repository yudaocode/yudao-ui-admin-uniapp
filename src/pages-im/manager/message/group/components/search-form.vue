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
          群编号
        </view>
        <wd-input v-model="formData.groupId" type="number" placeholder="请输入群编号" clearable />
      </view>
      <UserSearchPicker ref="senderPickerRef" v-model="formData.senderId" label="发送人" placeholder="请选择发送人" />
      <yd-search-picker v-model="formData.type" label="消息类型" :dict-type="DICT_TYPE.IM_CONTENT_TYPE" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          消息内容
        </view>
        <wd-input v-model="formData.content" placeholder="请输入消息内容" clearable />
      </view>
      <yd-search-date-range v-model="formData.sendTime" label="发送时间" />
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
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'
import { getWotPickerDisplay } from '@/utils/wot'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const senderPickerRef = ref<any>() // 发送人选择器引用
const typeColumns = [{ label: '全部', value: -1 }, ...getIntDictOptions(DICT_TYPE.IM_CONTENT_TYPE)] // 消息类型选项（-1 全部）
const formData = reactive({
  groupId: undefined as string | undefined,
  senderId: undefined as number | undefined,
  type: -1, // -1 表示全部
  content: undefined as string | undefined,
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.groupId) {
    conditions.push(`群:${formData.groupId}`)
  }
  if (formData.senderId) {
    conditions.push(`发送人:${senderPickerRef.value?.format(formData.senderId) || formData.senderId}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getWotPickerDisplay(typeColumns, formData.type, { valueKey: 'value', labelKey: 'label', placeholder: '' })}`)
  }
  if (formData.content) {
    conditions.push(`内容:${formData.content}`)
  }
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`发送时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索群聊消息'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    groupId: formData.groupId,
    senderId: formData.senderId,
    type: formData.type === -1 ? undefined : formData.type,
    content: formData.content,
    sendTime: formatDateRange(formData.sendTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.groupId = undefined
  formData.senderId = undefined
  formData.type = -1
  formData.content = undefined
  formData.sendTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
