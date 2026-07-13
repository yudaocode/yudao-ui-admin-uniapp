<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="`聊天信息(${members.length})`"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view class="min-h-0 flex-1 bg-[#ededed]" scroll-y>
      <!-- 群成员九宫格 -->
      <view class="bg-white px-24rpx pb-12rpx pt-24rpx">
        <wd-search v-model="memberKeyword" placeholder="搜索群成员" hide-cancel />
        <view class="grid grid-cols-5 gap-y-24rpx">
          <view
            v-for="item in displayMembers"
            :key="item.userId"
            class="flex flex-col items-center gap-8rpx"
            @click="onMemberTap(item)"
          >
            <ImAvatar :src="item.avatar" :name="getMemberName(item)" :round="false" size="96rpx" />
            <text class="w-96rpx truncate text-center text-22rpx text-[#666]">{{ getMemberName(item) }}</text>
          </view>
          <!-- 邀请成员 -->
          <view class="flex flex-col items-center gap-8rpx" @click="inviteVisible = true">
            <view class="h-96rpx w-96rpx flex items-center justify-center border border-[#ddd] rounded-12rpx border-dashed">
              <wd-icon name="plus" size="48rpx" color="#bbb" />
            </view>
          </view>
          <!-- 管理成员 -->
          <view v-if="canManageGroup" class="flex flex-col items-center gap-8rpx" @click="openMemberManage">
            <view class="h-96rpx w-96rpx flex items-center justify-center border border-[#ddd] rounded-12rpx border-dashed">
              <wd-icon name="minus" size="48rpx" color="#bbb" />
            </view>
          </view>
        </view>
        <view
          v-if="members.length > MEMBER_LIMIT"
          class="mt-16rpx py-8rpx text-center text-26rpx text-[#999]"
          @click="showAllMembers = !showAllMembers"
        >
          {{ showAllMembers ? '收起' : `查看全部 ${members.length} 名成员` }}
          <wd-icon :name="showAllMembers ? 'arrow-up' : 'arrow-down'" size="24rpx" />
        </view>
      </view>

      <!-- 群信息 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="群聊名称" :value="formData?.name || '-'" :is-link="canManageGroup" center @click="editGroupInfo" />
          <wd-cell title="群公告" :value="formData?.notice || '未设置'" :is-link="canManageGroup" center @click="editGroupInfo" />
          <wd-cell title="我在本群的昵称" :value="myGroupNick || '未设置'" is-link center @click="editMyNick" />
          <wd-cell title="群聊备注" :value="myGroupRemark || '未设置'" is-link center @click="editGroupRemark" />
        </wd-cell-group>
      </view>

      <!-- 群通话 -->
      <!-- #ifdef H5 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="音视频通话" label="可邀请群成员加入" is-link center @click="openCallMenu" />
        </wd-cell-group>
      </view>
      <!-- #endif -->

      <!-- 聊天记录与推荐 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="查找聊天内容" is-link center @click="goHistory" />
          <wd-cell title="推荐群聊给朋友" is-link center @click="recommendVisible = true" />
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
          <wd-cell title="群管理员设置" is-link center @click="openAdminTip" />
          <wd-cell title="转让群主" is-link center @click="openTransferTip" />
        </wd-cell-group>
      </view>

      <!-- 个人设置 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <wd-cell title="消息免打扰" center>
            <wd-switch v-model="mySilent" size="40rpx" @change="onSilentChange" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 退出 / 解散 -->
      <view class="mt-20rpx bg-white">
        <view class="py-30rpx text-center text-32rpx text-[#fa5151]" @click="isOwner ? handleDissolve() : handleQuit()">
          {{ isOwner ? '解散群聊' : '退出群聊' }}
        </view>
      </view>
      <view class="h-40rpx" />
    </scroll-view>

    <!-- 邀请成员 -->
    <wd-popup v-model="inviteVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx pb-[calc(24rpx+env(safe-area-inset-bottom))]">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          邀请成员
        </view>
        <wd-cell-group border>
          <UserFormPicker v-model="inviteUserIds" label="成员" placeholder="请选择用户" type="checkbox" />
        </wd-cell-group>
        <view class="grid grid-cols-2 mt-24rpx gap-16rpx">
          <wd-button block variant="plain" @click="inviteVisible = false">
            取消
          </wd-button>
          <wd-button block type="primary" :loading="inviting" @click="handleInviteMembers">
            邀请
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 推荐群名片 -->
    <RecommendCardPicker v-model="recommendVisible" :card="groupCard" />

    <!-- 通话方式菜单 -->
    <!-- #ifdef H5 -->
    <wd-action-sheet v-model="callActionVisible" :actions="callActions" @select="handleCallAction" />
    <!-- #endif -->

    <!-- 成员管理菜单 -->
    <wd-action-sheet v-model="memberActionVisible" :actions="memberActions" @select="handleMemberActionSelect" />
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupRespVO } from '@/api/im/group'
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import type { ImCardMessage } from '@/pages-im/utils/message'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  addGroupAdmin,
  cancelMuteMember,
  dissolveGroup,
  getGroup,
  muteAll,
  muteMember,
  removeGroupAdmin,
  transferGroupOwner,
  updateGroup,
} from '@/api/im/group'
import {
  getGroupMemberList,
  inviteGroupMember,
  quitGroup,
  removeGroupMember,
  updateGroupMember,
} from '@/api/im/group/member'
import { UserFormPicker } from '@/components/system-select'
import { getClientConversationId } from '@/pages-im/home/db'
import { getMemberDisplayName as getMemberName } from '@/pages-im/utils/user'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { ImConversationType, ImGroupMemberRole, ImRtcCallMediaType } from '@/utils/constants'
import { useImRtc } from '../../composables/useImRtc'
import { useImConversations } from '../../composables/useImConversations'
import ImAvatar from '../../components/im-avatar.vue'
import RecommendCardPicker from '../../components/recommend-card-picker.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const MEMBER_LIMIT = 10 // 折叠时展示的成员数
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 详情加载状态
const formData = ref<ImGroupRespVO>() // 群详情
const members = ref<ImGroupMemberRespVO[]>([]) // 群成员
const inviteVisible = ref(false) // 邀请成员弹窗
const inviting = ref(false) // 邀请提交状态
const inviteUserIds = ref<number[]>([]) // 邀请用户编号
const recommendVisible = ref(false) // 推荐群名片弹窗
const callActionVisible = ref(false) // 通话方式菜单显示状态
const callActions = [ // 通话方式菜单项
  { name: '语音通话', value: ImRtcCallMediaType.VOICE },
  { name: '视频通话', value: ImRtcCallMediaType.VIDEO },
]
const memberActionVisible = ref(false) // 成员管理菜单显示状态
const actionMember = ref<ImGroupMemberRespVO>() // 当前操作的群成员
const memberActions = ref<Array<{ name: string, value: string, mutedSeconds?: number, color?: string }>>([]) // 成员管理菜单项
const showAllMembers = ref(false) // 是否展开全部成员
const memberKeyword = ref('') // 群成员关键词
const mutedAll = ref(false) // 全员禁言
const joinApproval = ref(false) // 进群审批
const mySilent = ref(false) // 我的群免打扰
const { start: startRtcCall } = useImRtc()
const { clearConversationMessages, removeConversation } = useImConversations()

