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
          钱包编号
        </view>
        <wd-input v-model="formData.walletId" type="number" placeholder="请输入钱包编号" clearable />
      </view>
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
import { parseId } from '@/utils/id'

import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const props = defineProps<{
  defaultWalletId?: number | any
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  walletId: props.defaultWalletId != null && props.defaultWalletId !== '' ? String(props.defaultWalletId) : undefined as string | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.walletId) {
    conditions.push(`钱包:${formData.walletId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索钱包流水'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    walletId: formData.walletId ? parseId(formData.walletId) : undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.walletId = undefined
  visible.value = false
  emit('reset')
}
</script>
