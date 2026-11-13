<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col overflow-hidden bg-[#f5f5f5]">
      <!-- 标题 -->
      <view class="shrink-0 bg-white px-28rpx py-24rpx">
        <view class="flex items-center justify-between gap-16rpx">
          <text class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
            移动「{{ node?.name }}」到
          </text>
          <wd-icon name="close" size="36rpx" color="#666" @click="visible = false" />
        </view>
      </view>

      <!-- 目录列表 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx">
          <view
            v-for="item in options"
            :key="item.id"
            class="mb-16rpx flex items-center gap-16rpx rounded-12rpx bg-white px-24rpx py-22rpx"
            :class="item.id === node?.parentId ? 'opacity-50' : ''"
            @click="handleSelect(item.id)"
          >
            <view class="min-w-0 flex flex-1 items-center gap-12rpx" :style="{ paddingLeft: `${item.depth * 32}rpx` }">
              <wd-icon name="folder" size="32rpx" color="#faad14" />
              <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ item.name }}</text>
              <text v-if="item.id === node?.parentId" class="shrink-0 text-22rpx text-[#999]">当前位置</text>
            </view>
            <wd-icon v-if="selectedId === item.id" name="check" size="32rpx" color="#1677ff" />
          </view>
        </view>
      </scroll-view>

      <!-- 底部确认按钮 -->
      <view class="shrink-0 bg-white p-24rpx">
        <wd-button type="primary" block :disabled="selectedId === undefined" @click="handleConfirm">
          确定移动
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { SkillFile } from '@/api/ai/skill'
import { computed, ref, watch } from 'vue'
import { AiSkillFileTypeEnum } from '@/utils/constants'

const props = defineProps<{
  files: SkillFile[] // 技能的全部节点（扁平）
  node?: SkillFile // 待移动的节点
}>()

const emit = defineEmits<{
  confirm: [parentId: number]
}>()

const visible = defineModel<boolean>({ default: false })
const selectedId = ref<number>() // 选中的目标目录编号

const options = computed(() => { // 目标目录：根目录 + 全部目录，排除节点自身及其子孙
  const result = [{ id: 0, name: '根目录', depth: 0 }]
  const directories = props.files.filter(item => item.type === AiSkillFileTypeEnum.DIRECTORY)
  const walk = (parentId: number, depth: number) => {
    for (const item of directories) {
      // 跳过自身，其子孙目录也不会再被遍历到
      if (item.parentId !== parentId || item.id === props.node?.id) {
        continue
      }
      result.push({ id: item.id, name: item.name, depth })
      walk(item.id, depth + 1)
    }
  }
  walk(0, 1)
  return result
})

/** 每次打开时，重置选中的目录 */
watch(visible, (value) => {
  if (value) {
    selectedId.value = undefined
  }
})

/** 选择目录：当前所在目录不可选 */
function handleSelect(id: number) {
  if (id === props.node?.parentId) {
    return
  }
  selectedId.value = id
}

/** 确认移动 */
function handleConfirm() {
  if (selectedId.value === undefined) {
    return
  }
  visible.value = false
  emit('confirm', selectedId.value)
}
</script>
