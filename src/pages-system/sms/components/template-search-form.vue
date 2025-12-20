<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" @close="visible = false">
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
      <!-- TODO @AI：参考 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/system/sms/template/data.ts 很多搜搜项，没搞过来 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模板名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入模板名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模板编码
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入模板编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          短信类型
        </view>
        <wd-radio-group v-model="formData.type" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          开启状态
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
  code: undefined as string | undefined,
  type: -1,
  status: -1,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE, formData.type)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索短信模板'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    code: formData.code || undefined,
    type: formData.type === -1 ? undefined : formData.type,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置 */
function handleReset() {
  formData.name = undefined
  formData.code = undefined
  formData.type = -1
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
