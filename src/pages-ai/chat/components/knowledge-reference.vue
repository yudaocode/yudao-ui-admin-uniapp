<template>
  <view v-if="documents.length" class="mt-20rpx rounded-20rpx bg-[#f5f5f5] px-22rpx py-18rpx">
    <view class="mb-12rpx flex items-center gap-8rpx text-25rpx text-[#333] font-medium">
      <wd-icon name="file" size="28rpx" color="#1677ff" />
      <text>知识引用</text>
    </view>
    <view class="flex flex-wrap gap-12rpx">
      <view
        v-for="document in documents"
        :key="document.id"
        class="rounded-14rpx bg-white px-16rpx py-12rpx text-24rpx text-[#333]"
        @click="handleOpen(document)"
      >
        {{ document.title }}
        <text class="ml-6rpx text-21rpx text-[#999]">{{ document.segments.length }} 条</text>
      </view>
    </view>

    <wd-popup
      v-model="visible"
      position="bottom"
      root-portal
      custom-style="height: 66vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col overflow-hidden bg-white">
        <view class="flex shrink-0 items-center justify-between border-b border-[#eee] px-28rpx py-24rpx">
          <view class="min-w-0 flex-1 truncate text-31rpx text-[#333] font-semibold">
            {{ selectedDocument?.title }}
          </view>
          <wd-icon name="close" size="36rpx" color="#666" @click="visible = false" />
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1 px-28rpx py-12rpx">
          <view
            v-for="segment in selectedDocument?.segments"
            :key="segment.id"
            class="border-b border-[#eee] py-22rpx last:border-b-0"
          >
            <view class="mb-12rpx inline-flex rounded-8rpx bg-[#f5f5f5] px-12rpx py-6rpx text-21rpx text-[#666]">
              分段 {{ segment.id }}
            </view>
            <view class="whitespace-pre-wrap text-27rpx text-[#333] leading-44rpx">
              {{ segment.content || '-' }}
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

interface KnowledgeSegment {
  id: number
  documentId: number
  documentName: string
  content: string
}

interface KnowledgeDocument {
  id: number
  title: string
  segments: KnowledgeSegment[]
}

const props = defineProps<{
  segments?: KnowledgeSegment[]
}>()

const visible = ref(false) // 详情弹窗显示状态
const selectedDocument = ref<KnowledgeDocument>() // 当前知识文档
const documents = computed(() => { // 按文档聚合知识分段
  const documentMap = new Map<number, KnowledgeDocument>()
  for (const segment of props.segments || []) {
    if (!documentMap.has(segment.documentId)) {
      documentMap.set(segment.documentId, {
        id: segment.documentId,
        title: segment.documentName || `文档 #${segment.documentId}`,
        segments: [],
      })
    }
    documentMap.get(segment.documentId)?.segments.push(segment)
  }
  return Array.from(documentMap.values())
})

/** 打开知识引用详情 */
function handleOpen(document: KnowledgeDocument) {
  selectedDocument.value = document
  visible.value = true
}
</script>
