<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文件详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="文件编号" :value="formData?.id || '-'" />
        <wd-cell title="文件名" :value="formData?.name || '-'" />
        <wd-cell title="文件路径" :value="formData?.path || '-'" />
        <wd-cell title="文件 URL" :value="formData?.url || '-'" />
        <wd-cell title="文件大小" :value="formatFileSize(formData?.size)" />
        <wd-cell title="文件类型" :value="formData?.type || '-'" />
        <wd-cell title="上传时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
      <!-- 文件预览 -->
      <view v-if="formData?.type && formData.type.includes('image')" class="m-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          文件预览
        </view>
        <wd-img
          :src="formData.url"
          mode="aspectFit"
          width="100%"
          height="400rpx"
          enable-preview
        />
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" variant="plain" @click="openFile(formData?.url)">
          打开
        </wd-button>
        <wd-button class="flex-1" type="info" @click="handleCopyUrl">
          复制链接
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:file:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FileVO } from '@/api/infra/file'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteFile, getFile } from '@/api/infra/file'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatFileSize, openFile } from '@/utils/download'

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
const formData = ref<FileVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/file/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getFile(props.id)
  } finally {
    toast.close()
  }
}

/** 复制链接 */
function handleCopyUrl() {
  if (!formData.value?.url) {
    toast.show('文件 URL 为空')
    return
  }
  uni.setClipboardData({
    data: formData.value.url,
    success: () => {
      uni.hideToast()
      toast.success('复制成功')
    },
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该文件吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteFile(props.id)
    toast.success('删除成功')
    uni.$emit('infra:file:reload')
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
