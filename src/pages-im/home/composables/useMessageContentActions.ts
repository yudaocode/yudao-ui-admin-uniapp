import type { Ref } from 'vue'
import type { CardMessage, MaterialMessage } from '@/pages-im/utils/message'
import { openSafeUrl } from '@/utils/url'
import {
  IM_AT_ALL_USER_ID,
  ImConversationType,
  ImFriendAddSource,
} from '@/pages-im/utils/constants'
import { isGroupQuit } from '@/pages-im/utils/user'
import { useGroupStore } from '../store/groupStore'

export interface GroupCardPreviewOptions {
  card: CardMessage // 群名片快照
  canApply: boolean // 是否允许申请加入
}

/** 管理素材、名片和消息发送人点击行为 */
export function useMessageContentActions(options: {
  conversationType: Readonly<Ref<number>>
  targetId: Readonly<Ref<number>>
  openGroupCardPreview: (options: GroupCardPreviewOptions) => void
}) {
  const groupStore = useGroupStore()

  /** 点击频道素材 */
  function handleMaterialClick(payload: MaterialMessage) {
    if (payload.url) {
      openSafeUrl(payload.url)
      return
    }
    if (payload.materialId) {
      uni.navigateTo({
        url: `/pages-im/home/conversation/material/index?id=${payload.materialId}&type=${options.conversationType.value}&targetId=${options.targetId.value}`,
      })
      return
    }
  }

  /** 打开个人或群名片 */
  async function handleCardClick(payload: CardMessage) {
    if (payload.targetType === ImConversationType.GROUP) {
      await groupStore.fetchGroupList()
      const cachedGroup = groupStore.groups.find(item => item.id === payload.targetId)
      if (cachedGroup && !isGroupQuit(cachedGroup)) {
        uni.navigateTo({ url: `/pages-im/home/contact/group/detail/index?id=${payload.targetId}` })
        return
      }
      options.openGroupCardPreview({
        card: payload,
        canApply: !cachedGroup && !groupStore.isGroupUnavailable(payload.targetId),
      })
      return
    }
    uni.navigateTo({
      url: `/pages-im/home/contact/friend/detail/index?friendUserId=${payload.targetId}&source=${ImFriendAddSource.CARD}`,
    })
  }

  /** 打开消息发送人资料 */
  async function handleAvatarClick(userId: number) {
    if (!userId || userId === IM_AT_ALL_USER_ID) {
      return
    }
    const group = options.conversationType.value === ImConversationType.GROUP
      ? groupStore.getGroup(options.targetId.value)
      : undefined
    const sourceExtra = group?.name ? `&sourceExtra=${encodeURIComponent(group.name)}` : ''
    const addSource = options.conversationType.value === ImConversationType.GROUP
      ? ImFriendAddSource.GROUP
      : ImFriendAddSource.SEARCH
    uni.navigateTo({
      url: `/pages-im/home/contact/friend/detail/index?friendUserId=${userId}&source=${addSource}${sourceExtra}`,
    })
  }

  return {
    handleMaterialClick,
    handleCardClick,
    handleAvatarClick,
  }
}
