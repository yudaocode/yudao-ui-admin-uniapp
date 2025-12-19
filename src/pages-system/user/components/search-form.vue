<template>
  <!-- 搜索框入口 -->
  <wd-search
    :placeholder="placeholder"
    :hide-cancel="true"
    disabled
    @click="visible = true"
  />

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    custom-style="border-radius: var(--yd-search-form-popup-radius);"
    safe-area-inset-top
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-title">
        搜索用户
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户名称
        </view>
        <wd-input
          v-model="formData.username"
          placeholder="请输入用户名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户昵称
        </view>
        <wd-input
          v-model="formData.nickname"
          placeholder="请输入用户昵称"
          clearable
        />
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" plain @click="handleReset">
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

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  username: undefined as string | undefined,
  nickname: undefined as string | undefined,
})

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.username) {
    conditions.push(`用户名:${formData.username}`)
  }
  if (formData.nickname) {
    conditions.push(`昵称:${formData.nickname}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索用户'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置 */
function handleReset() {
  formData.username = undefined
  formData.nickname = undefined
  visible.value = false
  emit('reset')
}
</script>
