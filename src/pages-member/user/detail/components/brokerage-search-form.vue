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
      <yd-search-picker v-model="formData.level" label="推广层级" :columns="levelOptions" all-option />
      <yd-search-date-range v-model="formData.bindUserTime" label="绑定时间" />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const levelOptions = [ // 推广层级选项
  { label: '一级', value: '1' },
  { label: '二级', value: '2' },
]
const formData = reactive({
  level: undefined as string | undefined,
  bindUserTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.level !== undefined) {
    conditions.push(`层级:${formData.level === '1' ? '一级' : '二级'}`)
  }
  if (formData.bindUserTime[0] && formData.bindUserTime[1]) {
    conditions.push(`绑定:${formatDate(formData.bindUserTime[0])}~${formatDate(formData.bindUserTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索推广用户'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    level: formData.level,
    bindUserTime: formatDateRange(formData.bindUserTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.level = undefined
  formData.bindUserTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
