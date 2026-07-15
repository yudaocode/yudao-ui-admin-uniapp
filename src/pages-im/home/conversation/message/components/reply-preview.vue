<template>
  <view
    class="min-w-0 flex items-center gap-12rpx rounded-8rpx bg-black/5 px-16rpx py-10rpx text-24rpx text-[#666] leading-34rpx"
    :class="mirrored ? 'flex-row-reverse text-right' : ''"
    @click.stop="handleClick"
  >
    <text selectable class="min-w-0 flex-1">{{ title }}</text>
    <wd-icon v-if="closable" name="close" size="28rpx" @click.stop="emit('close')" />
  </view>
</template>

<script lang="ts" setup>
const props = defineProps<{
  title: string // 引用展示文案
  clickable?: boolean // 是否可定位原消息
  closable?: boolean // 是否可关闭引用
  mirrored?: boolean // 是否镜像到自己消息一侧
}>()

const emit = defineEmits<{
  locate: [] // 定位原消息
  close: [] // 清除引用
}>()

/** 点击引用预览 */
function handleClick() {
  if (props.clickable) {
    emit('locate')
  }
}
</script>
