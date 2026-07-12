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
          提示词
        </view>
        <wd-input
          v-model="formData.prompt"
          placeholder="请输入提示词"
          clearable
        />
      </view>
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <yd-search-picker v-model="formData.platform" label="平台" :dict-type="DICT_TYPE.AI_PLATFORM" dict-kind="str" all-option />
      <yd-search-picker v-model="formData.status" label="绘画状态" :dict-type="DICT_TYPE.AI_IMAGE_STATUS" all-option />
      <yd-search-picker v-model="formData.publicStatus" label="是否发布" :columns="publicStatusOptions" all-option />
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
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 用户选择器引用
const formData = reactive({
  prompt: undefined as string | undefined,
  userId: undefined as number | undefined,
  platform: undefined as string | undefined,
  status: undefined as number | undefined,
  publicStatus: undefined as boolean | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const publicStatusOptions = [ // 是否发布选项
  { label: '已发布', value: true },
  { label: '未发布', value: false },
]
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.prompt) {
    conditions.push(`提示词:${formData.prompt}`)
  }
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.platform) {
    conditions.push(`平台:${getDictLabel(DICT_TYPE.AI_PLATFORM, formData.platform)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.AI_IMAGE_STATUS, formData.status)}`)
  }
  if (formData.publicStatus !== undefined) {
    conditions.push(`发布:${formData.publicStatus ? '是' : '否'}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索绘图记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    prompt: formData.prompt || undefined,
    userId: formData.userId,
    platform: formData.platform,
    status: formData.status,
    publicStatus: formData.publicStatus,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.prompt = undefined
  formData.userId = undefined
  formData.platform = undefined
  formData.status = undefined
  formData.publicStatus = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
