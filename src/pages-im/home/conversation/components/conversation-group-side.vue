<template>
  <view class="h-full min-h-0 flex flex-col">
    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 群成员九宫格 -->
      <ConversationGroupMemberSection
        :members="currentMembers"
        :can-invite="!isQuitGroupDetail"
        :can-manage="removableMembers.length > 0"
        @member-click="onMemberTap"
        @member-longpress="onMemberLongpress"
        @invite="openInvitePicker"
        @manage="openMemberManage"
      />

      <!-- 群信息 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="群聊名称" :value="formData?.name || '-'" :is-link="isOwner" center @click="editGroupInfo" />
          <wd-cell title="群公告" :value="formData?.notice || '未设置'" :is-link="isOwner" center @click="editGroupInfo" />
          <wd-cell
            title="我在本群的昵称"
            :value="myGroupNick || '未设置'"
            :is-link="!isQuitGroupDetail"
            center
            @click="editMyNick"
          />
          <wd-cell
            title="群聊备注"
            :value="myGroupRemark || '未设置'"
            :is-link="!isQuitGroupDetail"
            center
            @click="editGroupRemark"
          />
        </wd-cell-group>
      </view>

      <!-- 聊天记录与推荐 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="查找聊天内容" is-link center @click="goHistory" />
          <wd-cell v-if="!isQuitGroupDetail" title="推荐群聊给朋友" is-link center @click="recommendVisible = true" />
          <wd-cell title="清空聊天记录" is-link center @click="clearHistory" />
        </wd-cell-group>
      </view>

      <!-- 群管理（群主 / 管理员） -->
      <view v-if="canManageGroup" class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="全员禁言" center>
            <wd-switch v-model="mutedAll" size="40rpx" @change="onMuteAllChange" />
          </wd-cell>
          <wd-cell v-if="isOwner" title="进群需审批" center>
            <wd-switch v-model="joinApproval" size="40rpx" @change="onJoinApprovalChange" />
          </wd-cell>
          <wd-cell v-if="joinApproval" title="进群申请" is-link center @click="goGroupRequests" />
        </wd-cell-group>
      </view>

      <!-- 群主操作 -->
      <view v-if="isOwner" class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="群管理员设置" is-link center @click="openAdminPicker" />
          <wd-cell title="转让群主" is-link center @click="openOwnerTransferPicker" />
        </wd-cell-group>
      </view>

      <!-- 个人设置 -->
      <view v-if="!isQuitGroupDetail" class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="置顶聊天" center>
            <wd-switch
              v-model="pinned"
              size="40rpx"
              :disabled="pinPending"
              @change="onPinnedChange"
            />
          </wd-cell>
          <wd-cell title="消息免打扰" center>
            <wd-switch v-model="mySilent" size="40rpx" @change="onSilentChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 退出 / 解散 -->
      <view v-if="!isQuitGroupDetail" class="mt-20rpx">
        <wd-cell-group>
          <wd-cell
            clickable
            center
            value-align="center"
            custom-class="!h-94rpx"
            custom-value-class="!text-32rpx !text-[#fa5151]"
            @click="isOwner ? handleDissolve() : handleQuit()"
          >
            {{ isOwner ? '解散群聊' : '退出群聊' }}
          </wd-cell>
        </wd-cell-group>
      </view>
      <view class="h-40rpx" />
    </scroll-view>

    <!-- 邀请成员 -->
    <GroupMemberAddPicker
      ref="invitePickerRef"
      :group-id="formData?.id || 0"
      :member-user-ids="currentMemberUserIds"
      :max-size="remainingMemberCount"
      :approval-required="joinApproval && currentMember?.role === ImGroupMemberRole.NORMAL"
      @reload="getDetail"
    />

    <!-- 推荐群名片 -->
    <RecommendCardPicker v-if="groupCard" v-model="recommendVisible" :card="groupCard" />

    <!-- 成员管理菜单 -->
    <GroupMemberActionSheet
      ref="memberActionRef"
      :group-id="formData?.id || 0"
      :members="currentMembers"
      :is-owner="isOwner"
      @reload="getDetail"
    />

    <!-- 批量移出成员 -->
    <GroupMemberRemovePicker
      ref="memberRemovePickerRef"
      :group-id="formData?.id || 0"
      :members="removableMembers"
      @success="getDetail"
    />

    <!-- 设置群管理员 -->
    <GroupAdminPicker
      ref="adminPickerRef"
      :group-id="formData?.id || 0"
      :members="currentMembers"
      @success="getDetail"
    />

    <!-- 转让群主 -->
    <GroupOwnerTransferPicker
      ref="ownerTransferPickerRef"
      :group-id="formData?.id || 0"
      :members="currentMembers"
      :current-user-id="userStore.userInfo.userId"
      @success="getDetail"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Group, GroupMember } from '../../types'
