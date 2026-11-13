<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI PPT 生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="创建" />
        <wd-tab title="我的 PPT" />
      </wd-tabs>
    </view>

    <!-- 创建表单：切换 Tab 时保留表单内容 -->
    <scroll-view v-show="tabIndex === 0" scroll-y class="min-h-0 flex-1">
      <PptCreatePanel @submitted="handleSubmitted" />
    </scroll-view>

    <!-- 我的 PPT -->
    <PptList
      v-if="tabIndex === 1"
      ref="listRef"
      @preview="openPreview"
      @outline="openOutline"
      @prompt="handlePrompt"
      @resume="handleResume"
      @export="openExport"
      @delete="handleDelete"
    />

    <!-- 预览、大纲 -->
    <PptPreviewPopup ref="previewRef" @change="handlePreviewChange" @export="openExport" />
    <PptOutlinePopup ref="outlineRef" />

    <!-- 导出格式 -->
    <wd-action-sheet
      v-model="exportVisible"
      :actions="AI_PPT_EXPORT_ACTIONS"
      root-portal
      :z-index="30"
      @select="handleExport"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Ppt } from '@/api/ai/ppt'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deletePptMy, exportPptMy, getPptMy, resumePptMy } from '@/api/ai/ppt'
import { navigateBackPlus } from '@/utils'
import { AI_PPT_EXPORT_ACTIONS } from '@/utils/constants'
import PptCreatePanel from './components/ppt-create-panel.vue'
import PptList from './components/ppt-list.vue'
import PptOutlinePopup from './components/ppt-outline-popup.vue'
import PptPreviewPopup from './components/ppt-preview-popup.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前 Tab：0 创建、1 我的 PPT
const listRef = ref<InstanceType<typeof PptList>>() // 列表引用
const previewRef = ref<InstanceType<typeof PptPreviewPopup>>() // 预览弹窗引用
const outlineRef = ref<InstanceType<typeof PptOutlinePopup>>() // 大纲弹窗引用
const exportVisible = ref(false) // 导出格式选择显示状态
const exportTarget = ref<Ppt>() // 待导出的 PPT

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交成功：切到我的 PPT，列表重新挂载后从第一页加载 */
function handleSubmitted() {
  tabIndex.value = 1
}

/** 预览 */
function openPreview(item: Ppt) {
  previewRef.value?.open(item.id)
}

/** 预览中详情刷新：同步列表中的同一任务 */
function handlePreviewChange(data: Ppt) {
  listRef.value?.updateItem(data)
}

/** 查看大纲 */
function openOutline(item: Ppt) {
  outlineRef.value?.open(item.id)
}

/** 查看提示词 */
function handlePrompt(item: Ppt) {
  dialog.alert({
    title: '风格与设计要求',
    msg: item.prompt || '（无补充提示）',
  })
}

/** 继续生成 */
async function handleResume(item: Ppt) {
  await resumePptMy(item.id)
  toast.success('已继续生成')
  Object.assign(item, await getPptMy(item.id))
}

/** 选择导出格式 */
function openExport(item: Ppt) {
  exportTarget.value = item
  exportVisible.value = true
}

/** 导出：文件名取标题 */
async function handleExport({ item }: { item: { value: string } }) {
  const ppt = exportTarget.value
  if (!ppt) {
    return
  }
  toast.loading('导出中...')
  try {
    await exportPptMy(ppt.id, item.value, `${ppt.title}.${item.value}`)
    toast.close()
  } catch {
    // 导出走文件下载，不经过统一请求层，需要页面提示失败
    toast.error('导出失败')
  }
}

/** 删除 */
async function handleDelete(item: Ppt) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定删除该 PPT 吗？图片文件不随任务删除。',
    })
  } catch {
    return
  }
  await deletePptMy(item.id)
  toast.success('删除成功')
  listRef.value?.reload()
}
</script>
