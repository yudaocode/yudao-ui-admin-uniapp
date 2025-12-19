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
        搜索菜单
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          菜单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入菜单名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          菜单状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
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
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  name: undefined as string | undefined,
  status: undefined as number | undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.status !== undefined) {
    const dict = getIntDictOptions(DICT_TYPE.COMMON_STATUS).find(d => d.value === formData.status)
    if (dict) {
      conditions.push(`状态:${dict.label}`)
    }
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索菜单'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置 */
function handleReset() {
  formData.name = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
