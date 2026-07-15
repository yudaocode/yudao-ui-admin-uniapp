<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="`聊天信息(${currentMembers.length})`"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 群成员九宫格 -->
      <GroupMemberGrid
        :members="currentMembers"
        :can-invite="!isQuitGroupDetail"
        :can-manage="removableMembers.length > 0"
        @member-click="onMemberTap"
        @invite="openInvitePicker"
        @manage="openMemberManage"
      />

      <!-- 群信息 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="群聊名称" :value="formData?.name || '-'" :is-link="canManageGroup" center @click="editGroupInfo" />
          <wd-cell title="群公告" :value="formData?.notice || '未设置'" :is-link="canManageGroup" center @click="editGroupInfo" />
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

      <!-- 群通话 -->
      <view v-if="!isQuitGroupDetail" class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="音视频通话" label="可邀请群成员加入" is-link center @click="openCallMenu" />
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
          <wd-cell title="消息免打扰" center>
            <wd-switch v-model="mySilent" size="40rpx" @change="onSilentChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 退出 / 解散 -->
      <view v-if="!isQuitGroupDetail" class="mt-20rpx bg-white">
        <view class="py-30rpx text-center text-32rpx text-[#fa5151]" @click="isOwner ? handleDissolve() : handleQuit()">
          {{ isOwner ? '解散群聊' : '退出群聊' }}
        </view>
      </view>
      <view class="h-40rpx" />
    </scroll-view>

    <!-- 邀请成员 -->
    <FriendPicker
      ref="invitePickerRef"
      v-model="inviteUserIds"
      :disabled-ids="currentMemberUserIds"
      :max-size="remainingMemberCount"
      @confirm="handleInviteMembers"
    />

    <!-- 推荐群名片 -->
    <RecommendCardPicker v-if="groupCard" v-model="recommendVisible" :card="groupCard" />

    <!-- 通话方式菜单 -->
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />

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

    <!-- 发起群通话成员选择 -->
    <GroupMemberPicker
      ref="callMemberPickerRef"
      v-model="callInviteUserIds"
      title="选择通话成员"
      :members="currentMembers"
      :hide-ids="[userStore.userInfo.userId]"
      @confirm="handleCallMemberConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Group, GroupMember } from '../../../types'
import { toGroupCardTarget } from '@/pages-im/utils/message'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  dissolveGroup,
  muteAll,
  updateGroup,
} from '@/api/im/group'
import {
  inviteGroupMember,
  quitGroup,
} from '@/api/im/group/member'
import { getClientConversationId } from '@/pages-im/utils/db'
import { GROUP_MAX_MEMBER } from '@/pages-im/utils/config'
import { isGroupQuit } from '@/pages-im/utils/user'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import {
  CommonStatusEnum,
  ImConversationType,
  ImFriendAddSource,
  ImGroupMemberRole,
  ImRtcCallMediaType,
} from '@/pages-im/utils/constants'
import { useImRtc } from '../../../composables/useImRtc'
import { useConversationStore } from '../../../store/conversationStore'
import { useFriendStore } from '../../../store/friendStore'
import { useGroupStore } from '../../../store/groupStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import FriendPicker from '../../components/friend-picker.vue'
import RecommendCardPicker from '../../components/recommend-card-picker.vue'
import GroupMemberActionSheet from './components/group-member-action-sheet.vue'
import GroupMemberGrid from './components/group-member-grid.vue'
import GroupAdminPicker from '../components/group-admin-picker.vue'
import GroupMemberPicker from '../components/group-member-picker.vue'
import GroupMemberRemovePicker from '../components/group-member-remove-picker.vue'
import GroupOwnerTransferPicker from '../components/group-owner-transfer-picker.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const friendStore = useFriendStore()
const groupStore = useGroupStore()
const loading = ref(false) // 详情加载状态
const formData = ref<Group>() // 群详情
const members = ref<GroupMember[]>([]) // 群成员
const invitePickerRef = ref<InstanceType<typeof FriendPicker>>() // 好友选择器引用
const memberActionRef = ref<InstanceType<typeof GroupMemberActionSheet>>() // 成员管理菜单引用
const memberRemovePickerRef = ref<InstanceType<typeof GroupMemberRemovePicker>>() // 批量移出成员选择器引用
const adminPickerRef = ref<InstanceType<typeof GroupAdminPicker>>() // 群管理员选择器引用
const ownerTransferPickerRef = ref<InstanceType<typeof GroupOwnerTransferPicker>>() // 新群主选择器引用
const callMemberPickerRef = ref<InstanceType<typeof GroupMemberPicker>>() // 群通话成员选择器引用
const inviting = ref(false) // 邀请提交状态
const inviteUserIds = ref<number[]>([]) // 邀请用户编号
const recommendVisible = ref(false) // 推荐群名片弹窗
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callInviteUserIds = ref<number[]>([]) // 群通话邀请成员编号
const callMediaType = ref<number>() // 待发起的群通话媒体类型
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const mutedAll = ref(false) // 全员禁言
const joinApproval = ref(false) // 进群审批
const mySilent = ref(false) // 我的群免打扰
const { start: startRtcCall } = useImRtc()
const { clearConversationMessages } = useConversationStore()

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
const isQuitGroupDetail = computed(() => isGroupQuit(formData.value)) // 历史退群群只读展示

