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
          角色名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入角色名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          角色类别
        </view>
        <wd-input v-model="formData.category" placeholder="请输入角色类别" clearable />
      </view>
      <yd-search-picker v-model="formData.publicStatus" label="是否公开" :columns="publicStatusOptions" all-option />
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

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: undefined as string | undefined,
  category: undefined as string | undefined,
  publicStatus: undefined as boolean | undefined,
}) // 搜索表单数据
const publicStatusOptions = [ // 是否公开选项
  { label: '公开', value: true },
  { label: '不公开', value: false },
]

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`角色名称:${formData.name}`)
  }
  if (formData.category) {
    conditions.push(`类别:${formData.category}`)
  }
  if (formData.publicStatus !== undefined) {
    conditions.push(`公开:${formData.publicStatus ? '是' : '否'}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索聊天角色'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    category: formData.category || undefined,
    publicStatus: formData.publicStatus,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.category = undefined
  formData.publicStatus = undefined
  visible.value = false
  emit('reset')
}
</script>
