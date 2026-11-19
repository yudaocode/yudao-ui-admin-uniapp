<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 图片识别"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="识别" />
        <wd-tab title="识别记录" />
      </wd-tabs>
    </view>

    <!-- 识别：切换 Tab 时保留图片和结果 -->
    <scroll-view v-show="tabIndex === 0" scroll-y class="min-h-0 flex-1">
      <OcrRecognizePanel ref="panelRef" />
    </scroll-view>

    <!-- 识别记录 -->
    <OcrList
      v-if="tabIndex === 1"
      ref="listRef"
      :current-id="panelRef?.currentId"
      @open="handleOpen"
      @delete="handleDelete"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Ocr } from '@/api/ai/ocr'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteOcrMy } from '@/api/ai/ocr'
import { navigateBackPlus } from '@/utils'
import OcrList from './components/ocr-list.vue'
import OcrRecognizePanel from './components/ocr-recognize-panel.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前 Tab：0 识别、1 识别记录
const panelRef = ref<InstanceType<typeof OcrRecognizePanel>>() // 识别面板引用
const listRef = ref<InstanceType<typeof OcrList>>() // 列表引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 打开记录：恢复到识别页 */
function handleOpen(item: Ocr) {
  panelRef.value?.openRecord(item)
  tabIndex.value = 0
}

/** 删除：图片文件不随记录删除 */
async function handleDelete(item: Ocr) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定删除该识别记录吗？',
    })
  } catch {
    return
  }
  await deleteOcrMy(item.id)
  toast.success('删除成功')
  panelRef.value?.handleDeleted(item.id)
  listRef.value?.reload()
}
</script>
