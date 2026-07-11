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
          客户编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入客户编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入客户名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户简称
        </view>
        <wd-input v-model="formData.nickname" placeholder="请输入客户简称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          英文名称
        </view>
        <wd-input v-model="formData.englishName" placeholder="请输入英文名称" clearable />
      </view>
      <yd-search-picker v-model="formData.type" label="客户类型" :dict-type="DICT_TYPE.MES_CLIENT_TYPE" all-option />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.COMMON_STATUS" all-option />
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
  nickname: undefined,
  englishName: undefined,
  type: undefined,
  status: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件展示文案
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.nickname) {
    conditions.push(`简称:${formData.nickname}`)
  }
  if (formData.englishName) {
    conditions.push(`英文:${formData.englishName}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_CLIENT_TYPE, formData.type)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索客户'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    nickname: formData.nickname || undefined,
    englishName: formData.englishName || undefined,
    type: formData.type,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.nickname = undefined
  formData.englishName = undefined
  formData.type = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
