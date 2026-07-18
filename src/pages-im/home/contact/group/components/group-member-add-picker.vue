<template>
  <FriendPicker
    ref="pickerRef"
    v-model="selectedUserIds"
    :disabled-ids="memberUserIds"
    :max-size="maxSize"
    @confirm="handleConfirm"
  />
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { inviteGroupMember } from '@/api/im/group/member'
import FriendPicker from '../../components/friend-picker.vue'

const props = defineProps<{
  groupId: number // 当前群编号
  memberUserIds: number[] // 已在群内的用户编号
  maxSize: number // 最多可邀请人数
  approvalRequired?: boolean // 是否需要进群审批
}>()

const emit = defineEmits<{
  reload: [memberUserIds: number[]] // 邀请完成后刷新
}>()

const toast = useToast()
const pickerRef = ref<InstanceType<typeof FriendPicker>>() // 好友选择器引用
const selectedUserIds = ref<number[]>([]) // 已选好友编号
const submitting = ref(false) // 邀请提交状态

/** 打开好友选择器 */
function open() {
  selectedUserIds.value = []
  pickerRef.value?.open()
}

/** 邀请群成员 */
async function handleConfirm(memberUserIds: number[]) {
  if (memberUserIds.length === 0) {
    toast.show('请选择邀请成员')
    return
  }
  if (!props.groupId || submitting.value) {
    return
  }
  submitting.value = true
  try {
    await inviteGroupMember({ groupId: props.groupId, memberUserIds })
    toast.success(props.approvalRequired ? '邀请申请已发送，等待群主或管理员处理' : '邀请成功')
    selectedUserIds.value = []
    emit('reload', memberUserIds)
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
