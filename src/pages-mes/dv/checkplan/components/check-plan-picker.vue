<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="方案编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="方案名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 点检方案列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选方案"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="handleSelect(item)"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.name || item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view class="flex items-center">
                <text class="mr-8rpx text-[#999]">方案类型：</text>
                <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.type" />
                <text v-else>-</text>
              </view>
              <view>周期：{{ item.cycleCount ?? '-' }} / {{ getDictLabel(DICT_TYPE.MES_DV_CYCLE_TYPE, item.cycleType) || '-' }}</view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import { ref } from 'vue'
import { getCheckPlanPage } from '@/api/mes/dv/checkplan'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE, MesDvCheckPlanStatusEnum, MesDvSubjectTypeEnum } from '@/utils/constants'

const props = withDefaults(defineProps<{
  title?: string
  type?: number
  status?: number
}>(), {
  title: '选择点检方案',
  type: MesDvSubjectTypeEnum.CHECK,
  status: MesDvCheckPlanStatusEnum.ENABLED,
})

const emit = defineEmits<{
  confirm: [item: DvCheckPlan]
}>()

const visible = ref(false) // 弹层显示状态
const list = ref<DvCheckPlan[]>([]) // 方案列表
const selected = ref<DvCheckPlan>() // 当前选择方案
const pagingRef = ref<ZPagingRef<DvCheckPlan>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  name: '',
})

/** 选择方案 */
function handleSelect(item: DvCheckPlan) {
  selected.value = item
}

/** 查询方案列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCheckPlanPage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      type: props.type,
      status: props.status,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  selected.value = undefined
  queryParams.value = {
    code: '',
    name: '',
  }
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    code: '',
    name: '',
  }
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selected.value = undefined
  queryParams.value = {
    code: '',
    name: '',
  }
}

/** 确认选择 */
function handleConfirm() {
  if (!selected.value) {
    return
  }
  emit('confirm', selected.value)
  visible.value = false
}

defineExpose({ open })
</script>
