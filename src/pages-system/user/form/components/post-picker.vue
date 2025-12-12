<!-- TODO @芋艿：【优化】看看后续要不要抽成组件！ -->
<template>
  <!-- 岗位选择单元格 -->
  <wd-cell title="岗位" title-width="180rpx" is-link @click="popupVisible = true">
    <view class="text-left">
      {{ displayText }}
    </view>
  </wd-cell>

  <!-- 岗位选择弹窗 -->
  <wd-popup v-model="popupVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-32rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">选择岗位</text>
        <wd-icon name="close" size="20px" @click="popupVisible = false" />
      </view>
      <wd-checkbox-group v-model="selectedIds" cell shape="button">
        <wd-checkbox v-for="item in postList" :key="item.id" :model-value="item.id">
          {{ item.name }}
        </wd-checkbox>
      </wd-checkbox-group>
      <view class="mt-32rpx">
        <wd-button type="primary" block @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Post } from '@/api/system/post'
import { computed, onMounted, ref, watch } from 'vue'
import { getSimplePostList } from '@/api/system/post'

const props = defineProps<{
  modelValue?: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const popupVisible = ref(false)
const postList = ref<Post[]>([])
const selectedIds = ref<number[]>([])

const displayText = computed(() => {
  if (!selectedIds.value || selectedIds.value.length === 0) {
    return ''
  }
  return postList.value
    .filter(item => selectedIds.value.includes(item.id))
    .map(item => item.name)
    .join('、')
}) // 显示文本

/** 监听外部值变化 */
watch(
  () => props.modelValue,
  (val) => {
    selectedIds.value = val || []
  },
  { immediate: true },
)

/** 加载岗位列表 */
async function loadPostList() {
  postList.value = await getSimplePostList()
}

/** 确认选择 */
function handleConfirm() {
  emit('update:modelValue', selectedIds.value)
  popupVisible.value = false
}

/** 初始化 */
onMounted(() => {
  loadPostList()
})
</script>