import { toGroupCardTarget } from '@/pages-im/utils/message'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { muteAll, updateGroup } from '@/api/im/group'
import { getClientConversationId } from '@/pages-im/utils/db'
import { GROUP_MAX_MEMBER } from '@/pages-im/utils/config'
import { isGroupQuit } from '@/pages-im/utils/user'
import { useUserStore } from '@/store/user'
import { delay } from '@/utils'
import {
  CommonStatusEnum,
  ImConversationType,
  ImGroupMemberRole,
  ImMessageType,
} from '@/pages-im/utils/constants'
import { useConversationStore } from '../../store/conversationStore'
import { useGroupStore } from '../../store/groupStore'
import { useImRuntimeStore } from '../../store/runtimeStore'
import RecommendCardPicker from '../../components/user/recommend-card-picker.vue'
import GroupMemberActionSheet from './group-member-action-sheet.vue'
import ConversationGroupMemberSection from './conversation-group-member-section.vue'
import GroupAdminPicker from '../../contact/group/components/group-admin-picker.vue'
import GroupMemberAddPicker from '../../contact/group/components/group-member-add-picker.vue'
import GroupMemberRemovePicker from '../../contact/group/components/group-member-remove-picker.vue'
import GroupOwnerTransferPicker from '../../contact/group/components/group-owner-transfer-picker.vue'

const props = defineProps<{
  id?: number | string
  active?: boolean
}>()

const emit = defineEmits<{
  'close': [] // 关闭群设置
  'edit': [groupId: number] // 编辑群资料
  'history': [group: Group] // 查找聊天内容
  'requests': [groupId: number] // 查看进群申请
  'member-profile': [member: GroupMember, groupName: string] // 查看成员资料
  'loaded': [group: Group, memberCount: number] // 群资料加载完成
}>()

const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const groupStore = useGroupStore()
const loading = ref(false) // 详情加载状态
const formData = ref<Group>() // 群详情
const members = ref<GroupMember[]>([]) // 群成员
const invitePickerRef = ref<InstanceType<typeof GroupMemberAddPicker>>() // 邀请成员选择器引用
const memberActionRef = ref<InstanceType<typeof GroupMemberActionSheet>>() // 成员管理菜单引用
const memberRemovePickerRef = ref<InstanceType<typeof GroupMemberRemovePicker>>() // 批量移出成员选择器引用
const adminPickerRef = ref<InstanceType<typeof GroupAdminPicker>>() // 群管理员选择器引用
const ownerTransferPickerRef = ref<InstanceType<typeof GroupOwnerTransferPicker>>() // 新群主选择器引用
const recommendVisible = ref(false) // 推荐群名片弹窗
const mutedAll = ref(false) // 全员禁言
const joinApproval = ref(false) // 进群审批
const pinned = ref(false) // 是否置顶当前群聊
const pinPending = ref(false) // 置顶状态提交中
const mySilent = ref(false) // 我的群免打扰
const groupRelationInvalid = ref(false) // 当前账号与群关系是否已终止
const memberDetailLoaded = ref(false) // 当前成员关系是否已成功刷新
const conversationStore = useConversationStore()
const {
  clearConversationMessages,
  ensureConversation,
  setConversationTop,
} = conversationStore

