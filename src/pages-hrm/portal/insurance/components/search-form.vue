<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-if="visible"
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          年份
        </view>
        <view
          class="min-h-72rpx flex items-center rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx text-[#333]"
          @click="yearVisible = true"
        >
          {{ yearText }}
        </view>
        <wd-datetime-picker
          v-model="formData.yearTime"
          v-model:visible="yearVisible"
          title="请选择年份"
          type="year"
          :min-date="minDate"
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
import dayjs from 'dayjs'
import { computed, reactive, ref, watch } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  year?: number // 当前筛选年份
  firstYear?: number // 首个参保年份，限制可选下限
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const yearVisible = ref(false) // 年份选择器显隐
const formData = reactive({
  yearTime: dayjs().startOf('year').valueOf() as number | string,
}) // 搜索表单数据

const yearText = computed(() => formatDate(formData.yearTime, 'YYYY') || '-')
const placeholder = computed(() => `年份:${yearText.value}`)
const minDate = computed(() => { // 早于首个参保年不可选；未加载前沿用组件默认下限
  if (props.firstYear == null) {
    return dayjs().subtract(10, 'year').startOf('year').valueOf()
  }
  return dayjs(`${props.firstYear}-01-01`).valueOf()
})

watch(
  () => props.year,
  (year) => {
    if (year == null) {
      return
    }
    formData.yearTime = dayjs(`${year}-01-01`).startOf('year').valueOf()
  },
  { immediate: true },
)

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    year: Number(formatDate(formData.yearTime, 'YYYY')),
  })
}

/** 重置按钮操作 */
function handleReset() {
  visible.value = false
  emit('reset')
}
</script>
