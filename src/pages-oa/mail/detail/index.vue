<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="邮件详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view v-if="formData.id" class="p-24rpx">
        <!-- 邮件头 -->
        <view class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
            {{ formData.subject || '（无主题）' }}
          </view>
          <view class="text-26rpx text-[#666] leading-40rpx">
            <view>发件人：{{ formData.sender || '-' }}</view>
            <view>收件人：{{ formData.recipients?.join('、') || '-' }}</view>
            <view v-if="formData.ccs?.length">
              抄送人：{{ formData.ccs.join('、') }}
            </view>
            <view>时间：{{ formatDateTime(formData.receiveTime) || '-' }}</view>
          </view>
          <!-- 附件 -->
          <view v-if="formData.attachments?.length" class="mt-16rpx border-t border-[#f5f5f5] border-t-solid pt-16rpx">
            <view
              v-for="attachment in formData.attachments"
              :key="attachment.part"
              class="mb-8rpx flex items-center gap-8rpx text-26rpx text-[#1677ff]"
              @click="handleDownload(attachment)"
            >
              <wd-icon name="link" size="26rpx" color="#1677ff" />
              <text class="line-clamp-1">{{ attachment.name }}</text>
              <text class="shrink-0 text-22rpx text-[#999]">{{ formatFileSize(attachment.size) }}</text>
            </view>
          </view>
        </view>

        <!-- 邮件正文 -->
        <view class="mail-content rounded-12rpx bg-white p-24rpx shadow-sm">
          <rich-text :nodes="sanitizeRichText(formData.content || '')" />
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作 -->
    <view v-if="formData.id" class="yd-detail-footer">
      <view v-if="folderKey === OA_MAIL_FOLDER_KEY.TRASH" class="yd-detail-footer-actions">
        <wd-button variant="plain" :loading="operating" @click="handleRestore">
          恢复到收件箱
        </wd-button>
        <wd-button type="error" :loading="operating" @click="handleDelete">
          彻底删除
        </wd-button>
      </view>
      <view v-else class="yd-detail-footer-actions">
        <wd-button variant="plain" :disabled="operating" @click="handleCompose(OA_MAIL_COMPOSE_MODE.REPLY)">
          回复
        </wd-button>
        <wd-button variant="plain" :disabled="operating" @click="handleCompose(OA_MAIL_COMPOSE_MODE.REPLY_ALL)">
          回复全部
        </wd-button>
        <wd-button variant="plain" :disabled="operating" @click="handleCompose(OA_MAIL_COMPOSE_MODE.FORWARD)">
          转发
        </wd-button>
        <wd-button variant="plain" :loading="operating" @click="handleRead">
          {{ formData.readStatus ? '标记未读' : '标记已读' }}
        </wd-button>
        <wd-button type="error" :loading="operating" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MailAttachment, MailMessage } from '@/api/oa/mail'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  deleteMailMessage,
  downloadMailAttachment,
  getMailMessage,
  restoreMailMessage,
  updateMailMessageRead,
} from '@/api/oa/mail'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatFileSize } from '@/utils/download'
import { sanitizeRichText } from '@/utils/format'
import { OA_MAIL_COMPOSE_MODE, OA_MAIL_FOLDER_KEY } from '../../utils/constants'

const props = defineProps<{
  id?: string // 邮件编号
  folderKey?: string // 所在文件夹标识
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const formData = ref<Partial<MailMessage>>({}) // 详情数据
const operating = ref(false) // 远端操作中

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 通知列表刷新文件夹未读数（轻操作不重置列表页码） */
function emitRefreshFolders() {
  uni.$emit('oa:mail:refresh-folders')
}

/** 加载详情，读取成功后同步已读状态 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMailMessage(Number(props.id))
  if (!formData.value.readStatus) {
    try {
      await updateMailMessageRead(formData.value.id!, true)
      // 同步本地已读状态，避免「标记已读」按钮语义错乱
      formData.value.readStatus = true
      emitRefreshFolders()
    } catch {
      // 正文已加载，已读状态更新失败由用户重试
      toast.warning('已读状态更新失败')
    }
  }
}

/** 回复、转发 */
function handleCompose(mode: string) {
  uni.navigateTo({
    url: `/pages-oa/mail/form/index?accountId=${formData.value.accountId}&mode=${mode}&id=${formData.value.id}`,
  })
}

/** 切换已读状态 */
async function handleRead() {
  operating.value = true
  try {
    await updateMailMessageRead(formData.value.id!, !formData.value.readStatus)
    formData.value.readStatus = !formData.value.readStatus
    toast.success('修改成功')
    emitRefreshFolders()
  } finally {
    operating.value = false
  }
}

/** 删除邮件，垃圾箱中为彻底删除 */
async function handleDelete() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: props.folderKey === OA_MAIL_FOLDER_KEY.TRASH ? '确认彻底删除这封邮件？此操作无法恢复。' : '确认将这封邮件移至已删除？',
    })
  } catch {
    return
  }
  operating.value = true
  try {
    await deleteMailMessage(formData.value.id!)
    toast.success('删除成功')
    uni.$emit('oa:mail:remove-message', formData.value.id)
    navigateBackPlus()
  } finally {
    operating.value = false
  }
}

/** 恢复到收件箱 */
async function handleRestore() {
  operating.value = true
  try {
    await restoreMailMessage(formData.value.id!)
    toast.success('已恢复到收件箱')
    uni.$emit('oa:mail:remove-message', formData.value.id)
    navigateBackPlus()
  } finally {
    operating.value = false
  }
}

/** 下载附件 */
async function handleDownload(attachment: MailAttachment) {
  await downloadMailAttachment(formData.value.id!, attachment.part, attachment.name)
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
// 正文宽度约束：防止表格、大图横向溢出（外部图片策略待产品确认，暂不拦截）
.mail-content {
  max-width: 100%;
  overflow-x: hidden;
  word-break: break-word;

  :deep(img),
  :deep(table) {
    max-width: 100%;
  }
}
</style>
