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
          标题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入讨论标题"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          讨论类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_DISCUSSION_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择讨论类型"
        />
      </view>
      <view v-if="showUser" class="yd-search-form-item">
        <view class="yd-search-form-label">
          发布人
        </view>
        <UserSearchPicker v-model="formData.userId" placeholder="请选择发布人" />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="发布时间" />
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
import { UserSearchPicker } from '@/components/system-select'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

defineProps<{
  showUser?: boolean // 是否显示发布人筛选
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  title: undefined as string | undefined,
  type: undefined as number | undefined,
  userId: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.OA_DISCUSSION_TYPE, formData.type)}`)
  }
  if (formData.userId) {
    conditions.push('已选发布人')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索讨论'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    title: formData.title || undefined,
    type: formData.type,
    userId: formData.userId,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.title = undefined
  formData.type = undefined
  formData.userId = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
