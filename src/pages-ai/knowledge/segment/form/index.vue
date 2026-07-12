<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell
            v-if="formData.documentId"
            title="所属文档编号"
            :value="String(formData.documentId)"
          />
          <wd-form-item title="分段内容" title-width="200rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              placeholder="请输入分段内容"
              :maxlength="4000"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { KnowledgeSegment } from '@/api/ai/knowledge/segment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createKnowledgeSegment,
  getKnowledgeSegment,
  updateKnowledgeSegment,
} from '@/api/ai/knowledge/segment'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

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

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑分段' : '新增分段')
const formLoading = ref(false) // 表单提交状态
const formData = ref<KnowledgeSegment>({
  documentId: undefined,
  content: '',
}) // 表单数据
const formSchema = createFormSchema({
  content: [{ required: true, message: '分段内容不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  const query = [
    props.documentId ? `documentId=${props.documentId}` : '',
    props.knowledgeId ? `knowledgeId=${props.knowledgeId}` : '',
  ].filter(Boolean).join('&')
  navigateBackPlus(`/pages-ai/knowledge/segment/index${query ? `?${query}` : ''}`)
}

/** 加载详情 */
async function getDetail() {
  // 新增时，预填来自 query 的文档编号
  if (!props.id) {
    formData.value.documentId = props.documentId ? Number(props.documentId) : undefined
    return
  }
  formData.value = await getKnowledgeSegment(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 新增时必须携带文档编号
  if (!props.id && !formData.value.documentId) {
    toast.warning('缺少所属文档编号')
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateKnowledgeSegment(formData.value)
      toast.success('修改成功')
    } else {
      await createKnowledgeSegment(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('ai:knowledge-segment:reload')
    uni.$emit('ai:knowledge-segment:detail-reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
