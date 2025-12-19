<template>
  <!-- 搜索框入口 -->
  <view class="flex items-center bg-white pr-30rpx">
    <view class="flex-1" @click="visible = true">
      <wd-search :placeholder="placeholder" hide-cancel disabled />
    </view>
    <view class="text-28rpx text-[#1890ff]" @click="handleReadAll">
      全部已读
    </view>
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" @close="visible = false">
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          已读状态
        </view>
        <wd-radio-group v-model="formData.readStatus" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio :value="true">
            已读
          </wd-radio>
          <wd-radio :value="false">
            未读
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          发送时间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="visibleCreateTime[0] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.createTime?.[0]) || '开始日期' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="visibleCreateTime[1] = true">
            <view class="yd-search-form-date-range-picker">
              {{ formatDate(formData.createTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[0]" v-model="tempCreateTime[0]" type="date" />
        <view v-if="visibleCreateTime[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="handleCreateTime0Cancel">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[1]" v-model="tempCreateTime[1]" type="date" />
        <view v-if="visibleCreateTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="handleCreateTime1Cancel">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime1Confirm">
            确定
          </wd-button>
        </view>
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
import { getNavbarHeight } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
  readAll: []
}>()

const visible = ref(false)
const formData = reactive({
  readStatus: -1 as -1 | boolean, // -1 表示全部, true 已读, false 未读
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.readStatus === true) {
    conditions.push('已读')
  } else if (formData.readStatus === false) {
    conditions.push('未读')
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索消息'
})

/** 全部已读 */
function handleReadAll() {
  emit('readAll')
}

// 时间选择器状态
const visibleCreateTime = ref<[boolean, boolean]>([false, false])
const tempCreateTime = ref<[number, number]>([Date.now(), Date.now()])

/** 创建时间[0]确认 */
function handleCreateTime0Confirm() {
  formData.createTime = [tempCreateTime.value[0], formData.createTime?.[1]]
  visibleCreateTime.value[0] = false
}

/** 创建时间[0]取消 */
function handleCreateTime0Cancel() {
  visibleCreateTime.value[0] = false
}

/** 创建时间[1]确认 */
function handleCreateTime1Confirm() {
  formData.createTime = [formData.createTime?.[0], tempCreateTime.value[1]]
  visibleCreateTime.value[1] = false
}

/** 创建时间[1]取消 */
function handleCreateTime1Cancel() {
  visibleCreateTime.value[1] = false
}

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    readStatus: formData.readStatus === -1 ? undefined : formData.readStatus,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置 */
function handleReset() {
  formData.readStatus = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