/** 当前用户群成员 */
const currentMember = computed(() => members.value.find(item => item.userId === userStore.userInfo.userId))

/** 是否可管理群（群主 / 管理员） */
const canManageGroup = computed(() =>
  currentMember.value?.role === ImGroupMemberRole.OWNER || currentMember.value?.role === ImGroupMemberRole.ADMIN,
)

/** 是否群主 */
const isOwner = computed(() => currentMember.value?.role === ImGroupMemberRole.OWNER)

/** 我在本群的昵称 */
const myGroupNick = computed(() => currentMember.value?.displayUserName || '')
const myGroupRemark = computed(() => currentMember.value?.groupRemark || '') // 群聊备注
const groupCard = computed<ImCardMessage>(() => ({ // 群名片
  targetType: ImConversationType.GROUP,
  targetId: Number(props.id),
  name: formData.value?.name || '群聊',
  avatar: formData.value?.avatar,
  memberCount: members.value.filter(item => !item.quitTime).length,
}))

/** 折叠展示的成员 */
const filteredMembers = computed(() => { // 搜索后的群成员
  const keyword = memberKeyword.value.trim().toLowerCase()
  return keyword
    ? members.value.filter(item => getMemberName(item).toLowerCase().includes(keyword))
    : members.value
})
const displayMembers = computed(() => (showAllMembers.value || memberKeyword.value
  ? filteredMembers.value
  : filteredMembers.value.slice(0, MEMBER_LIMIT))) // 展示的群成员

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/index/index')
}

