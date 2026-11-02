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
          请求编号
        </view>
        <wd-input
          v-model="formData.requestId"
          placeholder="请输入请求编号"
          clearable
        />
      </view>
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <yd-search-picker v-model="formData.bizType" label="业务类型" :dict-type="DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE" all-option />
      <yd-search-picker v-model="formData.platform" label="平台" :dict-type="DICT_TYPE.AI_PLATFORM" dict-kind="str" all-option />
      <yd-search-picker
        v-model="formData.modelId"
        label="模型配置"
        :columns="modelList"
        label-key="name"
        value-key="id"
        all-option
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模型标识
        </view>
        <wd-input
          v-model="formData.model"
          placeholder="请输入模型标识"
          clearable
        />
      </view>
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.AI_REQUEST_LOG_STATUS" all-option />
      <yd-search-date-range v-model="formData.beginTime" label="开始时间" />
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
import type { AiModel } from '@/api/ai/model/model'
import { computed, onMounted, reactive, ref } from 'vue'
import { getModelSimpleList } from '@/api/ai/model/model'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { AiModelTypeEnum, DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 用户选择器引用
const modelList = ref<AiModel[]>([]) // 对话模型选项
const formData = reactive({
  requestId: undefined as string | undefined,
  userId: undefined as number | undefined,
  bizType: undefined as number | undefined,
  platform: undefined as string | undefined,
  modelId: undefined as number | undefined,
  model: undefined as string | undefined,
  status: undefined as number | undefined,
  beginTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.requestId) {
    conditions.push(`请求:${formData.requestId}`)
  }
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.bizType !== undefined) {
    conditions.push(`业务:${getDictLabel(DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE, formData.bizType)}`)
  }
  if (formData.platform) {
    conditions.push(`平台:${getDictLabel(DICT_TYPE.AI_PLATFORM, formData.platform) || formData.platform}`)
  }
  if (formData.modelId !== undefined) {
    conditions.push(`模型:${modelList.value.find(item => item.id === formData.modelId)?.name || formData.modelId}`)
  }
  if (formData.model) {
    conditions.push(`标识:${formData.model}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.AI_REQUEST_LOG_STATUS, formData.status)}`)
  }
  if (formData.beginTime[0] && formData.beginTime[1]) {
    conditions.push(`时间:${formatDate(formData.beginTime[0])}~${formatDate(formData.beginTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索请求日志'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    requestId: formData.requestId || undefined,
    userId: formData.userId,
    bizType: formData.bizType,
    platform: formData.platform || undefined,
    modelId: formData.modelId,
    model: formData.model || undefined,
    status: formData.status,
    beginTime: formatDateRange(formData.beginTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.requestId = undefined
  formData.userId = undefined
  formData.bizType = undefined
  formData.platform = undefined
  formData.modelId = undefined
  formData.model = undefined
  formData.status = undefined
  formData.beginTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 初始化模型选项 */
onMounted(async () => {
  modelList.value = await getModelSimpleList(AiModelTypeEnum.CHAT).catch(() => [])
})
</script>
