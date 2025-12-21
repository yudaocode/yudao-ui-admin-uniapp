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
        <wd-cell title="文件编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="文件名" :value="String(formData?.name ?? '-')" />
        <wd-cell title="文件路径" :value="String(formData?.path ?? '-')" />
        <wd-cell title="文件 URL" :value="String(formData?.url ?? '-')" />
        <wd-cell title="文件大小" :value="formatFileSize(formData?.size)" />
        <wd-cell title="文件类型" :value="String(formData?.type ?? '-')" />
        <wd-cell title="上传时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 文件预览 -->
      <view v-if="formData?.type && formData.type.includes('image')" class="m-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          文件预览
        </view>
        <image
          :src="formData.url"
          mode="aspectFit"
          class="w-full rounded-8rpx"
          @click="handlePreviewImage"
        />
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button class="flex-1" type="info" @click="handleCopyUrl">
          复制链接
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:file:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { useAccess } from '@/hooks/useAccess'
import { http } from '@/http/http'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

/** 文件信息 */
interface FileInfo {
  id?: number
  configId?: number
  path: string
  name?: string
  url?: string
  size?: number
  type?: string
  createTime?: Date
}

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
const formData = ref<FileInfo>()
const deleting = ref(false)

/** 格式化文件大小 */
function formatFileSize(size?: number) {
  if (!size) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
}

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
    formData.value = await http.get<FileInfo>(`/infra/file/get?id=${props.id}`)
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
      toast.success('复制成功')
    },
  })
}

/** 预览图片 */
function handlePreviewImage() {
  if (!formData.value?.url) return
  uni.previewImage({
    urls: [formData.value.url],
  })
}

/** 删除 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该文件吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await http.delete(`/infra/file/delete?id=${props.id}`)
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
