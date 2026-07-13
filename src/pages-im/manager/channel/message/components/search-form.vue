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
      <ChannelSearchPicker ref="channelPickerRef" v-model="formData.channelId" />
      <MaterialSearchPicker
        ref="materialPickerRef"
        v-model="formData.materialId"
        :channel-id="formData.channelId"
      />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'
import ChannelSearchPicker from '../../components/channel-search-picker.vue'
import MaterialSearchPicker from '../../material/components/material-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const channelPickerRef = ref<InstanceType<typeof ChannelSearchPicker>>() // 频道选择器
const materialPickerRef = ref<InstanceType<typeof MaterialSearchPicker>>() // 素材选择器
const formData = reactive({
  channelId: undefined as number | undefined,
  materialId: undefined as number | undefined,
  sendTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.channelId !== undefined) {
    conditions.push(`频道:${channelPickerRef.value?.format(formData.channelId) || formData.channelId}`)
  }
  if (formData.materialId !== undefined) {
    conditions.push(`素材:${materialPickerRef.value?.format(formData.materialId) || formData.materialId}`)
  }
  if (formData.sendTime?.[0] && formData.sendTime?.[1]) {
    conditions.push(`发送时间:${formatDate(formData.sendTime[0])}~${formatDate(formData.sendTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索频道消息'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    channelId: formData.channelId,
    materialId: formData.materialId,
    sendTime: formatDateRange(formData.sendTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.channelId = undefined
  formData.materialId = undefined
  formData.sendTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