/** 当前用户群成员 */
const currentMembers = computed(() => members.value.filter( // 当前有效群成员
  member => member.status !== CommonStatusEnum.DISABLE,
).sort((left, right) => {
  const leftRole = left.role ?? ImGroupMemberRole.NORMAL
  const rightRole = right.role ?? ImGroupMemberRole.NORMAL
  return leftRole !== rightRole ? leftRole - rightRole : left.userId - right.userId
}))
const currentMember = computed(() => currentMembers.value.find(item => item.userId === userStore.userInfo.userId))
const currentMemberUserIds = computed(() => currentMembers.value.map(item => item.userId)) // 当前群成员编号
const remainingMemberCount = computed(() => Math.max(0, GROUP_MAX_MEMBER - currentMembers.value.length)) // 剩余可邀请人数
const isQuitGroupDetail = computed(() => groupRelationInvalid.value
  || isGroupQuit(formData.value)) // 历史退群群只读展示

/** 是否可管理群（群主 / 管理员） */
const canManageGroup = computed(() => memberDetailLoaded.value && !isQuitGroupDetail.value
  && (currentMember.value?.role === ImGroupMemberRole.OWNER
    || currentMember.value?.role === ImGroupMemberRole.ADMIN))

/** 是否群主 */
const isOwner = computed(() => memberDetailLoaded.value && !isQuitGroupDetail.value
  && currentMember.value?.role === ImGroupMemberRole.OWNER)
const removableMembers = computed(() => currentMembers.value.filter(canManageMember)) // 当前可移出的群成员

/** 我在本群的昵称 */
const myGroupNick = computed(() => currentMember.value?.displayUserName || '')
const myGroupRemark = computed(() => formData.value?.groupRemark || '') // 群聊备注
const groupCard = computed(() => toGroupCardTarget({ // 群名片
  id: Number(props.id),
  name: formData.value?.name || '群聊',
  showImage: formData.value?.avatar,
  memberCount: currentMembers.value.length,
}))

/** 获取指定群会话 */
function getConversation(groupId = Number(props.id)) {
  return conversationStore.getConversation(ImConversationType.GROUP, groupId)
}

/** 清空已失效的群详情状态 */
function resetDetailState() {
  formData.value = undefined
  members.value = []
  groupRelationInvalid.value = false
  memberDetailLoaded.value = false
  mutedAll.value = false
  joinApproval.value = false
  mySilent.value = false
  pinned.value = false
  pinPending.value = false
  loading.value = false
}

/** 是否可管理成员 */
function canManageMember(item: GroupMember) {
  if (!canManageGroup.value || item.userId === userStore.userInfo.userId || item.role === ImGroupMemberRole.OWNER) {
    return false
  }
  return isOwner.value || item.role === ImGroupMemberRole.NORMAL
}

/** 打开批量移出成员选择 */
function openMemberManage() {
  memberRemovePickerRef.value?.open()
}

/** 打开好友邀请选择 */
function openInvitePicker() {
  if (isQuitGroupDetail.value) {
    return
  }
  if (remainingMemberCount.value <= 0) {
    toast.show(`群成员上限为 ${GROUP_MAX_MEMBER} 人`)
    return
  }
  invitePickerRef.value?.open()
}

/** 点击成员资料 */
function onMemberTap(item: GroupMember) {
  emit('member-profile', item, formData.value?.name || '')
}

/** 长按群成员：有管理权限时打开菜单 */
function onMemberLongpress(item: GroupMember) {
  if (canManageMember(item)) {
    memberActionRef.value?.open(item)
  }
}

/** 编辑群资料（群名 / 公告，跳编辑页） */
function editGroupInfo() {
  if (!isOwner.value || !formData.value?.id) {
    return
  }
  emit('edit', formData.value.id)
}

/** 编辑我在本群的昵称 */
async function editMyNick() {
  const groupId = Number(props.id)
  if (!groupId || isQuitGroupDetail.value) {
    return
  }
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '我在本群的昵称',
      inputValue: myGroupNick.value,
      inputProps: { placeholder: '请输入昵称' },
    })
    value = result.value
  } catch {
    return
  }
  await groupStore.updateMyGroupMember(groupId, { displayUserName: String(value || '') })
  await loadDetail(groupId)
  toast.success('已保存')
}

