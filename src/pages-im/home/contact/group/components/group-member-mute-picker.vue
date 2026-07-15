<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="bg-white px-28rpx pb-[calc(28rpx+env(safe-area-inset-bottom))] pt-28rpx">
      <view class="flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">设置禁言</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>
      <view class="mt-28rpx flex items-center gap-20rpx rounded-12rpx bg-[#f7f7f7] px-20rpx py-18rpx">
        <ImAvatar :src="member?.avatar" :name="member?.nickname" size="72rpx" />
        <view class="min-w-0 flex-1">
          <view class="text-24rpx text-[#999]">
            禁言成员
          </view>
          <view class="mt-4rpx truncate text-28rpx text-[#333]">
            {{ memberName }}
          </view>
        </view>
      </view>
      <view class="mt-28rpx text-26rpx text-[#666]">
        禁言时长
      </view>
      <wd-radio-group v-model="selectedSeconds" type="button" custom-class="mt-16rpx flex flex-wrap gap-16rpx">
        <wd-radio
          v-for="item in mutePresets"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </wd-radio>
      </wd-radio-group>
      <wd-button block type="primary" :loading="submitting" custom-class="mt-32rpx" @click="confirm">
        确定
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../types'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { muteMember } from '@/api/im/group'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  groupId: number // 当前群编号
}>()

const emit = defineEmits<{
  success: [] // 禁言成功
}>()

const toast = useToast()
const visible = ref(false) // 禁言时长弹窗显示状态
const submitting = ref(false) // 禁言提交状态
const member = ref<GroupMember>() // 当前禁言成员
const selectedSeconds = ref(600) // 当前禁言时长
const mutePresets = [ // 禁言时长选项，与 PC 保持一致
  { label: '10 分钟', value: 600 },
  { label: '1 小时', value: 3600 },
  { label: '12 小时', value: 43200 },
  { label: '1 天', value: 86400 },
  { label: '7 天', value: 604800 },
  { label: '30 天', value: 2592000 },
  { label: '永久', value: 0 },
]
const memberName = computed(() => member.value ? getMemberDisplayName(member.value) : '') // 当前成员显示名

/** 打开禁言时长选择 */
function open(item: GroupMember) {
  member.value = item
  selectedSeconds.value = 600
  submitting.value = false
  visible.value = true
}

/** 确认禁言 */
async function confirm() {
  if (!props.groupId || !member.value) {
    return
  }
  submitting.value = true
  try {
    await muteMember({
      id: props.groupId,
      userId: member.value.userId,
      mutedSeconds: selectedSeconds.value,
    })
    toast.success('禁言成功')
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
