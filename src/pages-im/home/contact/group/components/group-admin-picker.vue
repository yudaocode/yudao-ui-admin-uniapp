<template>
  <GroupMemberPicker
    ref="pickerRef"
    v-model="selectedIds"
    title="设置群管理员"
    :members="members"
    :hide-ids="ownerUserIds"
    :max-size="GROUP_ADMIN_MAX_COUNT"
    allow-empty
    :loading="submitting"
    :close-on-confirm="false"
    @confirm="confirm"
  />
</template>

<script lang="ts" setup>
import type { GroupMember } from '../../../types'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { addGroupAdmin, removeGroupAdmin } from '@/api/im/group'
import { GROUP_ADMIN_MAX_COUNT } from '@/pages-im/utils/config'
import { CommonStatusEnum, ImGroupMemberRole } from '@/pages-im/utils/constants'
import GroupMemberPicker from './group-member-picker.vue'

const props = defineProps<{
  groupId: number // 当前群编号
  members: GroupMember[] // 当前有效群成员
}>()

const emit = defineEmits<{
  success: [] // 管理员更新成功
}>()

const toast = useToast()
const pickerRef = ref<InstanceType<typeof GroupMemberPicker>>() // 群成员选择器引用
const selectedIds = ref<number[]>([]) // 当前选中管理员编号
const previousIds = ref<number[]>([]) // 打开时的管理员编号
const submitting = ref(false) // 管理员提交状态
const ownerUserIds = computed(() => props.members
  .filter(item => item.role === ImGroupMemberRole.OWNER)
  .map(item => item.userId)) // 群主编号

/** 打开管理员设置 */
function open() {
  previousIds.value = props.members
    .filter(item => item.role === ImGroupMemberRole.ADMIN && item.status !== CommonStatusEnum.DISABLE)
    .map(item => item.userId)
  selectedIds.value = [...previousIds.value]
  submitting.value = false
  pickerRef.value?.open(previousIds.value)
}

/** 确认管理员设置 */
async function confirm(nextIds: number[]) {
  if (!props.groupId) {
    return
  }
  const previousIdSet = new Set(previousIds.value)
  const nextIdSet = new Set(nextIds)
  const addedIds = nextIds.filter(id => !previousIdSet.has(id))
  const removedIds = previousIds.value.filter(id => !nextIdSet.has(id))
  if (addedIds.length === 0 && removedIds.length === 0) {
    pickerRef.value?.close()
    return
  }
  submitting.value = true
  try {
    if (addedIds.length > 0) {
      await addGroupAdmin({ id: props.groupId, userIds: addedIds })
    }
    if (removedIds.length > 0) {
      await removeGroupAdmin({ id: props.groupId, userIds: removedIds })
    }
    toast.success(`已更新群管理员（新增 ${addedIds.length} 位，撤销 ${removedIds.length} 位）`)
    pickerRef.value?.close()
    emit('success')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
