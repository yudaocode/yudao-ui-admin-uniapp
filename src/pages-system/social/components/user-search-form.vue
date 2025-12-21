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
          三方平台
        </view>
        <wd-radio-group v-model="formData.type" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
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
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          社交 openid
        </view>
        <wd-input
          v-model="formData.openid"
          placeholder="请输入社交 openid"
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getNavbarHeight } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  type: -1,
  nickname: undefined as string | undefined,
  openid: undefined as string | undefined,
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.type !== -1) {
    conditions.push(`平台:${getDictLabel(DICT_TYPE.SYSTEM_SOCIAL_TYPE, formData.type)}`)
  }
  if (formData.nickname) {
    conditions.push(`昵称:${formData.nickname}`)
  }
  if (formData.openid) {
    conditions.push(`openid:${formData.openid}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索三方用户'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    type: formData.type === -1 ? undefined : formData.type,
    nickname: formData.nickname || undefined,
    openid: formData.openid || undefined,
  })
}

/** 重置 */
function handleReset() {
  formData.type = -1
  formData.nickname = undefined
  formData.openid = undefined
  visible.value = false
  emit('reset')
}
</script>
