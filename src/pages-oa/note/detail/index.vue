<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="笔记详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell :title="formData?.title ?? '-'">
          <template v-if="formData?.favorite">
            <wd-icon name="star-fill" size="28rpx" color="#fa8c16" />
          </template>
        </wd-cell>
        <wd-cell title="笔记类型">
          <dict-tag :type="DICT_TYPE.OA_NOTE_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="优先级">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_PRIORITY" :value="formData.priority" />
        </wd-cell>
        <wd-cell title="笔记目录" :value="formData?.categoryName || '未分类'" />
        <wd-cell title="创建人" :value="formData?.creatorUserName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 笔记内容：富文本消毒后渲染；纯文本（移动端自产）用 pre-wrap 保留换行 -->
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

      <!-- 附件 -->
      <view v-if="formData?.fileUrls?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          附件（{{ formData.fileUrls.length }}）
        </view>
        <view
          v-for="(url, index) in formData.fileUrls"
          :key="index"
          class="mb-12rpx flex items-center gap-12rpx text-26rpx text-[#1677ff]"
          @click="openAttachment(url)"
        >
          <wd-icon name="link" size="26rpx" />
          <text class="line-clamp-1">{{ getFileName(url) }}</text>
        </view>
      </view>

      <!-- 共享接收人 -->
      <view v-if="formData?.receiverUserNames?.length" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-8rpx text-28rpx text-[#333] font-semibold">
          共享给（{{ formData.receiverUserNames.length }}）
        </view>
        <view class="text-26rpx text-[#666]">
          {{ formData.receiverUserNames.join('、') }}
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view v-if="scene === 'mine'" class="yd-detail-footer-actions">
        <wd-button
          class="flex-1" variant="plain" @click="handleFavorite"
        >
          {{ formData?.favorite ? '取消收藏' : '收藏' }}
        </wd-button>
        <UserPicker
          v-if="hasAccessByCodes(['oa:note:update'])"
          v-model="shareUserIds"
          type="checkbox"
          title="共享给"
          @confirm="handleShareConfirm"
        >
          <view class="flex-1">
            <wd-button type="primary" block>
              共享
            </wd-button>
          </view>
        </UserPicker>
        <wd-button
          v-if="hasAccessByCodes(['oa:note:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:note:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
      <view v-else class="yd-detail-footer-actions">
        <wd-button
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Note } from '@/api/oa/note'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  deleteNote,
  deleteReceivedNote,
  getNote,
  updateNoteFavorite,
  updateNoteShare,
} from '@/api/oa/note'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { isHtmlContent, sanitizeRichText } from '@/utils/format'

const props = defineProps<{
  id?: string
  scene?: string // 打开场景：mine 我的 / received 共享与我
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
const formData = ref<Note>() // 详情数据
const deleting = ref(false) // 删除状态
const scene = computed(() => props.scene || 'mine') // 当前场景
const shareUserIds = ref<number[]>([]) // 共享选择的用户编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/note/index')
}

/** 加载笔记详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getNote(Number(props.id))
    formData.value = data
    shareUserIds.value = data.receiverUserIds || []
  } finally {
    toast.close()
  }
}

/** 附件名称：取地址最后一段 */
function getFileName(url: string) {
  return decodeURIComponent(url.split('/').pop() || '附件')
}

/** 收藏 / 取消收藏 */
async function handleFavorite() {
  if (!props.id || !formData.value) {
    return
  }
  const favorite = !formData.value.favorite
  await updateNoteFavorite(Number(props.id), favorite)
  formData.value.favorite = favorite
  toast.success(favorite ? '收藏成功' : '已取消收藏')
  uni.$emit('oa:note:reload')
}

/** 编辑笔记 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/note/form/index?id=${props.id}`,
  })
}

/** 保存共享接收人 */
async function handleShareConfirm() {
  if (!props.id) {
    return
  }
  await updateNoteShare(Number(props.id), shareUserIds.value)
  toast.success('共享设置已保存')
  uni.$emit('oa:note:reload')
  getDetail()
}

/** 删除笔记 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  // 已共享的笔记删除后接收人也无法查看，确认时补充连带提示
  const receiverCount = formData.value?.receiverUserNames?.length ?? 0
  const msg = scene.value === 'received'
    ? '确定要删除该共享笔记的接收记录吗？'
    : receiverCount > 0
      ? `该笔记已共享给 ${receiverCount} 人，删除后对方也无法查看，确定要删除吗？`
      : '确定要删除该笔记吗？'
  try {
    await dialog.confirm({
      title: '提示',
      msg,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    // 接收视角仅移除本人的接收关系，不影响笔记和其他接收人
    if (scene.value === 'received') {
      await deleteReceivedNote(Number(props.id))
    } else {
      await deleteNote(Number(props.id))
    }
    toast.success('删除成功')
    uni.$emit('oa:note:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:note:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:note:reload', getDetail)
})
</script>
