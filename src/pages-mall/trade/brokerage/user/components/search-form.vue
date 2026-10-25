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
          推广员编号
        </view>
        <wd-input v-model="formData.bindUserId" type="number" placeholder="请输入推广员编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          推广资格
        </view>
        <wd-radio-group v-model="formData.brokerageEnabled" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="true">
            有资格
          </wd-radio>
          <wd-radio :value="false">
            无资格
          </wd-radio>
        </wd-radio-group>
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  bindUserId: undefined as string | undefined,
  brokerageEnabled: -1 as boolean | number,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.bindUserId) {
    conditions.push(`推广员:${formData.bindUserId}`)
  }
  if (formData.brokerageEnabled !== -1) {
    conditions.push(`资格:${formData.brokerageEnabled ? '有' : '无'}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索分销用户'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    bindUserId: formData.bindUserId ? parseId(formData.bindUserId) : undefined,
    brokerageEnabled: formData.brokerageEnabled === -1 ? undefined : formData.brokerageEnabled,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.bindUserId = undefined
  formData.brokerageEnabled = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
