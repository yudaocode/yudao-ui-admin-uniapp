<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <view class="flex items-center gap-12rpx">
          <wd-button variant="plain" size="small" @click="visible = false">
            取消
          </wd-button>
          <wd-button v-if="props.clearable" variant="plain" size="small" :disabled="!canClear" @click="handleClear">
            清空
          </wd-button>
        </view>
        <view class="text-32rpx text-[#333] font-semibold">
          选择工序
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="query.code" placeholder="工序编码" clearable />
        <wd-input v-model="query.name" placeholder="工序名称" clearable class="mt-12rpx" />
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
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
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view v-if="item.attention" class="text-26rpx text-[#666]">
              工序说明：{{ item.attention }}
            </view>
          </view>

          <view v-if="list.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选工序" />
          </view>
          <view v-if="loading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ProProcess } from '@/api/mes/pro/process'
import { computed, reactive, ref, watch } from 'vue'
import { getProcess, getProcessPage } from '@/api/mes/pro/process'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  modelValue?: number
  disabled?: boolean
  clearable?: boolean
}>(), {
  disabled: false,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'change': [item: ProProcess | undefined]
  'confirm': [item: ProProcess]
  'clear': []
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 列表加载状态
const list = ref<ProProcess[]>([]) // 工序列表
const selectedItem = ref<ProProcess>() // 当前选中工序
const selected = ref<ProProcess>() // 当前选中
const pageNo = ref(1) // 当前页码
const total = ref(0) // 总条数
const query = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
})
const canClear = computed(() => Boolean(selected.value || selectedItem.value || props.modelValue != null)) // 是否可清空

/** 打开选择器 */
async function open(currentId?: number) {
  if (props.disabled) {
    return
  }
  const selectedId = currentId ?? props.modelValue
  visible.value = true
  selected.value = selectedItem.value
  pageNo.value = 1
  total.value = 0
  list.value = []
  await loadList(false, selectedId)
  if (selectedId && !selected.value) {
    await resolveItemById(selectedId)
    selected.value = selectedItem.value
  }
}

/** 加载工序列表 */
async function loadList(append = false, selectedId?: number) {
  if (loading.value) {
    return
  }
  loading.value = true
  try {
    const data = await getProcessPage({
      ...query,
      pageNo: pageNo.value,
      pageSize: 20,
      status: CommonStatusEnum.ENABLE,
    })
    if (append) {
      list.value.push(...data.list)
    } else {
      list.value = data.list
    }
    total.value = data.total
    if (selectedId && !selected.value) {
      selected.value = list.value.find(item => item.id === selectedId)
    }
  } finally {
    loading.value = false
  }
}

/** 根据编号加载工序回显 */
async function resolveItemById(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getProcess(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 搜索 */
function handleSearch() {
  pageNo.value = 1
  loadList()
}

/** 重置 */
function handleReset() {
  query.code = undefined
  query.name = undefined
  pageNo.value = 1
  loadList()
}

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || list.value.length >= total.value) {
    return
  }
  pageNo.value += 1
  await loadList(true)
}

/** 清空选择 */
function handleClear() {
  selected.value = undefined
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
  emit('clear')
  visible.value = false
}

/** 确认选择 */
function handleConfirm() {
  if (!selected.value) {
    return
  }
  selectedItem.value = selected.value
  emit('update:modelValue', selected.value.id)
  emit('change', selected.value)
  emit('confirm', selected.value)
  visible.value = false
}

/** 同步外部绑定值 */
watch(
  () => props.modelValue,
  (value) => {
    resolveItemById(value)
  },
  { immediate: true },
)

defineExpose({ open, clear: handleClear, selectedItem })
</script>
