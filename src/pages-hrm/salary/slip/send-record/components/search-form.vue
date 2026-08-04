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
          工资月份
        </view>
        <view
          class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx"
          @click="monthVisible = true"
        >
          <text class="min-w-0 flex-1 truncate text-[#333]">
            {{ monthText }}
          </text>
          <wd-icon
            v-if="formData.month"
            name="close-circle-filled"
            size="32rpx"
            color="#c8c9cc"
            @click.stop="formData.month = ''"
          />
          <wd-icon name="arrow-right" size="32rpx" color="#666" />
        </view>
        <wd-datetime-picker
          v-model="formData.month"
          v-model:visible="monthVisible"
          title="请选择工资月份"
          type="year-month"
        />
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
import { computed, reactive, ref } from 'vue'
import { getAttendanceYearMonth } from '@/pages-hrm/utils/format'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const monthVisible = ref(false) // 月份选择器显隐
const formData = reactive({
  month: Date.now() as number | string,
}) // 搜索表单数据

const monthText = computed(() => {
  if (!formData.month) {
    return '全部'
  }
  return formatDate(formData.month, 'YYYY-MM') || '-'
})
const placeholder = computed(() => `工资月份:${monthText.value}`)

/** 组装搜索参数 */
function buildSearchData() {
  if (!formData.month) {
    return {
      year: undefined,
      month: undefined,
    }
  }
  return getAttendanceYearMonth(formData.month)
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildSearchData())
}

/** 重置按钮操作 */
function handleReset() {
  formData.month = Date.now()
  visible.value = false
  emit('reset')
}
</script>
