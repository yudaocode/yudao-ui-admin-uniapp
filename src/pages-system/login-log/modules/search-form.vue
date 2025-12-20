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
          用户名称
        </view>
        <wd-input
          v-model="formData.username"
          placeholder="请输入用户名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          登录地址
        </view>
        <wd-input
          v-model="formData.userIp"
          placeholder="请输入登录地址"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          登录时间
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
          <wd-button size="small" plain @click="visibleCreateTime[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view v-if="visibleCreateTime[1]" v-model="tempCreateTime[1]" type="date" />
        <view v-if="visibleCreateTime[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" plain @click="visibleCreateTime[1] = false">
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
}>()

const visible = ref(false)
const formData = reactive({
  username: undefined as string | undefined,
  userIp: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.username) {
    conditions.push(`用户名称:${formData.username}`)
  }
  if (formData.userIp) {
    conditions.push(`登录地址:${formData.userIp}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索登录日志'
})

// 时间范围选择器状态
const visibleCreateTime = ref<[boolean, boolean]>([false, false])
const tempCreateTime = ref<[number, number]>([Date.now(), Date.now()])

/** 登录时间[0]确认 */
function handleCreateTime0Confirm() {
  formData.createTime = [tempCreateTime.value[0], formData.createTime?.[1]]
  visibleCreateTime.value[0] = false
}

/** 登录时间[1]确认 */
function handleCreateTime1Confirm() {
  formData.createTime = [formData.createTime?.[0], tempCreateTime.value[1]]
  visibleCreateTime.value[1] = false
}

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    username: formData.username,
    userIp: formData.userIp,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置 */
function handleReset() {
  formData.username = undefined
  formData.userIp = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
