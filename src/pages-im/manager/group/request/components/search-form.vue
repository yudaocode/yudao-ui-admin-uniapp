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
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="申请人" placeholder="请选择申请人" />
      <UserSearchPicker ref="inviterPickerRef" v-model="formData.inviterUserId" label="邀请人" placeholder="请选择邀请人" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处理结果
        </view>
        <wd-radio-group v-model="formData.handleResult" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          加入来源
        </view>
        <wd-radio-group v-model="formData.addSource" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_ADD_SOURCE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<any>() // 申请人选择器引用
const inviterPickerRef = ref<any>() // 邀请人选择器引用
const formData = reactive({
  groupId: undefined as string | undefined,
  userId: undefined as number | undefined,
  inviterUserId: undefined as number | undefined,
  handleResult: -1, // -1 表示全部
  addSource: -1, // -1 表示全部
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.groupId) {
    conditions.push(`群:${formData.groupId}`)
  }
  if (formData.userId) {
    conditions.push(`申请人:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.inviterUserId) {
    conditions.push(`邀请人:${inviterPickerRef.value?.format(formData.inviterUserId) || formData.inviterUserId}`)
  }
  if (formData.handleResult !== -1) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT, formData.handleResult)}`)
  }
  if (formData.addSource !== -1) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.IM_GROUP_ADD_SOURCE, formData.addSource)}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`申请时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索加群申请'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    groupId: formData.groupId,
    userId: formData.userId,
    inviterUserId: formData.inviterUserId,
    handleResult: formData.handleResult === -1 ? undefined : formData.handleResult,
    addSource: formData.addSource === -1 ? undefined : formData.addSource,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.groupId = undefined
  formData.userId = undefined
  formData.inviterUserId = undefined
  formData.handleResult = -1
  formData.addSource = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
