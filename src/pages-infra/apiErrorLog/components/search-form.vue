<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <wd-popup
    v-model="visible"
    position="top"
    @close="visible = false"
  >
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用户编号
        </view>
        <wd-input
          v-model="formData.userId"
          placeholder="请输入用户编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          应用名
        </view>
        <wd-input
          v-model="formData.applicationName"
          placeholder="请输入应用名"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处理状态
        </view>
        <wd-radio-group v-model="formData.processStatus" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="0">
            未处理
          </wd-radio>
          <wd-radio :value="1">
            已处理
          </wd-radio>
          <wd-radio :value="2">
            已忽略
          </wd-radio>
        </wd-radio-group>
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
  userId: undefined as number | undefined,
  applicationName: undefined as string | undefined,
  processStatus: -1, // -1 表示全部
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户编号:${formData.userId}`)
  }
  if (formData.applicationName) {
    conditions.push(`应用名:${formData.applicationName}`)
  }
  if (formData.processStatus !== -1) {
    const statusMap: Record<number, string> = { 0: '未处理', 1: '已处理', 2: '已忽略' }
    conditions.push(`状态:${statusMap[formData.processStatus]}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索日志'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    processStatus: formData.processStatus === -1 ? undefined : formData.processStatus,
  })
}

/** 重置 */
function handleReset() {
  formData.userId = undefined
  formData.applicationName = undefined
  formData.processStatus = -1
  visible.value = false
  emit('reset')
}
</script>
