<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" @close="visible = false">
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          邮箱
        </view>
        <wd-input
          v-model="formData.mail"
          placeholder="请输入邮箱"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户名
        </view>
        <wd-input
          v-model="formData.username"
          placeholder="请输入用户名"
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
import { getNavbarHeight } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  mail: undefined as string | undefined,
  username: undefined as string | undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.mail) {
    conditions.push(`邮箱:${formData.mail}`)
  }
  if (formData.username) {
    conditions.push(`用户名:${formData.username}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索邮箱账号'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    mail: formData.mail || undefined,
    username: formData.username || undefined,
  })
}

/** 重置 */
function handleReset() {
  formData.mail = undefined
  formData.username = undefined
  visible.value = false
  emit('reset')
}
</script>
