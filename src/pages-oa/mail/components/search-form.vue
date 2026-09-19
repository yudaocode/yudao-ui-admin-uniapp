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
          关键词
        </view>
        <wd-input
          v-model="formData.keyword"
          placeholder="搜索主题、发件人、收件人"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          阅读状态
        </view>
        <yd-search-picker
          v-model="formData.readStatus"
          :columns="readStatusColumns"
          all-option
          all-label="全部"
          placeholder="请选择阅读状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          附件
        </view>
        <yd-search-picker
          v-model="formData.hasAttach"
          :columns="attachColumns"
          all-option
          all-label="全部"
          placeholder="请选择附件条件"
        />
      </view>
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

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const readStatusColumns = [ // 阅读状态选项，布尔值以 0/1 承接
  { label: '未读', value: 0 },
  { label: '已读', value: 1 },
]
const attachColumns = [ // 附件条件选项
  { label: '有附件', value: 1 },
]
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  keyword: undefined as string | undefined,
  readStatus: undefined as number | undefined,
  hasAttach: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.keyword) {
    conditions.push(`关键词:${formData.keyword}`)
  }
  if (formData.readStatus !== undefined) {
    conditions.push(formData.readStatus === 0 ? '未读' : '已读')
  }
  if (formData.hasAttach !== undefined) {
    conditions.push('有附件')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索邮件'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    keyword: formData.keyword || undefined,
    readStatus: formData.readStatus === undefined ? undefined : formData.readStatus === 1,
    hasAttach: formData.hasAttach === undefined ? undefined : true,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.keyword = undefined
  formData.readStatus = undefined
  formData.hasAttach = undefined
  visible.value = false
  emit('reset')
}
</script>