/** 是否可管理群（群主 / 管理员） */
const canManageGroup = computed(() =>
  currentMember.value?.role === ImGroupMemberRole.OWNER || currentMember.value?.role === ImGroupMemberRole.ADMIN,
)

/** 是否群主 */
const isOwner = computed(() => currentMember.value?.role === ImGroupMemberRole.OWNER)
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

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
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

/** 点击成员：管理员走管理菜单，其他成员进入好友资料或申请页 */
function onMemberTap(item: GroupMember) {
  if (item.userId === userStore.userInfo.userId) {
    return
  }
  if (canManageMember(item)) {
    memberActionRef.value?.open(item)
    return
  }
  const friend = friendStore.getActiveFriendList.find(candidate => candidate.friendUserId === item.userId)
  uni.navigateTo({
    url: friend
      ? `/pages-im/home/contact/friend/detail/index?friendUserId=${item.userId}`
      : `/pages-im/home/contact/friend/apply/index?toUserId=${item.userId}&source=${ImFriendAddSource.GROUP}&sourceExtra=${encodeURIComponent(formData.value?.name || '')}`,
  })
}

/** 编辑群资料（群名 / 公告，跳编辑页） */
function editGroupInfo() {
  if (!canManageGroup.value || !formData.value?.id) {
    return
  }
  uni.navigateTo({ url: `/pages-im/home/contact/group/form/index?id=${formData.value.id}` })
}

/** 编辑我在本群的昵称 */
async function editMyNick() {
  if (!formData.value?.id || isQuitGroupDetail.value) {
    return
  }
  const groupId = formData.value.id
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
  await getDetail()
  toast.success('已保存')
}

/** 编辑仅自己可见的群聊备注 */
async function editGroupRemark() {
  if (!formData.value?.id || isQuitGroupDetail.value) {
    return
  }
  const groupId = formData.value.id
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
  await getDetail()
  toast.success('已保存')
}

/** 发起群音视频通话 */
function openCallMenu() {
  if (isQuitGroupDetail.value) {
    return
  }
  const inviteeIds = currentMembers.value
    .filter(item => item.userId !== userStore.userInfo.userId)
    .map(item => item.userId)
  if (inviteeIds.length === 0 || !formData.value?.id) {
    toast.show('暂无可邀请成员')
    return
  }
  callActionVisible.value = true
}

/** 发起指定方式的群通话 */
function handleCallAction({ item }: { item: { value: number } }) {
  if (!formData.value?.id) {
    return
  }
  callMediaType.value = item.value
  callInviteUserIds.value = []
  callMemberPickerRef.value?.open([])
}

/** 选择成员后发起群通话 */
function handleCallMemberConfirm(inviteeIds: number[]) {
  if (!formData.value?.id || callMediaType.value == null || inviteeIds.length === 0) {
    return
  }
  startRtcCall({
    conversationType: ImConversationType.GROUP,
    mediaType: callMediaType.value,
    groupId: formData.value.id,
    inviteeIds,
  })
}

