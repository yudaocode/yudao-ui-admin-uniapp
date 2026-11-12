<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="PPT 详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id ?? '-'" />
        <wd-cell title="用户" :value="formData?.userNickname || '-'" />
        <wd-cell title="标题" :value="formData?.title || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.AI_PPT_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="页数" :value="formData ? `${formData.finishCount} / ${formData.slideCount}` : '-'" />
        <wd-cell title="格式" :value="formData ? (formData.mode === AiPptModeEnum.SLIDES ? '演示用幻灯片' : '详细演示文稿') : '-'" />
        <wd-cell title="语言" :value="formData ? formatPptLanguage(formData.language) : '-'" />
        <wd-cell title="请求页数" :value="formData?.pageCount ?? '-'" />
        <wd-cell title="素材来源" :value="formData ? (formData.source === AiPptSourceEnum.UPLOAD ? '上传材料' : '粘贴大纲') : '-'" />
        <wd-cell title="风格与设计要求" layout="vertical" value-align="left">
          <text>{{ formData?.prompt || '-' }}</text>
        </wd-cell>
        <wd-cell title="封面">
          <wd-img v-if="formData?.coverUrl" :src="formData.coverUrl" width="240rpx" height="135rpx" radius="8rpx" mode="aspectFill" enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell v-if="formData?.status === AiPptStatusEnum.FAIL" title="失败原因" layout="vertical" value-align="left">
          <text class="text-[#f5222d]">{{ formData.errorMessage || '-' }}</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="完成时间" :value="formatDateTime(formData?.finishTime) || '-'" />
      </wd-cell-group>

      <!-- 预览、大纲、导出 -->
      <view v-if="formData" class="flex flex-wrap gap-16rpx p-24rpx">
        <wd-button size="small" type="primary" @click="previewRef?.open(formData.id)">
          预览
        </wd-button>
        <wd-button size="small" variant="plain" @click="outlineRef?.open(formData.id)">
          查看大纲
        </wd-button>
        <wd-button
          v-if="formData.status === AiPptStatusEnum.SUCCESS && hasAccessByCodes(['ai:ppt:query'])"
          size="small"
          variant="plain"
          @click="exportVisible = true"
        >
          导出
        </wd-button>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:ppt:delete'])" class="yd-detail-footer">
      <wd-button
        type="danger"
        block
        :loading="deleting"
        :disabled="formData?.status === AiPptStatusEnum.IN_PROGRESS"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </view>

    <!-- 预览、大纲：只读 -->
    <PptPreviewPopup ref="previewRef" readonly />
    <PptOutlinePopup ref="outlineRef" readonly />

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
import { onMounted, ref } from 'vue'
import { deletePpt, exportPpt, getPpt } from '@/api/ai/ppt'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AI_PPT_EXPORT_ACTIONS, AiPptModeEnum, AiPptSourceEnum, AiPptStatusEnum, DICT_TYPE, formatPptLanguage } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PptOutlinePopup from '../../components/ppt-outline-popup.vue'
import PptPreviewPopup from '../../components/ppt-preview-popup.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Ppt>() // 详情数据
const deleting = ref(false) // 删除状态
const exportVisible = ref(false) // 导出格式选择显示状态
const previewRef = ref<InstanceType<typeof PptPreviewPopup>>() // 预览弹窗引用
const outlineRef = ref<InstanceType<typeof PptOutlinePopup>>() // 大纲弹窗引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/ppt/manager/index')
}

/** 加载 PPT 详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPpt(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 导出：文件名取标题 */
async function handleExport({ item }: { item: { value: string } }) {
  if (!formData.value) {
    return
  }
  toast.loading('导出中...')
  try {
    await exportPpt(formData.value.id, item.value, `${formData.value.title}.${item.value}`)
    toast.close()
  } catch {
    // 导出走文件下载，不经过统一请求层，需要页面提示失败
    toast.error('导出失败')
  }
}

/** 删除 PPT 记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定删除该 PPT 吗？只删除记录，图片文件不随之删除。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePpt(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:ppt:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
