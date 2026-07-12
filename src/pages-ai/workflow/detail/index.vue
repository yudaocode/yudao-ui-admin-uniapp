<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="工作流详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="流程标识" :value="formData?.code || '-'" />
        <wd-cell title="流程名称" :value="formData?.name || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="编排 JSON">
          <view class="whitespace-pre-wrap break-all text-26rpx text-[#666]">
            {{ formatGraph(formData?.graph) }}
          </view>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['ai:workflow:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:workflow:test'])"
          class="flex-1"
          type="primary"
          @click="testVisible = true"
        >
          测试
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:workflow:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>

    <!-- 工作流测试 -->
    <TestForm
      v-model="testVisible"
      :workflow-id="formData?.id"
      :name="formData?.name"
      :code="formData?.code"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Workflow } from '@/api/ai/workflow'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteWorkflow, getWorkflow } from '@/api/ai/workflow'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'
import TestForm from '../components/test-form.vue'

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
const formData = ref<Workflow>() // 详情数据
const deleting = ref(false) // 删除状态
const testVisible = ref(false) // 测试弹窗显示状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/workflow/index')
}

/** 加载工作流详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getWorkflow(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑工作流 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-ai/workflow/form/index?id=${props.id}`,
  })
}

/** 删除工作流 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该工作流吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWorkflow(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:workflow:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 格式化工作流编排 */
function formatGraph(graph?: string) {
  if (!graph) {
    return '-'
  }
  try {
    return formatJson(JSON.parse(graph))
  } catch {
    return graph
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:workflow:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:workflow:reload', getDetail)
})
</script>