/** 编辑仅自己可见的群聊备注 */
async function editGroupRemark() {
  const groupId = Number(props.id)
  if (!groupId || isQuitGroupDetail.value) {
    return
  }
  let value: string | number | undefined
  try {
    const result = await dialog.prompt({
      title: '群聊备注',
      inputValue: myGroupRemark.value,
      inputProps: { placeholder: '备注仅自己可见' },
    })
    value = result.value
  } catch {
    return
  }
  await groupStore.updateMyGroupMember(groupId, { groupRemark: String(value || '') })
  await loadDetail(groupId)
  toast.success('已保存')
}

/** 查找聊天内容 */
function goHistory() {
  if (!formData.value?.id) {
    return
  }
  emit('history', formData.value)
}

/** 清空当前群的本地聊天记录 */
async function clearHistory() {
  const groupId = Number(props.id)
  if (!groupId) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定清空本机中的群聊记录吗？该操作不可恢复。' })
  } catch {
    return
  }
  await clearConversationMessages(getClientConversationId(ImConversationType.GROUP, groupId))
  toast.success('聊天记录已清空')
}

/** 进群申请 */
function goGroupRequests() {
  if (!formData.value?.id) {
    return
  }
  emit('requests', formData.value.id)
}

/** 打开群管理员设置 */
function openAdminPicker() {
  adminPickerRef.value?.open()
}

/** 打开群主转让选择 */
function openOwnerTransferPicker() {
  ownerTransferPickerRef.value?.open()
}

/** 全员禁言切换 */
async function onMuteAllChange() {
  const groupId = Number(props.id)
  const nextMutedAll = mutedAll.value
  if (!groupId || isQuitGroupDetail.value) {
    mutedAll.value = !!formData.value?.mutedAll
    return
  }
  try {
    await muteAll({ id: groupId, mutedAll: nextMutedAll })
  } catch {
    mutedAll.value = !nextMutedAll
  }
}

/** 进群审批切换 */
async function onJoinApprovalChange() {
  const groupId = Number(props.id)
  const nextJoinApproval = joinApproval.value
  if (!groupId || isQuitGroupDetail.value) {
    joinApproval.value = !!formData.value?.joinApproval
    return
  }
  try {
    await updateGroup({ id: groupId, joinApproval: nextJoinApproval })
  } catch {
    joinApproval.value = !nextJoinApproval
  }
}

/** 群免打扰切换 */
async function onSilentChange() {
  const groupId = Number(props.id)
  const nextSilent = mySilent.value
  if (!groupId || isQuitGroupDetail.value) {
    mySilent.value = !!formData.value?.silent
    return
  }
  try {
    await groupStore.updateMyGroupMember(groupId, { silent: nextSilent })
  } catch {
    mySilent.value = !nextSilent
  }
}

/** 切换群聊置顶 */
async function onPinnedChange() {
  const nextPinned = pinned.value
  const groupId = Number(props.id)
  const group = formData.value ? { ...formData.value } : undefined
  if (!groupId || !group || isQuitGroupDetail.value) {
    pinned.value = !!getConversation()?.top
    return
  }
  pinPending.value = true
  try {
    if (!getConversation(groupId) && nextPinned) {
      await ensureConversation({
        type: ImConversationType.GROUP,
        targetId: groupId,
        name: group.name,
        avatar: group.avatar || '',
        silent: group.silent,
      })
    }
    if (!getConversation(groupId)) {
      pinned.value = false
      return
    }
    await setConversationTop(
      ImConversationType.GROUP,
      groupId,
      nextPinned,
    )
    pinned.value = nextPinned
  } catch {
    pinned.value = !!getConversation(groupId)?.top
  } finally {
    pinPending.value = false
  }
}

/** 退出群聊 */
async function handleQuit() {
  const groupId = Number(props.id)
  const groupName = formData.value?.name || ''
  if (!groupId) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定退出"${groupName}"吗？` })
  } catch {
    return
  }
  await groupStore.quitGroup(groupId)
  toast.success('已退出群聊')
  delay(() => emit('close'))
}

/** 解散群聊 */
async function handleDissolve() {
  const groupId = Number(props.id)
  const groupName = formData.value?.name || ''
  if (!groupId) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定解散"${groupName}"吗？` })
  } catch {
    return
  }
  await groupStore.dissolveGroup(groupId)
  toast.success('已解散群聊')
  delay(() => emit('close'))
}

