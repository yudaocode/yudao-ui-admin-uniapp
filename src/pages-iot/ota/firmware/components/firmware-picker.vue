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
        <view class="flex items-center gap-12rpx">
          <wd-button variant="plain" size="small" @click="handleCancel">
            取消
          </wd-button>
          <wd-button v-if="clearable" variant="plain" size="small" :disabled="!canClear" @click="handleClear">
            清空
          </wd-button>
        </view>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.name" placeholder="请输入固件名称" clearable />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 固件列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无固件数据"
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
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <wd-tag v-if="selected?.id === item.id" type="primary" variant="plain">
                已选
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>版本号：{{ item.version || '-' }}</view>
              <view>所属产品：{{ item.productName || item.productId || '-' }}</view>
            </view>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import { computed, ref } from 'vue'
import { getOtaFirmwarePage } from '@/api/iot/ota/firmware'

const props = withDefaults(defineProps<{
  title?: string
  clearable?: boolean
}>(), {
  title: '选择升级固件',
  clearable: false,
})

const emit = defineEmits<{
  confirm: [item: OtaFirmware]
  clear: []
}>()

const visible = ref(false) // 弹窗显示状态
const list = ref<OtaFirmware[]>([]) // 固件列表
const selected = ref<OtaFirmware>() // 当前选择固件
const currentId = ref<number>() // 当前固件编号
const pagingRef = ref<ZPagingRef<OtaFirmware>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  name: '',
})
const canClear = computed(() => selected.value != null || currentId.value != null) // 是否可清空

/** 查询固件列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOtaFirmwarePage({
      pageNo,
      pageSize,
      name: queryParams.value.name || undefined,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open(current?: OtaFirmware, selectedId?: number) {
  visible.value = true
  selected.value = current
  currentId.value = selectedId
  queryParams.value = {
    name: '',
  }
  pagingRef.value?.reload()
}

/** 选择固件 */
function handleSelect(item: OtaFirmware) {
  selected.value = item
}

/** 搜索按钮操作 */
function handleQuery() {
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    name: '',
  }
  handleQuery()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 清空固件 */
function handleClear() {
  selected.value = undefined
  currentId.value = undefined
  emit('clear')
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  selected.value = undefined
  currentId.value = undefined
  queryParams.value = {
    name: '',
  }
}

/** 确认选择 */
function handleConfirm() {
  if (!selected.value || selected.value.id == null) {
    return
  }
  emit('confirm', selected.value)
  visible.value = false
}

defineExpose({ open })
</script>
