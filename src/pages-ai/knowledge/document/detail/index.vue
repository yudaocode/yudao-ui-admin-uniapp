<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文档详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="知识库编号" :value="formData?.knowledgeId || '-'" />
        <wd-cell title="文档名称" :value="formData?.name || '-'" />
        <wd-cell title="文档地址" :value="formData?.url || '-'" />
        <wd-cell title="文档内容">
          <view class="whitespace-pre-wrap break-all text-26rpx text-[#666] leading-42rpx">
            {{ formData?.content || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="字符数" :value="formData?.contentLength ?? '-'" />
        <wd-cell title="Token 数" :value="formData?.tokens ?? '-'" />
        <wd-cell title="分片最大 Token" :value="formData?.segmentMaxTokens ?? '-'" />
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
        <wd-button class="flex-1" type="primary" variant="plain" @click="handleSegment">
          分段
        </wd-button>
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
import type { KnowledgeDocument } from '@/api/ai/knowledge/document'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import {
  deleteKnowledgeDocument,
  getKnowledgeDocument,
  updateKnowledgeDocumentStatus,
} from '@/api/ai/knowledge/document'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
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
const formData = ref<KnowledgeDocument>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  const knowledgeId = formData.value?.knowledgeId || props.knowledgeId
  navigateBackPlus(`/pages-ai/knowledge/document/index${knowledgeId ? `?knowledgeId=${knowledgeId}` : ''}`)
}

/** 加载文档详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getKnowledgeDocument(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 修改文档状态 */
async function handleStatusChange() {
  if (!formData.value?.id || formData.value.status == null) {
    return
  }
  const text = formData.value.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({ title: '提示', msg: `确认要${text}文档【${formData.value.name}】吗？` })
    await updateKnowledgeDocumentStatus({ id: formData.value.id, status: formData.value.status })
    toast.success('更新成功')
    uni.$emit('ai:knowledge-document:reload')
  } catch {
    formData.value.status = formData.value.status === CommonStatusEnum.ENABLE
      ? CommonStatusEnum.DISABLE
      : CommonStatusEnum.ENABLE
  }
}

/** 查看文档分段 */
function handleSegment() {
  if (!formData.value?.id) {
    return
  }
  const query = [
    `documentId=${formData.value.id}`,
    formData.value.knowledgeId ? `knowledgeId=${formData.value.knowledgeId}` : '',
    `documentName=${encodeURIComponent(formData.value.name || '')}`,
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-ai/knowledge/segment/index?${query}` })
}

/** 编辑文档 */
function handleEdit() {
  const knowledgeId = formData.value?.knowledgeId || props.knowledgeId
  const query = [
    `id=${props.id}`,
    knowledgeId ? `knowledgeId=${knowledgeId}` : '',
  ].filter(Boolean).join('&')
  uni.navigateTo({ url: `/pages-ai/knowledge/document/form/index?${query}` })
}

/** 删除文档 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除文档【${formData.value?.name || props.id}】吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteKnowledgeDocument(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:knowledge-document:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:knowledge-document:detail-reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:knowledge-document:detail-reload', getDetail)
})
</script>
