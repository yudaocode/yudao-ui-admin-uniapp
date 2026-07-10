<!-- 商品选择器：单选，搜索商品名称，回写 spuId 给父组件 -->
<template>
  <view>
    <wd-form-item
      :title="label"
      :title-width="labelWidth"
      :prop="prop || undefined"
      :is-link="!disabled"
      :value="selectedName"
      :placeholder="placeholder"
      @click="openPicker"
    />

    <!-- 商品选择弹窗 -->
    <wd-popup
      v-model="pickerVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0; height: 70vh;"
      @close="pickerVisible = false"
    >
      <view class="h-70vh flex flex-col p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          选择商品
        </view>
        <wd-search v-model="keyword" placeholder="搜索商品名称" hide-cancel @search="() => {}" />
        <scroll-view class="mt-16rpx min-h-0 flex-1" scroll-y>
          <view
            v-for="item in filteredSpuList"
            :key="item.id"
            class="mb-12rpx flex items-center gap-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx"
            @click="handleSelect(item)"
          >
            <view v-if="item.picUrl" class="shrink-0">
              <wd-img :src="item.picUrl" width="80rpx" height="80rpx" radius="8rpx" mode="aspectFill" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333]">
                {{ item.name || `商品 #${item.id}` }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ formatDisplayMoney(item.price) }}
              </view>
            </view>
            <wd-icon v-if="item.id === modelValue" name="check" color="var(--wot-color-theme)" />
          </view>
          <view v-if="!filteredSpuList.length" class="py-48rpx text-center text-26rpx text-[#999]">
            暂无商品
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ProductSpu } from '@/api/mall/product/spu'
import { computed, ref, watch } from 'vue'
import { getSimpleProductSpuList } from '@/api/mall/product/spu'
import { formatDisplayMoney } from '@/utils/format'

const props = withDefaults(defineProps<{
  modelValue?: number // 已选商品编号
  label?: string // 字段标题
  labelWidth?: string // 标题宽度
  prop?: string // wd-form 校验字段名
  placeholder?: string // 未选择时占位
  disabled?: boolean // 是否禁用
}>(), {
  label: '',
  labelWidth: '200rpx',
  prop: '',
  placeholder: '请选择商品',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  'confirm': [spu: ProductSpu]
}>()

const pickerVisible = ref(false) // 弹窗显示状态
const keyword = ref('') // 搜索关键字
const spuList = ref<ProductSpu[]>([]) // 商品精简列表

const selectedName = computed(() => spuList.value.find(item => item.id === props.modelValue)?.name || (props.modelValue ? `商品 #${props.modelValue}` : '')) // 已选商品名

const filteredSpuList = computed(() => {
  const word = keyword.value.trim()
  if (!word) {
    return spuList.value
  }
  return spuList.value.filter(item => (item.name || '').includes(word))
})

/** 加载商品精简列表（仅一次） */
async function ensureSpuList() {
  if (!spuList.value.length) {
    spuList.value = await getSimpleProductSpuList()
  }
}

/** 打开弹窗 */
async function openPicker() {
  if (props.disabled) {
    return
  }
  await ensureSpuList()
  pickerVisible.value = true
}

/** 选中商品 */
function handleSelect(item: ProductSpu) {
  emit('update:modelValue', item.id)
  emit('confirm', item)
  pickerVisible.value = false
}

/** 回显：存在已选编号时预加载列表，触发器即显示商品名而非编号 */
watch(() => props.modelValue, (value) => {
  if (value) {
    ensureSpuList()
  }
}, { immediate: true })
</script>