/** 是否可管理成员 */
function canManageMember(item: ImGroupMemberRespVO) {
  if (!canManageGroup.value || item.userId === userStore.userInfo.userId || item.role === ImGroupMemberRole.OWNER) {
    return false
  }
  return isOwner.value || item.role === ImGroupMemberRole.NORMAL
}

/** 打开成员管理提示 */
function openMemberManage() {
  toast.show('点击成员头像可设置角色、禁言或移出群聊')
}

/** 点击成员：可管理则弹管理菜单 */
function onMemberTap(item: ImGroupMemberRespVO) {
  if (canManageMember(item)) {
    handleMemberMore(item)
  }
}

/** 编辑群资料（群名 / 公告，跳编辑页） */
function editGroupInfo() {
  if (!canManageGroup.value || !formData.value?.id) {
    return
  }
  uni.navigateTo({ url: `/pages-im/home/group/form/index?id=${formData.value.id}` })
}

/** 编辑我在本群的昵称 */
async function editMyNick() {
  if (!formData.value?.id) {
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
  await updateGroupMember({ groupId, displayUserName: String(value || '') })
  await getDetail()
  toast.success('已保存')
}

/** 编辑仅自己可见的群聊备注 */
async function editGroupRemark() {
  if (!formData.value?.id) {
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
  await updateGroupMember({ groupId, groupRemark: String(value || '') })
  await getDetail()
  toast.success('已保存')
}

/** 发起群音视频通话 */
function openCallMenu() {
  const inviteeIds = members.value
    .filter(item => item.userId !== userStore.userInfo.userId && !item.quitTime)
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
  const inviteeIds = members.value
    .filter(member => member.userId !== userStore.userInfo.userId && !member.quitTime)
    .map(member => member.userId)
  startRtcCall({
    conversationType: ImConversationType.GROUP,
    mediaType: item.value,
    groupId: formData.value.id,
    inviteeIds,
    name: formData.value.name,
    avatar: formData.value.avatar,
  })
}

/** 查找聊天内容 */
function goHistory() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: `/pages-im/home/history/index?type=${ImConversationType.GROUP}&targetId=${formData.value.id}&title=${encodeURIComponent(formData.value.name)}`,
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
  uni.navigateTo({ url: '/pages-im/home/request/index?tab=group' })
}

/** 群管理员设置提示（点成员管理设置） */
function openAdminTip() {
  toast.show('点击下方成员头像可设/撤管理员')
}

/** 转让群主提示 */
function openTransferTip() {
  toast.show('点击下方成员头像可转让群主')
}

/** 邀请成员 */
async function handleInviteMembers() {
  if (!formData.value?.id || inviteUserIds.value.length === 0) {
    toast.show('请选择邀请成员')
    return
  }
  inviting.value = true
  try {
    await inviteGroupMember({ groupId: formData.value.id, memberUserIds: inviteUserIds.value })
    toast.success('邀请成功')
    inviteUserIds.value = []
    inviteVisible.value = false
    await getDetail()
  } finally {
    inviting.value = false
  }
}

/** 成员管理操作菜单 */
function handleMemberMore(item: ImGroupMemberRespVO) {
  if (!formData.value?.id) {
    return
  }
  const actions: Array<{ name: string, value: string, mutedSeconds?: number, color?: string }> = []
  if (isOwner.value) {
    actions.push(item.role === ImGroupMemberRole.ADMIN
      ? { name: '撤销管理员', value: 'removeAdmin' }
      : { name: '设为管理员', value: 'addAdmin' })
    actions.push({ name: '转让群主', value: 'transferOwner' })
  }
  if (item.muteEndTime) {
    actions.push({ name: '取消禁言', value: 'cancelMute' })
  } else {
    actions.push({ name: '禁言 10 分钟', value: 'mute', mutedSeconds: 600 })
    actions.push({ name: '禁言 1 小时', value: 'mute', mutedSeconds: 3600 })
  }
  actions.push({ name: '移出群聊', value: 'remove', color: '#fa5151' })
  actionMember.value = item
  memberActions.value = actions
  memberActionVisible.value = true
}

/** 处理成员菜单操作 */
function handleMemberActionSelect({ item }: { item: { value: string, mutedSeconds?: number } }) {
  if (actionMember.value) {
    handleMemberAction(actionMember.value, item)
  }
}

/** 执行成员管理 */
async function handleMemberAction(member: ImGroupMemberRespVO, action: { value: string, mutedSeconds?: number }) {
  if (!formData.value?.id) {
    return
  }
  const groupId = formData.value.id
  if (action.value === 'addAdmin') {
    await addGroupAdmin({ id: groupId, userIds: [member.userId] })
    toast.success('已设为管理员')
  } else if (action.value === 'removeAdmin') {
    await removeGroupAdmin({ id: groupId, userIds: [member.userId] })
    toast.success('已撤销管理员')
  } else if (action.value === 'transferOwner') {
    try {
      await dialog.confirm({ title: '提示', msg: `确定将群主转让给"${getMemberName(member)}"吗？` })
    } catch {
      return
    }
    await transferGroupOwner({ id: groupId, newOwnerUserId: member.userId })
    toast.success('已转让群主')
  } else if (action.value === 'mute') {
    await muteMember({ id: groupId, userId: member.userId, mutedSeconds: action.mutedSeconds || 600 })
    toast.success('已禁言')
  } else if (action.value === 'cancelMute') {
    await cancelMuteMember({ id: groupId, userId: member.userId })
    toast.success('已取消禁言')
  } else if (action.value === 'remove') {
    try {
      await dialog.confirm({ title: '提示', msg: `确定将"${getMemberName(member)}"移出群聊吗？` })
    } catch {
      return
    }
    await removeGroupMember({ groupId, memberUserIds: [member.userId] })
    toast.success('已移出群聊')
  }
  await getDetail()
}

/** 全员禁言切换 */
async function onMuteAllChange() {
  try {
    await muteAll({ id: formData.value!.id, mutedAll: mutedAll.value })
  } catch {
    mutedAll.value = !mutedAll.value
  }
}

/** 进群审批切换 */
async function onJoinApprovalChange() {
  try {
    await updateGroup({ id: formData.value!.id, joinApproval: joinApproval.value })
  } catch {
    joinApproval.value = !joinApproval.value
  }
}

/** 群免打扰切换 */
async function onSilentChange() {
  try {
    await updateGroupMember({ groupId: formData.value!.id, silent: mySilent.value })
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
  await removeConversation(getClientConversationId(ImConversationType.GROUP, formData.value.id))
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
  await removeConversation(getClientConversationId(ImConversationType.GROUP, formData.value.id))
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
    const [group, memberList] = await Promise.all([getGroup(props.id), getGroupMemberList(props.id)])
    formData.value = group
    members.value = memberList
    mutedAll.value = !!group.mutedAll
    joinApproval.value = !!group.joinApproval
    mySilent.value = !!currentMember.value?.silent
  } finally {
    loading.value = false
  }
}

onShow(() => {
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
