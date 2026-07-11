<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 82vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择质检指标
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="检测项编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="检测项名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 质检指标列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无可选质检指标"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selected = item"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.code || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="item.type" />
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>检测工具：{{ item.tool || '-' }}</view>
              <view>
                结果值类型：
                <dict-tag v-if="item.resultType != null" :type="DICT_TYPE.MES_QC_RESULT_TYPE" :value="item.resultType" />
                <text v-else>-</text>
              </view>
              <view>结果值属性：{{ item.resultSpecification || '-' }}</view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { QcIndicator } from '@/api/mes/qc/indicator'
import { reactive, ref } from 'vue'
import { getIndicatorPage } from '@/api/mes/qc/indicator'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  confirm: [item: QcIndicator]
}>()

const visible = ref(false) // 弹层显示状态
const list = ref<QcIndicator[]>([]) // 指标列表
const selected = ref<QcIndicator>() // 当前选中
const pagingRef = ref<ZPagingRef<QcIndicator>>() // 分页组件引用
const pendingSelectedId = ref<number>() // 待回显编号
const queryParams = reactive<Record<string, any>>({ // 查询参数
  code: undefined,
  name: undefined,
})

/** 查询质检指标列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getIndicatorPage({
      ...queryParams,
      pageNo,
      pageSize,
    })
    if (pendingSelectedId.value != null && !selected.value) {
      selected.value = data.list.find(item => item.id === pendingSelectedId.value)
    }
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open(currentId?: number) {
  visible.value = true
  selected.value = undefined
  pendingSelectedId.value = currentId
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
  queryParams.code = undefined
  queryParams.name = undefined
  reload()
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
