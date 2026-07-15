<template>
  <GroupMemberPicker
    ref="pickerRef"
    v-model="selectedIds"
    title="移出群成员"
    confirm-text="移出"
    :members="members"
    :max-size="maxSize"
    :loading="submitting"
    :close-on-confirm="false"
    empty-tip="暂无可移出的群成员"
    @confirm="confirm"
  />
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../types'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { removeGroupMember } from '@/api/im/group/member'
import GroupMemberPicker from './group-member-picker.vue'

const props = withDefaults(defineProps<{
  groupId: number // 当前群编号
  members: GroupMember[] // 当前可移出的群成员
  maxSize?: number // 单次最多移出人数
}>(), {
  maxSize: 50,
})

const emit = defineEmits<{
  success: [] // 批量移出成功
}>()

const dialog = useDialog()
const toast = useToast()
const pickerRef = ref<InstanceType<typeof GroupMemberPicker>>() // 群成员选择器引用
const selectedIds = ref<number[]>([]) // 当前选中成员编号
const submitting = ref(false) // 批量移出提交状态

/** 打开批量移出选择 */
function open() {
  selectedIds.value = []
  submitting.value = false
  pickerRef.value?.open([])
}

/** 确认批量移出 */
async function confirm(memberUserIds: number[]) {
  if (!props.groupId || memberUserIds.length === 0) {
    return
  }
  try {
    await dialog.confirm({ title: '移出群聊', msg: `确定将选中的 ${memberUserIds.length} 位成员移出群聊吗？` })
  } catch {
    return
  }
  submitting.value = true
  try {
    await removeGroupMember({ groupId: props.groupId, memberUserIds })
    toast.success(`已移出 ${memberUserIds.length} 位成员`)
    pickerRef.value?.close()
    emit('success')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
