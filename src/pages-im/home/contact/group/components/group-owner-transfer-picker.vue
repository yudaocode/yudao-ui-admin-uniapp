<template>
  <GroupMemberPicker
    ref="pickerRef"
    v-model="selectedIds"
    title="选择新群主"
    :members="members"
    :hide-ids="[currentUserId]"
    :max-size="1"
    :loading="submitting"
    :close-on-confirm="false"
    @confirm="confirm"
  />
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../types'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { transferGroupOwner } from '@/api/im/group'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import GroupMemberPicker from './group-member-picker.vue'

const props = defineProps<{
  groupId: number // 当前群编号
  members: GroupMember[] // 当前有效群成员
  currentUserId: number // 当前用户编号
}>()

const emit = defineEmits<{
  success: [] // 群主转让成功
}>()

const dialog = useDialog()
const toast = useToast()
const pickerRef = ref<InstanceType<typeof GroupMemberPicker>>() // 群成员选择器引用
const selectedIds = ref<number[]>([]) // 当前选择的新群主编号
const submitting = ref(false) // 群主转让提交状态

/** 打开群主转让选择 */
function open() {
  selectedIds.value = []
  submitting.value = false
  pickerRef.value?.open([])
}

/** 确认转让群主 */
async function confirm(userIds: number[]) {
  const newOwner = props.members.find(item => item.userId === userIds[0])
  if (!props.groupId || !newOwner) {
    return
  }
  try {
    await dialog.confirm({
      title: '确认转让群主',
      msg: `确定将群主转让给“${getMemberDisplayName(newOwner)}”吗？转让后你将变为普通成员，无法撤销。`,
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await transferGroupOwner({ id: props.groupId, newOwnerUserId: newOwner.userId })
    toast.success('群主转让成功')
    pickerRef.value?.close()
    emit('success')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
