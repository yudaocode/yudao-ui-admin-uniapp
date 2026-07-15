<template>
  <wd-action-sheet v-model="visible" :actions="actions" @select="handleSelect" />
  <GroupMemberMutePicker
    ref="mutePickerRef"
    :group-id="groupId"
    @success="emit('reload')"
  />
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../../types'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  addGroupAdmin,
  cancelMuteMember,
  removeGroupAdmin,
  transferGroupOwner,
} from '@/api/im/group'
import { removeGroupMember } from '@/api/im/group/member'
import { GROUP_ADMIN_MAX_COUNT } from '@/pages-im/utils/config'
import { ImGroupMemberRole } from '@/pages-im/utils/constants'
import { toTimestamp } from '@/pages-im/utils/time'
import { getMemberDisplayName } from '@/pages-im/utils/user'
import GroupMemberMutePicker from '../../components/group-member-mute-picker.vue'

interface MemberAction {
  name: string
  value: string
  color?: string
}

const props = defineProps<{
  groupId: number // 当前群编号
  members: GroupMember[] // 当前有效群成员
  isOwner: boolean // 当前用户是否群主
}>()

const emit = defineEmits<{
  reload: [] // 刷新群资料
}>()

const dialog = useDialog()
const toast = useToast()
const visible = ref(false) // 成员操作菜单显示状态
const member = ref<GroupMember>() // 当前操作成员
const actions = ref<MemberAction[]>([]) // 当前成员操作项
const mutePickerRef = ref<InstanceType<typeof GroupMemberMutePicker>>() // 禁言时长选择器引用

/** 打开成员管理菜单 */
function open(item: GroupMember) {
  const menu: MemberAction[] = []
  if (props.isOwner) {
    menu.push(item.role === ImGroupMemberRole.ADMIN
      ? { name: '撤销管理员', value: 'removeAdmin' }
      : { name: '设为管理员', value: 'addAdmin' })
    menu.push({ name: '转让群主', value: 'transferOwner' })
  }
  if (toTimestamp(item.muteEndTime) > Date.now()) {
    menu.push({ name: '取消禁言', value: 'cancelMute' })
  } else {
    menu.push({ name: '设置禁言', value: 'mute' })
  }
  menu.push({ name: '移出群聊', value: 'remove', color: '#fa5151' })
  member.value = item
  actions.value = menu
  visible.value = true
}

/** 执行成员管理操作 */
async function handleSelect({ item: action }: { item: MemberAction }) {
  const current = member.value
  if (!current || !props.groupId) {
    return
  }
  if (action.value === 'addAdmin') {
    const adminCount = props.members.filter(item => item.role === ImGroupMemberRole.ADMIN).length
    if (adminCount >= GROUP_ADMIN_MAX_COUNT) {
      toast.show(`群管理员上限为 ${GROUP_ADMIN_MAX_COUNT} 人`)
      return
    }
    await addGroupAdmin({ id: props.groupId, userIds: [current.userId] })
    toast.success('已设为管理员')
  } else if (action.value === 'removeAdmin') {
    await removeGroupAdmin({ id: props.groupId, userIds: [current.userId] })
    toast.success('已撤销管理员')
  } else if (action.value === 'transferOwner') {
    try {
      await dialog.confirm({ title: '提示', msg: `确定将群主转让给"${getMemberDisplayName(current)}"吗？` })
    } catch {
      return
    }
    await transferGroupOwner({ id: props.groupId, newOwnerUserId: current.userId })
    toast.success('已转让群主')
  } else if (action.value === 'mute') {
    mutePickerRef.value?.open(current)
    return
  } else if (action.value === 'cancelMute') {
    await cancelMuteMember({ id: props.groupId, userId: current.userId })
    toast.success('已取消禁言')
  } else if (action.value === 'remove') {
    try {
      await dialog.confirm({ title: '提示', msg: `确定将"${getMemberDisplayName(current)}"移出群聊吗？` })
    } catch {
      return
    }
    await removeGroupMember({ groupId: props.groupId, memberUserIds: [current.userId] })
    toast.success('已移出群聊')
  }
  emit('reload')
}

defineExpose({ open })
</script>
