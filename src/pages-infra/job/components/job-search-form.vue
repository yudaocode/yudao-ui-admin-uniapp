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
          任务名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入任务名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          处理器名称
        </view>
        <wd-input
          v-model="formData.handlerName"
          placeholder="请输入处理器名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          任务状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.INFRA_JOB_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getNavbarHeight } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  name: undefined as string | undefined,
  handlerName: undefined as string | undefined,
  status: -1, // -1 表示全部
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`任务名称:${formData.name}`)
  }
  if (formData.handlerName) {
    conditions.push(`处理器:${formData.handlerName}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.INFRA_JOB_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索定时任务'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    handlerName: formData.handlerName || undefined,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置 */
function handleReset() {
  formData.name = undefined
  formData.handlerName = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
