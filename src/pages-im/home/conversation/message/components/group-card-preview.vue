<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view v-if="card" class="bg-[#f5f5f5] pb-[calc(24rpx+env(safe-area-inset-bottom))]">
      <!-- 顶部标题 -->
      <view class="flex items-center justify-between bg-white px-28rpx py-22rpx">
        <text class="text-32rpx text-[#333] font-semibold">群聊资料</text>
        <wd-icon name="close" size="34rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 群资料摘要 -->
      <view class="flex flex-col items-center bg-white px-32rpx pb-38rpx pt-24rpx">
        <ImAvatar :src="card.avatar" :name="card.name" :round="false" size="128rpx" />
        <text class="mt-20rpx max-w-full truncate text-36rpx text-[#222] font-medium">
          {{ card.name || '群聊' }}
        </text>
        <text class="mt-10rpx text-25rpx text-[#999]">
          {{ card.memberCount ? `${card.memberCount} 位成员` : '群聊' }}
        </text>
      </view>

      <!-- 名片来源 -->
      <view class="mt-20rpx bg-white">
        <wd-cell title="来源" value="群名片" center />
      </view>

      <!-- 加群操作 -->
      <view class="px-28rpx pt-28rpx">
        <wd-button v-if="canApply" type="primary" block @click="handleApply">
          申请加入群聊
        </wd-button>
        <view v-else class="py-20rpx text-center text-26rpx text-[#999]">
          该群聊当前不可加入
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { CardMessage } from '@/pages-im/utils/message'
import type { GroupCardPreviewOptions } from '../../../composables/useMessageContentActions'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { applyJoinGroup } from '@/api/im/group/request'
import { ImGroupAddSource } from '@/pages-im/utils/constants'
import ImAvatar from '../../../components/im-avatar.vue'

const dialog = useDialog()
const toast = useToast()
const visible = ref(false) // 是否显示
const card = ref<CardMessage>() // 群名片快照
const canApply = ref(true) // 是否允许申请加入

/** 打开群名片资料 */
function open(options: GroupCardPreviewOptions) {
  card.value = { ...options.card }
  canApply.value = options.canApply
  visible.value = true
}

/** 申请加入群聊 */
async function handleApply() {
  if (!card.value) {
    return
  }
  visible.value = false
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: card.value.name || '申请加入群聊',
      inputValue: '你好，我想加入群聊',
      inputProps: { placeholder: '请输入申请理由' },
    })
    value = result.value
  } catch {
    return
  }
  await applyJoinGroup({
    groupId: card.value.targetId,
    applyContent: String(value || '你好，我想加入群聊'),
    addSource: ImGroupAddSource.SHARE_LINK,
  })
  toast.success('申请已发送')
}

defineExpose({ open })
</script>
