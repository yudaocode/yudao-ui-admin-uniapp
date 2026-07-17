import type { Ref } from 'vue'
import type { GroupMember } from '../types'
import { computed, ref } from 'vue'
import { getActiveCall } from '@/api/im/rtc'
import { useUserStore } from '@/store/user'
import {
  CommonStatusEnum,
  ImConversationType,
  ImGroupMemberRole,
} from '@/pages-im/utils/constants'
import {
  getFriendDisplayName,
  getGroupDisplayName,
  isGroupQuit,
} from '@/pages-im/utils/user'
import { useChannelStore } from '../store/channelStore'
import { useConversationStore } from '../store/conversationStore'
import { useFriendStore } from '../store/friendStore'
import { useGroupRequestStore } from '../store/groupRequestStore'
import { useGroupStore } from '../store/groupStore'
import { useImRuntimeStore } from '../store/runtimeStore'
import { useRtcStore } from '../store/rtcStore'
import { useMuteOverlay } from './useMuteOverlay'

/** 管理当前聊天页的会话资料、权限与激活状态 */
export function useConversationContext(options: {
  conversationType: Readonly<Ref<number>>
  targetId: Readonly<Ref<number>>
  active: Readonly<Ref<boolean>>
}) {
  const userStore = useUserStore()
  const conversationStore = useConversationStore()
  const friendStore = useFriendStore()
  const groupStore = useGroupStore()
  const groupRequestStore = useGroupRequestStore()
  const channelStore = useChannelStore()
  const rtcStore = useRtcStore()
  const groupMembers = ref<GroupMember[]>([]) // 当前群成员
  const groupMembersReady = ref(false) // 当前群成员权限是否已成功刷新
  const friendLoaded = ref(false) // 好友关系是否加载完成
  const activeConversationOwner = Symbol('conversation-page') // 当前聊天页实例

  const conversation = computed(() => conversationStore.getConversation(
    options.conversationType.value,
    options.targetId.value,
  )) // 当前会话
  const privateFriend = computed(() => { // 当前有效私聊好友
    const friend = friendStore.getFriend(options.targetId.value)
    return friend && friendStore.isActiveFriend(options.targetId.value) ? friend : undefined
  })
  const isFriend = computed(() => friendStore.isActiveFriend(options.targetId.value)) // 是否有效好友
  const group = computed(() => options.conversationType.value === ImConversationType.GROUP
    ? groupStore.getGroup(options.targetId.value)
    : undefined) // 当前群聊资料
  const channel = computed(() => options.conversationType.value === ImConversationType.CHANNEL
    ? channelStore.getChannel(options.targetId.value)
    : undefined) // 当前频道资料
  const isChannel = computed(() => options.conversationType.value === ImConversationType.CHANNEL) // 是否频道会话
  const isQuitGroup = computed(() => options.conversationType.value === ImConversationType.GROUP
    && isGroupQuit(group.value)) // 是否历史退群群聊
  const pageTitle = computed(() => { // 页面标题
    if (options.conversationType.value === ImConversationType.GROUP && group.value) {
      return getGroupDisplayName(group.value) || '群聊'
    }
    if (options.conversationType.value === ImConversationType.PRIVATE && privateFriend.value) {
      return getFriendDisplayName(privateFriend.value)
    }
    if (options.conversationType.value === ImConversationType.CHANNEL) {
      return channel.value?.name || '频道'
    }
    return conversation.value?.name || '聊天'
  })
  const navbarTitle = computed(() => options.conversationType.value === ImConversationType.GROUP
    && groupMembers.value.length
    ? `${pageTitle.value} (${groupMembers.value.filter(item => item.status !== CommonStatusEnum.DISABLE).length})`
    : pageTitle.value) // 导航栏标题
  const currentGroupMember = computed(() => options.conversationType.value === ImConversationType.GROUP
    ? groupMembers.value.find(item => item.userId === userStore.userInfo.userId)
    : undefined) // 当前群成员
  const canManageGroup = computed(() => groupMembersReady.value
    && !!group.value && !isQuitGroup.value
    && currentGroupMember.value?.status !== CommonStatusEnum.DISABLE
    && (currentGroupMember.value?.role === ImGroupMemberRole.OWNER
      || currentGroupMember.value?.role === ImGroupMemberRole.ADMIN)) // 是否可管理当前群
  const muteOverlay = useMuteOverlay()
  const inputDisabledTip = computed(() => { // 当前不可发送原因
    if (options.active.value
      && !conversationStore.isActiveConversation(
        options.conversationType.value,
        options.targetId.value,
      )) {
      return '当前会话已失效'
    }
    return muteOverlay.value?.text || ''
  })

  /** 快照当前聊天页账号与会话 */
  function getPageContext() {
    return {
      userId: userStore.userInfo.userId,
      conversationType: options.conversationType.value,
      targetId: options.targetId.value,
    }
  }

  /** 判断异步结果是否仍属于当前聊天页 */
  function isPageContextActive(context: ReturnType<typeof getPageContext>) {
    return options.active.value
      && context.userId === userStore.userInfo.userId
      && context.conversationType === options.conversationType.value
      && context.targetId === options.targetId.value
  }

  /** 同步群资料到会话列表 */
  async function syncGroupConversation(groupDetail: NonNullable<typeof group.value>) {
    await conversationStore.ensureConversation({
      type: ImConversationType.GROUP,
      targetId: options.targetId.value,
      name: getGroupDisplayName(groupDetail),
      avatar: groupDetail.avatar || '',
      silent: groupDetail.silent,
    })
  }

  /** 加载私聊好友关系 */
  async function refreshFriend() {
    if (options.conversationType.value !== ImConversationType.PRIVATE) {
      return
    }
    const context = getPageContext()
    try {
      const friends = await friendStore.fetchFriendList()
      if (!isPageContextActive(context)) {
        return
      }
      const friend = friends.find(item => item.friendUserId === context.targetId
        && item.status !== CommonStatusEnum.DISABLE)
      await conversationStore.ensureConversation({
        type: context.conversationType,
        targetId: context.targetId,
        name: friend
          ? getFriendDisplayName(friend)
          : conversation.value?.name || '聊天',
        avatar: friend?.avatar || '',
        silent: friend?.silent,
      })
    } finally {
      if (isPageContextActive(context)) {
        friendLoaded.value = true
      }
    }
  }

  /** 刷新群成员、群资料和活跃通话 */
  async function refreshGroupMembers() {
    if (options.conversationType.value !== ImConversationType.GROUP || !options.targetId.value) {
      return
    }
    groupMembersReady.value = false
    const context = getPageContext()
    await groupStore.loadGroupMemberList(options.targetId.value)
    if (!isPageContextActive(context)) {
      return
    }
    const cachedGroup = groupStore.getGroup(options.targetId.value)
    groupMembers.value = cachedGroup?.members || []
    const [memberList, groupDetail, activeCall] = await Promise.all([
      !cachedGroup?.membersLoaded || cachedGroup.membersExpired
        ? groupStore.fetchGroupMemberList(options.targetId.value)
        : Promise.resolve(cachedGroup.members || []),
      groupStore.fetchGroupInfo(options.targetId.value, true),
      getActiveCall(options.targetId.value),
    ])
    if (!isPageContextActive(context)) {
      return
    }
    groupMembers.value = memberList
    groupMembersReady.value = true
    if (activeCall) {
      rtcStore.setGroupCall(activeCall)
    } else {
      rtcStore.removeGroupCall(options.targetId.value)
    }
    if (groupDetail) {
      await syncGroupConversation(groupDetail)
    }
    if (canManageGroup.value) {
      await groupRequestStore.fetchUnhandledGroupRequestList()
      if (!isPageContextActive(context)) {
        return
      }
    }
  }

  /** 刷新群资料和活跃通话 */
  async function refreshGroup() {
    if (options.conversationType.value !== ImConversationType.GROUP || !options.targetId.value) {
      return
    }
    const context = getPageContext()
    const [groupDetail, activeCall] = await Promise.all([
      groupStore.fetchGroupInfo(options.targetId.value, true),
      getActiveCall(options.targetId.value),
    ])
    if (!isPageContextActive(context)) {
      return
    }
    if (activeCall) {
      rtcStore.setGroupCall(activeCall)
    } else {
      rtcStore.removeGroupCall(options.targetId.value)
    }
    if (groupDetail) {
      await syncGroupConversation(groupDetail)
    }
  }

  /** 加载频道资料 */
  async function refreshChannel() {
    if (options.conversationType.value !== ImConversationType.CHANNEL) {
      return
    }
    const context = getPageContext()
    await channelStore.fetchChannelList()
    if (!isPageContextActive(context)) {
      return
    }
    await conversationStore.ensureConversation({
      type: context.conversationType,
      targetId: context.targetId,
      name: channel.value?.name || '频道',
      avatar: channel.value?.avatar || '',
    })
  }

  /** 激活当前会话 */
  async function activate() {
    const context = getPageContext()
    if (context.userId <= 0) {
      return
    }
    conversationStore.setActiveConversation({
      type: context.conversationType,
      targetId: context.targetId,
    }, activeConversationOwner)
    await useImRuntimeStore().ensure()
    if (!isPageContextActive(context)) {
      return
    }
    if (context.conversationType === ImConversationType.GROUP) {
      await refreshGroupMembers()
    } else if (context.conversationType === ImConversationType.PRIVATE) {
      await refreshFriend()
    } else if (context.conversationType === ImConversationType.CHANNEL) {
      await refreshChannel()
    }
  }

  /** 停用当前会话 */
  function deactivate() {
    conversationStore.releaseActiveConversation(activeConversationOwner)
  }

  return {
    privateFriend,
    groupMembers,
    friendLoaded,
    pageTitle,
    navbarTitle,
    isFriend,
    isChannel,
    isQuitGroup,
    canManageGroup,
    inputDisabledTip,
    getPageContext,
    isPageContextActive,
    activate,
    deactivate,
    refreshGroup,
    refreshGroupMembers,
  }
}
