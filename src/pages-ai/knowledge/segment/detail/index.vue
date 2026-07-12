<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="分段详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="知识库编号" :value="formData?.knowledgeId || '-'" />
        <wd-cell title="文档编号" :value="formData?.documentId || '-'" />
        <wd-cell title="向量编号" :value="formData?.vectorId || '-'" />
        <wd-cell title="分段内容">
          <view class="whitespace-pre-wrap break-all text-26rpx text-[#666] leading-42rpx">
            {{ formData?.content || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="字符数" :value="formData?.contentLength ?? '-'" />
        <wd-cell title="Token 数" :value="formData?.tokens ?? '-'" />
        <wd-cell title="召回次数" :value="formData?.retrievalCount ?? '-'" />
        <wd-cell title="状态">
          <wd-switch
            v-if="hasAccessByCodes(['ai:knowledge:update']) && formData"
            v-model="formData.status"
            :active-value="CommonStatusEnum.ENABLE"
            :inactive-value="CommonStatusEnum.DISABLE"
            @change="handleStatusChange"
          />
          <dict-tag v-else-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['ai:knowledge:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:knowledge:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeSegment } from '@/api/ai/knowledge/segment'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import {
  deleteKnowledgeSegment,
  getKnowledgeSegment,
  updateKnowledgeSegmentStatus,
} from '@/api/ai/knowledge/segment'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
  documentId?: number | any
  knowledgeId?: number | any
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
const formData = ref<KnowledgeSegment>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  const documentId = formData.value?.documentId || props.documentId
  const knowledgeId = formData.value?.knowledgeId || props.knowledgeId
  const query = [
    documentId ? `documentId=${documentId}` : '',
    knowledgeId ? `knowledgeId=${knowledgeId}` : '',
  ].filter(Boolean).join('&')
  navigateBackPlus(`/pages-ai/knowledge/segment/index${query ? `?${query}` : ''}`)
}

/** 加载分段详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getKnowledgeSegment(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 修改分段状态 */
async function handleStatusChange() {
  if (!formData.value?.id || formData.value.status == null) {
    return
  }
  const text = formData.value.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({ title: '提示', msg: `确认要${text}该分段吗？` })
    await updateKnowledgeSegmentStatus({ id: formData.value.id, status: formData.value.status })
    toast.success('修改成功')
    uni.$emit('ai:knowledge-segment:reload')
  } catch {
    formData.value.status = formData.value.status === CommonStatusEnum.ENABLE
      ? CommonStatusEnum.DISABLE
      : CommonStatusEnum.ENABLE
  }
}

/** 编辑分段 */
function handleEdit() {
  const documentId = formData.value?.documentId || props.documentId
  const knowledgeId = formData.value?.knowledgeId || props.knowledgeId
  uni.navigateTo({
    url: `/pages-ai/knowledge/segment/form/index?id=${props.id}&documentId=${documentId}&knowledgeId=${knowledgeId}`,
  })
}

/** 删除分段 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除分段【#${props.id}】吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteKnowledgeSegment(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:knowledge-segment:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:knowledge-segment:detail-reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:knowledge-segment:detail-reload', getDetail)
})
</script>