/** 加载群详情 */
async function loadDetail(groupId: number) {
  memberDetailLoaded.value = false
  loading.value = true
  try {
    const [group, memberList] = await Promise.all([
      groupStore.fetchGroupInfo(groupId, true),
      groupStore.fetchGroupMemberList(groupId, true),
    ])
    if (!group) {
      return
    }
    formData.value = group
    members.value = memberList
    const activeSelfMember = memberList.find(member => member.userId === useUserStore().userInfo.userId
      && member.status !== CommonStatusEnum.DISABLE)
    groupRelationInvalid.value = !activeSelfMember
    memberDetailLoaded.value = !!activeSelfMember
    mutedAll.value = !!group.mutedAll
    joinApproval.value = !!group.joinApproval
    mySilent.value = !!group.silent
    emit('loaded', group, memberList.filter(member => member.status !== CommonStatusEnum.DISABLE).length)
  } finally {
    loading.value = false
  }
}

/** 加载详情 */
async function getDetail() {
  const groupId = Number(props.id)
  if (!groupId) {
    return
  }
  await loadDetail(groupId)
}

/** 同步群会话置顶状态 */
watch(
  () => getConversation()?.top,
  (value) => {
    if (!pinPending.value) {
      pinned.value = !!value
    }
  },
  { immediate: true },
)

/** 账号、群聊或显示状态变化时刷新群资料 */
watch(
  () => [props.active !== false, Number(props.id)] as const,
  ([active, groupId], previous) => {
    const previousGroupId = previous?.[1]
    if (previous && previousGroupId !== groupId) {
      resetDetailState()
    }
    if (!active || !groupId) {
      return
    }
    void (async () => {
      if (!await useImRuntimeStore().ensure()) {
        return
      }
      await loadDetail(groupId)
    })().catch(error => console.warn('[IM group detail] 加载失败', error))
  },
  { immediate: true },
)

/** 解析群事件内容 */
function parseGroupEventContent(payload: any) {
  if (typeof payload?.content !== 'string') {
    return payload || {}
  }
  try {
    return JSON.parse(payload.content)
  } catch {
    return payload
  }
}

/** 接收当前群详情的实时状态事件 */
function handleImEvent(data: { conversationType?: number, contentType?: number, payload?: any }) {
  if (data.conversationType !== ImConversationType.GROUP || !data.contentType || !data.payload) {
    return
  }
  const groupId = Number(data.payload.groupId)
  if (!groupId || groupId !== Number(props.id)) {
    return
  }
  const content = parseGroupEventContent(data.payload)
  const userId = useUserStore().userInfo.userId
  const removedSelf = data.contentType === ImMessageType.GROUP_DISSOLVE
    || (data.contentType === ImMessageType.GROUP_MEMBER_QUIT
      && Number(content.operatorUserId || data.payload.operatorUserId) === userId)
    || (data.contentType === ImMessageType.GROUP_MEMBER_KICK
      && (content.memberUserIds || data.payload.memberUserIds || []).map(Number).includes(userId))
  if (removedSelf) {
    groupRelationInvalid.value = true
    memberDetailLoaded.value = false
    pinned.value = false
    pinPending.value = false
    loading.value = false
    if (formData.value) {
      formData.value = { ...formData.value, joinStatus: CommonStatusEnum.DISABLE }
    }
    members.value = members.value.map(member => member.userId === userId
      ? { ...member, status: CommonStatusEnum.DISABLE }
      : member)
    if (formData.value) {
      emit('loaded', formData.value, currentMembers.value.length)
    }
    return
  }
  if (props.active === false) {
    return
  }
  void getDetail().catch(() => undefined)
}

/** 订阅群详情实时变化 */
onMounted(() => uni.$on('im:event', handleImEvent))

/** 释放群详情订阅 */
onUnmounted(() => uni.$off('im:event', handleImEvent))
</script>
