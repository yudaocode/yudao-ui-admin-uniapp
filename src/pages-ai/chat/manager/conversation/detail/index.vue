<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="对话详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="对话编号" :value="formData?.id || '-'" />
        <wd-cell title="用户" :value="getUserName(formData?.userId)" />
        <wd-cell title="对话标题" :value="formData?.title || '-'" />
        <wd-cell title="是否置顶" :value="formData?.pinned ? '是' : '否'" />
        <wd-cell title="角色头像">
          <wd-img
            v-if="formData?.roleAvatar"
            :src="formData.roleAvatar"
            width="80rpx"
            height="80rpx"
            mode="aspectFill"
            round
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="角色" :value="formData?.roleName || String(formData?.roleId || '-')" />
        <wd-cell title="模型" :value="formData?.modelName || formData?.model || '-'" />
        <wd-cell title="角色设定" :value="formData?.systemMessage || '-'" />
        <wd-cell title="温度参数" :value="formData?.temperature ?? '-'" />
        <wd-cell title="最大 Token" :value="formData?.maxTokens ?? '-'" />
        <wd-cell title="上下文数量" :value="formData?.maxContexts ?? '-'" />
        <wd-cell title="消息数量" :value="formData?.messageCount ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleMessages">
          查看消息
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:chat-conversation:delete'])"
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
import type { ChatConversation } from '@/api/ai/chat/conversation'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteChatConversationByAdmin, getChatConversation } from '@/api/ai/chat/conversation'
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
const formData = ref<ChatConversation>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/chat/manager/index')
}

/** 加载对话详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getChatConversation(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 查看对话消息 */
function handleMessages() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-ai/chat/manager/index?tab=message&conversationId=${formData.value.id}`,
  })
}

/** 删除聊天对话 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该聊天对话吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteChatConversationByAdmin(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:chat-conversation:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
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
