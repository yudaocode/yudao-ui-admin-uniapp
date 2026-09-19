<template>
  <view class="rounded-12rpx bg-white p-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <text class="text-30rpx text-[#333] font-semibold">我的笔记</text>
      <text class="text-26rpx text-[#1677ff]" @click="handleGo('/pages-oa/note/index')">更多</text>
    </view>
    <view v-if="!notes.length" class="py-24rpx text-center text-24rpx text-[#999]">
      暂无笔记
    </view>
    <view
      v-for="item in notes"
      :key="item.id"
      class="mb-12rpx flex items-center gap-12rpx"
      @click="handleGo(`/pages-oa/note/detail/index?id=${item.id}`)"
    >
      <view class="min-w-0 flex-1">
        <view class="line-clamp-1 text-28rpx text-[#333] font-medium">
          {{ item.title }}
        </view>
        <view class="line-clamp-1 mt-2rpx text-22rpx text-[#999]">
          {{ stripHtmlTags(item.content || '') || '暂无内容' }}
        </view>
      </view>
      <text class="shrink-0 text-22rpx text-[#999]">{{ formatDate(item.createTime, 'MM-DD') }}</text>
    </view>
    <!-- 快捷新增笔记 -->
    <view v-if="hasAccessByCodes(['oa:note:create'])" class="mt-16rpx flex items-center gap-16rpx">
      <wd-input
        v-model="quickNote"
        class="flex-1"
        placeholder="输入笔记内容"
        :maxlength="255"
        @confirm="handleQuickNote"
      />
      <wd-button size="small" type="primary" :loading="savingNote" @click="handleQuickNote">
        添加
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Note } from '@/api/oa/note'
import { onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createNote, getMyNotePage } from '@/api/oa/note'
import { useAccess } from '@/hooks/useAccess'
import { formatDate } from '@/utils/date'
import { stripHtmlTags } from '@/utils/format'
import { OA_NOTE_TYPE, OA_PRIORITY } from '../../utils/constants'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const notes = ref<Note[]>([]) // 最近笔记
const quickNote = ref('') // 快捷笔记内容
const savingNote = ref(false) // 笔记保存中

/** 页面跳转 */
function handleGo(url: string) {
  uni.navigateTo({ url })
}

/** 新增快捷笔记 */
async function handleQuickNote() {
  if (savingNote.value) {
    return
  }
  const content = quickNote.value.trim()
  if (!content) {
    toast.warning('请输入笔记内容')
    return
  }
  if (content.length < 10) {
    toast.warning('笔记内容不能少于 10 个字')
    return
  }
  savingNote.value = true
  try {
    await createNote({
      type: OA_NOTE_TYPE.PRIVATE,
      priority: OA_PRIORITY.NORMAL,
      title: content,
      content,
      fileUrls: [],
    })
    toast.success('笔记添加成功')
    quickNote.value = ''
    notes.value = (await getMyNotePage({ pageNo: 1, pageSize: 5 })).list
  } finally {
    savingNote.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getMyNotePage({ pageNo: 1, pageSize: 5 }).then((data) => {
    notes.value = data.list
  })
})
</script>
