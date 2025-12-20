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
          短信签名
        </view>
        <wd-input
          v-model="formData.signature"
          placeholder="请输入短信签名"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          渠道编码
        </view>
        <wd-radio-group v-model="formData.code" shape="button">
          <wd-radio value="">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getStrDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <!-- TODO @AI：缺了“创建时间” -->
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
import { getDictLabel, getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { getNavbarHeight } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  signature: undefined as string | undefined,
  code: '',
  status: -1,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.signature) {
    conditions.push(`签名:${formData.signature}`)
  }
  if (formData.code) {
    conditions.push(`渠道:${getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, formData.code)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索短信渠道'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    signature: formData.signature || undefined,
    code: formData.code || undefined,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置 */
function handleReset() {
  formData.signature = undefined
  formData.code = ''
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
