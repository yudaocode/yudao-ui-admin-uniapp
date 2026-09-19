<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="min-h-0 flex-1 overflow-auto p-24rpx">
      <!-- 表单区域 -->
      <wd-cell-group border>
        <!-- 收件人 -->
        <view class="px-24rpx py-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            收件人 <text class="text-[#f56c6c]">*</text>
          </view>
          <view v-if="formData.recipients?.length" class="mb-12rpx flex flex-wrap gap-12rpx">
            <view
              v-for="(address, index) in formData.recipients"
              :key="address"
              class="flex items-center gap-8rpx rounded-8rpx bg-[#f0f5ff] px-16rpx py-6rpx text-24rpx text-[#1677ff]"
            >
              <text>{{ address }}</text>
              <wd-icon name="close" size="22rpx" @click="formData.recipients!.splice(index, 1)" />
            </view>
          </view>
          <view class="flex items-center gap-16rpx">
            <wd-input
              v-model="recipientInput"
              class="flex-1"
              placeholder="输入邮箱地址后添加"
              clearable
              @confirm="handleAddRecipient"
            />
            <wd-button size="small" variant="plain" @click="handleAddRecipient">
              添加
            </wd-button>
          </view>
        </view>
        <!-- 抄送人 -->
        <view class="px-24rpx py-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            抄送人
          </view>
          <view v-if="formData.ccs?.length" class="mb-12rpx flex flex-wrap gap-12rpx">
            <view
              v-for="(address, index) in formData.ccs"
              :key="address"
              class="flex items-center gap-8rpx rounded-8rpx bg-[#f0f5ff] px-16rpx py-6rpx text-24rpx text-[#1677ff]"
            >
              <text>{{ address }}</text>
              <wd-icon name="close" size="22rpx" @click="formData.ccs!.splice(index, 1)" />
            </view>
          </view>
          <view class="flex items-center gap-16rpx">
            <wd-input
              v-model="ccInput"
              class="flex-1"
              placeholder="输入邮箱地址后添加"
              clearable
              @confirm="handleAddCc"
            />
            <wd-button size="small" variant="plain" @click="handleAddCc">
              添加
            </wd-button>
          </view>
        </view>
        <wd-input
          v-model="formData.subject"
          label="主题"
          label-width="140rpx"
          placeholder="请输入主题"
          clearable
        />
        <view class="px-24rpx py-16rpx">
          <view class="mb-8rpx text-26rpx text-[#666]">
            正文
          </view>
          <wd-textarea
            v-model="contentText"
            placeholder="请输入正文"
            :maxlength="500000"
            auto-height
            clearable
          />
        </view>
      </wd-cell-group>

      <!-- 回复或转发的原文引用 -->
      <view v-if="quoteContent" class="mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-12rpx text-26rpx text-[#999]">
          原文引用
        </view>
        <rich-text :nodes="sanitizeRichText(quoteContent)" />
      </view>

      <!-- 附件 -->
      <view v-if="formData.attachments?.length || newFiles.length" class="mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-12rpx flex items-center justify-between">
          <text class="text-26rpx text-[#333] font-medium">附件</text>
          <!-- 仅 H5 支持选择本地文件，小程序端受 multipart 限制不新增附件 -->
          <!-- #ifdef H5 -->
          <wd-button size="small" variant="plain" @click="handleAddAttachment">
            添加附件
          </wd-button>
          <!-- #endif -->
        </view>
        <view
          v-for="attachment in formData.attachments"
          :key="attachment.part"
          class="mb-8rpx flex items-center gap-8rpx text-26rpx text-[#666]"
        >
          <wd-icon name="attach" size="26rpx" />
          <text class="line-clamp-1 min-w-0 flex-1">{{ attachment.name }}</text>
          <text class="shrink-0 text-[#f56c6c]" @click="handleRemoveAttachment(attachment.part)">移除</text>
        </view>
        <view
          v-for="(file, index) in newFiles"
          :key="file.name"
          class="mb-8rpx flex items-center gap-8rpx text-26rpx text-[#1677ff]"
        >
          <wd-icon name="attach" size="26rpx" />
          <text class="line-clamp-1 min-w-0 flex-1">{{ file.name }}</text>
          <text class="shrink-0 text-[#f56c6c]" @click="newFiles.splice(index, 1)">移除</text>
        </view>
      </view>
      <!-- #ifdef H5 -->
      <view v-else class="mt-24rpx">
        <wd-button size="small" variant="plain" @click="handleAddAttachment">
          添加附件
        </wd-button>
      </view>
      <!-- #endif -->
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="formData.draftId"
          class="flex-1" type="error" variant="plain"
          :disabled="formLoading || savingDraft"
          @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          class="flex-1" variant="plain"
          :loading="savingDraft"
          :disabled="formLoading"
          @click="handleSaveDraft"
        >
          存草稿
        </wd-button>
        <wd-button
          class="flex-1" type="primary"
          :loading="formLoading"
          :disabled="savingDraft"
          @click="handleSend"
        >
          发送
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MailMessage } from '@/api/oa/mail'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  deleteMailMessage,
  getMailMessageCompose,
  saveMailMessageDraft,
  saveMailMessageDraftWithFiles,
  sendMailMessage,
  sendMailMessageWithFiles,
} from '@/api/oa/mail'
import { navigateBackPlus } from '@/utils'
import { sanitizeRichText } from '@/utils/format'
import { OA_MAIL_COMPOSE_MODE } from '../../utils/constants'

