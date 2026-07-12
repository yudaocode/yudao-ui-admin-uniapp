<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="消息详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="消息编号" :value="formData?.id || '-'" />
        <wd-cell title="对话编号" :value="formData?.conversationId || '-'" />
        <wd-cell title="回复消息编号" :value="formData?.replyId || '-'" />
        <wd-cell title="用户" :value="getUserName(formData?.userId)" />
        <wd-cell title="消息类型" :value="formData?.type || '-'" />
        <wd-cell title="角色" :value="formData?.roleName || String(formData?.roleId || '-')" />
        <wd-cell title="模型" :value="formData?.model || '-'" />
        <wd-cell title="模型编号" :value="formData?.modelId || '-'" />
        <wd-cell title="消息内容" :value="formData?.content || '-'" />
        <wd-cell title="推理内容" :value="formData?.reasoningContent || '-'" />
        <wd-cell title="携带上下文" :value="formData?.useContext ? '是' : '否'" />
        <wd-cell title="知识库段落编号" :value="formatList(formData?.segmentIds)" />
        <wd-cell title="附件">
          <view v-if="formData?.attachmentUrls?.length">
            <view v-for="url in formData.attachmentUrls" :key="url" class="break-all text-26rpx text-[#666]">
              {{ url }}
            </view>
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="联网搜索">
          <view v-if="formData?.webSearchPages?.length">
            <view v-for="page in formData.webSearchPages" :key="page.url" class="mb-12rpx">
              <view class="text-26rpx text-[#333]">
                {{ page.title || page.name || '-' }}
              </view>
              <view class="break-all text-24rpx text-[#999]">
                {{ page.url }}
              </view>
            </view>
          </view>
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="formData?.conversationId" class="flex-1" type="primary" @click="handleConversation">
          查看对话
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:chat-message:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ChatMessage } from '@/api/ai/chat/message'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteChatMessageByAdmin, getChatMessage } from '@/api/ai/chat/message'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
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
const formData = ref<ChatMessage>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/chat/manager/index')
}

/** 加载消息详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getChatMessage(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 查看所属对话 */
function handleConversation() {
  if (!formData.value?.conversationId) {
    return
  }
  uni.navigateTo({
    url: `/pages-ai/chat/manager/conversation/detail/index?id=${formData.value.conversationId}`,
  })
}

/** 删除聊天消息 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该聊天消息吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteChatMessageByAdmin(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:chat-message:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 格式化编号列表 */
function formatList(value?: number[]) {
  return value?.length ? value.join('、') : '-'
}

/** 获取用户昵称 */
function getUserName(userId?: number) {
  return userList.value.find(user => user.id === userId)?.nickname || String(userId || '-')
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getSimpleUserList().then(data => userList.value = data),
  ])
})
</script>
