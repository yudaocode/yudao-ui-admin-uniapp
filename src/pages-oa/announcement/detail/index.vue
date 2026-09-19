<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公告详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="公告标题" :value="formData?.title ?? '-'" />
        <wd-cell title="发布人" :value="formData?.publisherUserName || '-'" />
        <wd-cell title="发布时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="所属部门" :value="formData?.publisherDeptName || '-'" />
        <wd-cell title="公告类型">
          <dict-tag :type="DICT_TYPE.OA_ANNOUNCEMENT_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="优先级">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_PRIORITY" :value="formData.priority" />
        </wd-cell>
        <wd-cell v-if="formData?.top" title="置顶" value="是" />
      </wd-cell-group>

      <!-- 公告内容：富文本消毒后渲染；纯文本（移动端自产）用 pre-wrap 保留换行 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <rich-text
          v-if="formData?.content && isHtmlContent(formData.content)"
          :nodes="sanitizeRichText(formData.content)"
        />
        <view
          v-else-if="formData?.content"
          class="whitespace-pre-wrap text-28rpx text-[#333]"
        >
          {{ formData.content }}
        </view>
        <view v-else class="text-28rpx text-[#999]">
          暂无内容
        </view>
      </view>

      <!-- 相关链接 -->
      <view v-if="formData?.url" class="mt-20rpx rounded-12rpx bg-white p-24rpx" @click="handleCopyUrl">
        <view class="mb-8rpx text-26rpx text-[#999]">
          相关链接（点击复制）
        </view>
        <view class="break-all text-28rpx text-[#1677ff]">
          {{ formData.url }}
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view v-if="!isReceived" class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:announcement:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:announcement:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
      <view v-else class="yd-detail-footer-actions">
        <wd-button
          v-if="!formData?.forwarded"
          class="flex-1" type="primary" :loading="forwarding" @click="handleForward"
        >
          转发给下属
        </wd-button>
        <wd-button
          v-if="formData?.readStatus"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Announcement } from '@/api/oa/announcement'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  deleteAnnouncement,
  deleteReceivedAnnouncement,
  forwardAnnouncement,
  getAnnouncement,
  updateAnnouncementReadStatus,
} from '@/api/oa/announcement'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { isHtmlContent, sanitizeRichText } from '@/utils/format'

const props = defineProps<{
  id?: string
  scene?: string // 打开场景：received 表示接收人视角
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Announcement>() // 详情数据
const deleting = ref(false) // 删除状态
const forwarding = ref(false) // 转发状态
const isReceived = computed(() => props.scene === 'received') // 接收人视角

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载公告详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getAnnouncement(Number(props.id))
    formData.value = data
    // 接收人阅读未读公告时，同步阅读状态
    if (isReceived.value && !data.readStatus) {
      await updateAnnouncementReadStatus(Number(props.id))
      data.readStatus = true
      uni.$emit('oa:announcement:reload')
    }
  } finally {
    toast.close()
  }
}

/** 编辑公告 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/announcement/form/index?id=${props.id}`,
  })
}

/** 删除公告 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: isReceived.value ? '确定要删除该公告的接收记录吗？' : '确定要删除该公告吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    // 接收视角仅移除自己的接收关系，不影响公告和其他接收人
    if (isReceived.value) {
      await deleteReceivedAnnouncement(Number(props.id))
    } else {
      await deleteAnnouncement(Number(props.id))
    }
    toast.success('删除成功')
    uni.$emit('oa:announcement:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 转发公告给直属下属 */
async function handleForward() {
  if (!props.id || formData.value?.forwarded) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定将该公告转发给自己的下属吗？',
    })
  } catch {
    return
  }
  forwarding.value = true
  try {
    const count = await forwardAnnouncement(Number(props.id))
    if (count > 0) {
      toast.success(`已转发给 ${count} 位下属`)
      if (formData.value) {
        formData.value.forwarded = true
      }
    } else {
      toast.info('暂无可转发的下属')
    }
  } finally {
    forwarding.value = false
  }
}

/** 复制相关链接 */
function handleCopyUrl() {
  if (!formData.value?.url) {
    return
  }
  uni.setClipboardData({ data: formData.value.url })
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:announcement:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:announcement:reload', getDetail)
})
</script>