const props = defineProps<{
  accountId?: string // 邮箱账号编号
  mode?: string // 写信方式
  id?: string // 原草稿或原邮件编号
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const formLoading = ref(false) // 发送中
const savingDraft = ref(false) // 存草稿中
const recipientInput = ref('') // 收件人输入
const ccInput = ref('') // 抄送人输入
const contentText = ref('') // 本次输入的正文纯文本
const quoteContent = ref('') // 回复或转发引用的原文 HTML
const newFiles = ref<File[]>([]) // 本次新增附件，仅 H5 支持
const formData = ref<Partial<MailMessage>>({
  accountId: props.accountId ? Number(props.accountId) : undefined,
  recipients: [],
  ccs: [],
  subject: '',
  mode: props.mode || OA_MAIL_COMPOSE_MODE.NEW,
}) // 表单数据
const getTitle = computed(() => formData.value.draftId || props.mode === OA_MAIL_COMPOSE_MODE.DRAFT ? '编辑草稿' : '写信')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/mail/index')
}

/** 校验并添加邮箱地址 */
function addAddress(list: string[], input: typeof recipientInput) {
  const address = input.value.trim()
  if (!address) {
    return
  }
  if (!address.includes('@')) {
    toast.warning('请输入正确的邮箱地址')
    return
  }
  if (list.includes(address)) {
    toast.warning('该地址已添加')
    return
  }
  list.push(address)
  input.value = ''
}

/** 添加收件人 */
function handleAddRecipient() {
  addAddress(formData.value.recipients!, recipientInput)
}

/** 添加抄送人 */
function handleAddCc() {
  addAddress(formData.value.ccs!, ccInput)
}

/** 移除不再保留的原附件 */
function handleRemoveAttachment(part: string) {
  formData.value.attachments = formData.value.attachments?.filter(item => item.part !== part)
  formData.value.attachmentParts = formData.value.attachments?.map(item => item.part) || []
}

/** 选择本地附件，仅 H5 支持 */
function handleAddAttachment() {
  // #ifdef H5
  uni.chooseFile({
    count: 5,
    success: (res) => {
      newFiles.value = [...newFiles.value, ...(res.tempFiles as unknown as File[])]
    },
  })
  // #endif
}

/** 纯文本转正文 HTML，回复或转发时拼接原文引用 */
function buildContent() {
  const textHtml = contentText.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
  return quoteContent.value ? `${textHtml}<br/>${quoteContent.value}` : textHtml
}

/** 草稿正文 HTML 还原为可编辑纯文本：换行标签转 \n，剥离其余标签并反转义 */
function htmlToEditableText(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

/** 提交数据：附件回显字段不参与提交 */
function buildSubmitData(): Partial<MailMessage> {
  return {
    ...formData.value,
    content: buildContent(),
    attachments: undefined,
  }
}

/** 发送邮件 */
async function handleSend() {
  if (!formData.value.recipients?.length) {
    toast.warning('请填写收件人')
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认发送这封邮件？' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    const result = newFiles.value.length
      ? await sendMailMessageWithFiles(buildSubmitData(), newFiles.value)
      : await sendMailMessage(buildSubmitData())
    toast.success(result || '发送成功')
    uni.$emit('oa:mail:reload')
    navigateBackPlus('/pages-oa/mail/index')
  } finally {
    formLoading.value = false
  }
}

/** 保存草稿，保留返回编号供后续保存更新同一封草稿 */
async function handleSaveDraft() {
  savingDraft.value = true
  try {
    const draftId = newFiles.value.length
      ? await saveMailMessageDraftWithFiles(buildSubmitData(), newFiles.value)
      : await saveMailMessageDraft(buildSubmitData())
    formData.value.draftId = draftId
    newFiles.value = []
    // 重新获取草稿，刷新附件 MIME 部件路径，避免连续保存/发送时按旧路径丢附件
    const draft = await getMailMessageCompose(draftId, OA_MAIL_COMPOSE_MODE.DRAFT)
    formData.value.attachments = draft.attachments
    formData.value.attachmentParts = draft.attachments?.map(item => item.part) || []
    toast.success('保存成功')
    uni.$emit('oa:mail:reload')
  } finally {
    savingDraft.value = false
  }
}

/** 删除草稿 */
async function handleDelete() {
  if (!formData.value.draftId) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确认将这封草稿移至已删除？' })
  } catch {
    return
  }
  formLoading.value = true
  try {
    await deleteMailMessage(formData.value.draftId)
    toast.success('删除成功')
    uni.$emit('oa:mail:reload')
    navigateBackPlus('/pages-oa/mail/index')
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  // 回复、转发或草稿：获取写信预填数据
  if (props.id && props.mode && props.mode !== OA_MAIL_COMPOSE_MODE.NEW) {
    const data = await getMailMessageCompose(Number(props.id), props.mode)
    if (props.mode === OA_MAIL_COMPOSE_MODE.DRAFT) {
      // 草稿：原正文回填为可编辑纯文本，不作为只读引用
      contentText.value = htmlToEditableText(data.content || '')
      data.content = ''
    } else {
      // 回复、转发：原文作为引用展示
      quoteContent.value = data.content || ''
      data.content = ''
    }
    formData.value = data
  }
})
</script>
