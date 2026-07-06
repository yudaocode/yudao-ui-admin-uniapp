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
          选择呼叫原因
        </view>
        <wd-button size="small" type="primary" :disabled="!selected" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="keyword" placeholder="搜索呼叫原因" clearable @confirm="handleSearch" />
      </view>

      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <view class="p-24rpx">
          <view
            v-for="item in filteredList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="selected?.id === item.id ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selected = item"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.reason || '-' }}
              </view>
              <dict-tag v-if="item.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="item.level" />
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>处置角色：{{ item.handlerRoleName || '-' }}</view>
              <view>处置人：{{ item.handlerUserNickname || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>

          <view v-if="filteredList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无安灯配置" />
            <view class="mt-24rpx flex justify-center">
              <wd-button size="small" type="primary" variant="plain" @click="handleConfigManage">
                去维护安灯配置
              </wd-button>
            </view>
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
import type { ProAndonConfig } from '@/api/mes/pro/andon/config'
import { computed, ref, watch } from 'vue'
import { getAndonConfig, getAndonConfigList } from '@/api/mes/pro/andon/config'
import { DICT_TYPE } from '@/utils/constants'

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
  'change': [item: ProAndonConfig | undefined]
  'confirm': [item: ProAndonConfig]
  'clear': []
}>()

const visible = ref(false) // 弹层显示状态
const loading = ref(false) // 列表加载状态
const list = ref<ProAndonConfig[]>([]) // 配置列表
const keyword = ref('') // 搜索关键字
const selectedItem = ref<ProAndonConfig>() // 当前选中配置
const selected = ref<ProAndonConfig>() // 当前选中
const canClear = computed(() => Boolean(selected.value || selectedItem.value || props.modelValue != null)) // 是否可清空
const filteredList = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  if (!word) {
    return list.value
  }
  return list.value.filter(item => item.reason?.toLowerCase().includes(word))
})

/** 打开选择器 */
async function open(currentId?: number) {
  if (props.disabled) {
    return
  }
  const selectedId = currentId ?? props.modelValue
  visible.value = true
  keyword.value = ''
  selected.value = selectedItem.value
  await loadList()
  selected.value = list.value.find(item => item.id === selectedId)
  if (selectedId && !selected.value) {
    await resolveItemById(selectedId)
    selected.value = selectedItem.value
  }
}

/** 加载配置列表 */
async function loadList() {
  loading.value = true
  try {
    list.value = await getAndonConfigList()
  } finally {
    loading.value = false
  }
}

/** 根据编号加载配置回显 */
async function resolveItemById(id?: number) {
  if (id == null) {
    selectedItem.value = undefined
    return
  }
  if (selectedItem.value?.id === id) {
    return
  }
  try {
    selectedItem.value = await getAndonConfig(id)
  } catch {
    selectedItem.value = undefined
  }
}

/** 搜索 */
function handleSearch() {
  selected.value = undefined
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

/** 跳转配置维护 */
function handleConfigManage() {
  visible.value = false
  uni.navigateTo({ url: '/pages-mes/pro/andon/config/index' })
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
