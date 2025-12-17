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
        搜索任务
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          任务名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入任务名称"
          clearable
        />
      </view>
      <view v-if="processDefinitionList.length > 0" class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          所属流程
        </view>
        <wd-picker
          v-model="formData.processDefinitionKey"
          :columns="processDefinitionList"
          label-key="name"
          value-key="key"
          label=""
        />
      </view>
      <view v-if="categoryList.length > 0" class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          流程分类
        </view>
        <wd-picker
          v-model="formData.category"
          :columns="categoryList"
          label-key="name"
          value-key="code"
          label=""
        />
      </view>
      <view class="mb-24rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          审批状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.BPM_TASK_STATUS)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <!-- DONE @AI：时时间范围，参考下 /Users/yunai/Java/yudao-ui-admin-uniapp-next/src/pages/message/components/search-form.vue -->
      <view class="mb-32rpx">
        <view class="mb-12rpx text-28rpx text-[#666]">
          发起时间
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
import type { Category } from '@/api/bpm/category'
import type { ProcessDefinition } from '@/api/bpm/definition'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getCategorySimpleList } from '@/api/bpm/category'
import { getProcessDefinitionList } from '@/api/bpm/definition'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'

/** 搜索表单数据 */
export interface DoneSearchFormData {
  name?: string
  processDefinitionKey?: string
  category?: string
  status: number // -1 表示全部
  createTime?: [number | undefined, number | undefined]
}

const props = defineProps<{
  searchParams?: Partial<DoneSearchFormData>
}>()

const emit = defineEmits<{
  search: [data: DoneSearchFormData]
  reset: []
}>()

const visible = ref(false)
const formData = reactive<DoneSearchFormData>({
  name: undefined,
  processDefinitionKey: undefined,
  category: undefined,
  status: -1,
  createTime: [undefined, undefined],
})

/** 搜索条件 placeholder 拼接 */
const searchPlaceholder = computed(() => {
  const conditions: string[] = []
  if (props.searchParams?.name) {
    conditions.push(`名称:${props.searchParams.name}`)
  }
  if (props.searchParams?.status !== undefined && props.searchParams.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.BPM_TASK_STATUS, props.searchParams.status)}`)
  }
  if (props.searchParams?.createTime?.[0] && props.searchParams?.createTime?.[1]) {
    conditions.push(`时间:${formatDate(props.searchParams.createTime[0])}~${formatDate(props.searchParams.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索已办任务'
})

const categoryList = ref<Category[]>([])
const processDefinitionList = ref<ProcessDefinition[]>([])

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

/** 获取流程分类列表 */
async function getCategoryList() {
  try {
    categoryList.value = await getCategorySimpleList()
  } catch (error) {
    console.error('获取流程分类失败:', error)
  }
}

/** 获取流程定义列表 */
async function getProcessDefinitions() {
  try {
    processDefinitionList.value = await getProcessDefinitionList({ suspensionState: 1 })
  } catch (error) {
    console.error('获取流程定义失败:', error)
  }
}

/** 监听弹窗打开，同步外部参数 */
watch(visible, (val) => {
  if (val && props.searchParams) {
    formData.name = props.searchParams.name
    formData.processDefinitionKey = props.searchParams.processDefinitionKey
    formData.category = props.searchParams.category
    formData.status = props.searchParams.status ?? -1
    formData.createTime = props.searchParams.createTime ?? [undefined, undefined]
  }
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置 */
function handleReset() {
  formData.name = undefined
  formData.processDefinitionKey = undefined
  formData.category = undefined
  formData.status = -1
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  getCategoryList()
  getProcessDefinitions()
})
</script>
