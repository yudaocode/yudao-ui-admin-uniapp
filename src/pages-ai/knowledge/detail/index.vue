<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="知识库详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="知识库名称" :value="formData?.name || '-'" />
        <wd-cell title="知识库描述" :value="formData?.description || '-'" />
        <wd-cell title="向量模型" :value="formData?.embeddingModel || '-'" />
        <wd-cell title="向量模型编号" :value="formData?.embeddingModelId || '-'" />
        <wd-cell title="TopK" :value="formData?.topK ?? '-'" />
        <wd-cell title="相似度阈值" :value="formData?.similarityThreshold ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" variant="plain" @click="handleDocument">
          文档
        </wd-button>
        <wd-button class="flex-1" type="primary" variant="plain" @click="handleRetrieval">
          召回测试
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
import type { Knowledge } from '@/api/ai/knowledge/knowledge'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { deleteKnowledge, getKnowledge } from '@/api/ai/knowledge/knowledge'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const formData = ref<Knowledge>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/knowledge/index')
}

/** 加载知识库详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getKnowledge(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 查看知识库文档 */
function handleDocument() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-ai/knowledge/document/index?knowledgeId=${formData.value.id}&knowledgeName=${encodeURIComponent(formData.value.name || '')}`,
  })
}

/** 执行召回测试 */
function handleRetrieval() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-ai/knowledge/retrieval/index?knowledgeId=${formData.value.id}&knowledgeName=${encodeURIComponent(formData.value.name || '')}`,
  })
}

/** 编辑知识库 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-ai/knowledge/form/index?id=${props.id}` })
}

/** 删除知识库 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除知识库【${formData.value?.name || props.id}】吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteKnowledge(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:knowledge:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:knowledge:detail-reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:knowledge:detail-reload', getDetail)
})
</script>
