<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="流程监听器详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id" />
        <wd-cell title="监听器名字" :value="formData?.name" />
        <wd-cell title="监听器类型">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_LISTENER_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="监听器状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="监听事件" :value="formData?.event" />
        <wd-cell title="值类型">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE" :value="formData?.valueType" />
        </wd-cell>
        <wd-cell title="值">
          <view class="break-all">
            {{ formData?.value }}
          </view>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['bpm:process-listener:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['bpm:process-listener:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProcessListener } from '@/api/bpm/process-listener'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteProcessListener, getProcessListener } from '@/api/bpm/process-listener'
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
const formData = ref<ProcessListener>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/process-listener/index')
}

/** 加载流程监听器详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProcessListener(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑流程监听器 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-bpm/process-listener/form/index?id=${props.id}`,
  })
}

/** 删除流程监听器 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该流程监听器吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteProcessListener(props.id)
    toast.success('删除成功')
    uni.$emit('bpm:process-listener:reload')
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
