<!-- TODO @AI：参考 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages/message/components/search-form.vue 和 /Users/yunai/Java/yudao-ui-admin-uniapp-next-v4/src/pages/message/index.vue，实现对 time + 范围的处理； -->
<template>
  <!-- 搜索框入口 -->
  <wd-search
    :placeholder="searchPlaceholder"
    :hide-cancel="true"
    disabled
    @click="visible = true"
  />

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    custom-style="border-radius: 0 0 24rpx 24rpx;"
    safe-area-inset-top
    @close="visible = false"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        搜索操作日志
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          用户编号
        </view>
        <wd-input
          v-model="formData.userId"
          placeholder="请输入用户编号"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作模块类型
        </view>
        <wd-input
          v-model="formData.type"
          placeholder="请输入操作模块类型"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作名
        </view>
        <wd-input
          v-model="formData.subType"
          placeholder="请输入操作名"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作数据模块编号
        </view>
        <wd-input
          v-model="formData.bizId"
          placeholder="请输入操作数据模块编号"
          clearable
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          操作内容
        </view>
        <wd-input
          v-model="formData.action"
          placeholder="请输入操作内容"
          clearable
        />
      </view>
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          创建时间
        </view>
        <view class="flex items-center gap-16rpx">
          <view class="flex-1" @click="visibleCreateTime[0] = true">
            <view
              class="h-72rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] px-24rpx text-28rpx"
            >
              {{ formatDate(formData.createTime?.[0]) || '开始日期' }}
            </view>
          </view>
          <text class="text-28rpx text-[#999]">至</text>
          <view class="flex-1" @click="visibleCreateTime[1] = true">
            <view
              class="h-72rpx flex items-center justify-center rounded-8rpx bg-[#f5f5f5] px-24rpx text-28rpx"
            >
              {{ formatDate(formData.createTime?.[1]) || '结束日期' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view
          v-if="visibleCreateTime[0]"
          v-model="tempCreateTime[0]"
          type="date"
          :columns-height="200"
        />
        <view v-if="visibleCreateTime[0]" class="mt-16rpx flex justify-end gap-16rpx">
          <wd-button size="small" plain @click="handleCreateTime0Cancel">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime0Confirm">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view
          v-if="visibleCreateTime[1]"
          v-model="tempCreateTime[1]"
          type="date"
          :columns-height="200"
        />
        <view v-if="visibleCreateTime[1]" class="mt-16rpx flex justify-end gap-16rpx">
          <wd-button size="small" plain @click="handleCreateTime1Cancel">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleCreateTime1Confirm">
            确定
          </wd-button>
        </view>
      </view>
      <view class="w-full flex justify-center gap-24rpx">
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
import { computed, reactive, ref, watch } from 'vue'
import { formatDate } from '@/utils/date'

/** 搜索表单数据 */
export interface SearchFormData {
  userId?: number
  type?: string
  subType?: string
  bizId?: number
  action?: string
  createTime?: [number | undefined, number | undefined]
}

const props = defineProps<{
  searchParams?: Partial<SearchFormData>
}>()

const emit = defineEmits<{
  search: [data: SearchFormData]
  reset: []
}>()

const visible = ref(false)
const formData = reactive<SearchFormData>({
  userId: undefined,
  type: undefined,
  subType: undefined,
  bizId: undefined,
  action: undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})

/** 搜索条件 placeholder 拼接 */
const searchPlaceholder = computed(() => {
  const conditions: string[] = []
  if (props.searchParams?.userId !== undefined) {
    conditions.push(`用户编号:${props.searchParams.userId}`)
  }
  if (props.searchParams?.type) {
    conditions.push(`操作模块类型:${props.searchParams.type}`)
  }
  if (props.searchParams?.subType) {
    conditions.push(`操作名:${props.searchParams.subType}`)
  }
  if (props.searchParams?.bizId !== undefined) {
    conditions.push(`操作数据模块编号:${props.searchParams.bizId}`)
  }
  if (props.searchParams?.action) {
    conditions.push(`操作内容:${props.searchParams.action}`)
  }
  if (props.searchParams?.createTime?.[0] && props.searchParams?.createTime?.[1]) {
    conditions.push(`创建时间:${formatDate(props.searchParams.createTime[0])}~${formatDate(props.searchParams.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索操作日志'
})

/** 监听弹窗打开，同步外部参数 */
watch(visible, (val) => {
  if (val && props.searchParams) {
    formData.userId = props.searchParams.userId
    formData.type = props.searchParams.type
    formData.subType = props.searchParams.subType
    formData.bizId = props.searchParams.bizId
    formData.action = props.searchParams.action
    formData.createTime = props.searchParams.createTime ?? [undefined, undefined]
  }
})

// 时间范围选择器状态
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
  emit('search', { ...formData } as SearchFormData)
}

/** 重置 */
function handleReset() {
  formData.userId = undefined
  formData.type = undefined
  formData.subType = undefined
  formData.bizId = undefined
  formData.action = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