/** 查找聊天内容 */
function goHistory() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-im/home/conversation/history/index?type=${ImConversationType.GROUP}&targetId=${formData.value.id}&title=${encodeURIComponent(formData.value.name)}`,
  })
}

/** 清空当前群的本地聊天记录 */
async function clearHistory() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定清空本机中的群聊记录吗？该操作不可恢复。' })
  } catch {
    return
  }
  await clearConversationMessages(getClientConversationId(ImConversationType.GROUP, formData.value.id))
  toast.success('聊天记录已清空')
}

/** 进群申请 */
function goGroupRequests() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({ url: `/pages-im/home/contact/request/index?tab=group&groupId=${formData.value.id}` })
}

/** 打开群管理员设置 */
function openAdminPicker() {
  adminPickerRef.value?.open()
}

/** 打开群主转让选择 */
function openOwnerTransferPicker() {
  ownerTransferPickerRef.value?.open()
}

/** 邀请成员 */
async function handleInviteMembers(memberUserIds: number[]) {
  if (!formData.value?.id || isQuitGroupDetail.value || memberUserIds.length === 0) {
    toast.show('请选择邀请成员')
    return
  }
  if (memberUserIds.length > remainingMemberCount.value) {
    toast.show(`群成员上限为 ${GROUP_MAX_MEMBER} 人`)
    return
  }
  inviting.value = true
  try {
    await inviteGroupMember({ groupId: formData.value.id, memberUserIds })
    toast.success(joinApproval.value && currentMember.value?.role === ImGroupMemberRole.NORMAL
      ? '邀请申请已发送，等待群主或管理员处理'
      : '邀请成功')
    inviteUserIds.value = []
    await getDetail()
  } finally {
    inviting.value = false
  }
}

/** 全员禁言切换 */
async function onMuteAllChange() {
  if (isQuitGroupDetail.value) {
    mutedAll.value = !!formData.value?.mutedAll
    return
  }
  try {
    await muteAll({ id: formData.value!.id, mutedAll: mutedAll.value })
  } catch {
    mutedAll.value = !mutedAll.value
  }
}

/** 进群审批切换 */
async function onJoinApprovalChange() {
  if (isQuitGroupDetail.value) {
    joinApproval.value = !!formData.value?.joinApproval
    return
  }
  try {
    await updateGroup({ id: formData.value!.id, joinApproval: joinApproval.value })
  } catch {
    joinApproval.value = !joinApproval.value
  }
}

/** 群免打扰切换 */
async function onSilentChange() {
  if (isQuitGroupDetail.value) {
    mySilent.value = !!formData.value?.silent
    return
  }
  try {
    await groupStore.updateMyGroupMember(formData.value!.id, { silent: mySilent.value })
  } catch {
    mySilent.value = !mySilent.value
  }
}

/** 退出群聊 */
async function handleQuit() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定退出"${formData.value.name}"吗？` })
  } catch {
    return
  }
  await quitGroup(formData.value.id)
  groupStore.removeGroup(formData.value.id)
  toast.success('已退出群聊')
  delay(handleBack)
}

/** 解散群聊 */
async function handleDissolve() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定解散"${formData.value.name}"吗？` })
  } catch {
    return
  }
  await dissolveGroup(formData.value.id)
  groupStore.removeGroup(formData.value.id)
  toast.success('已解散群聊')
  delay(handleBack)
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  loading.value = true
  try {
    const [group, memberList] = await Promise.all([
      groupStore.fetchGroupInfo(Number(props.id), true),
      groupStore.fetchGroupMemberList(Number(props.id), true),
    ])
    if (!group) {
      return
    }
    formData.value = group
    members.value = memberList
    mutedAll.value = !!group.mutedAll
    joinApproval.value = !!group.joinApproval
    mySilent.value = !!group.silent
  } finally {
    loading.value = false
  }
}

onShow(() => {
  void useImRuntimeStore().ensure()
  getDetail()
})

/** 当前群关系变化时刷新详情 */
function handleGroupReload(groupId?: number) {
  if (!groupId || groupId === Number(props.id)) {
    getDetail()
  }
}

/** 订阅群详情实时变化 */
onMounted(() => uni.$on('im:group-detail:reload', handleGroupReload))

/** 释放群详情订阅 */
onUnmounted(() => uni.$off('im:group-detail:reload', handleGroupReload))
</script>
