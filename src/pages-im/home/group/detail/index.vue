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
  </view>
</template>

<script lang="ts" setup>
import type { ImGroupRespVO } from '@/api/im/group'
import type { ImGroupMemberRespVO } from '@/api/im/group/member'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
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
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { ImGroupMemberRole } from '@/utils/constants'
import ImAvatar from '../../components/im-avatar.vue'

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
const showAllMembers = ref(false) // 是否展开全部成员
const mutedAll = ref(false) // 全员禁言
const joinApproval = ref(false) // 进群审批
const mySilent = ref(false) // 我的群免打扰

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

/** 折叠展示的成员 */
const displayMembers = computed(() => (showAllMembers.value ? members.value : members.value.slice(0, MEMBER_LIMIT)))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/index/index')
}

/** 获取成员显示名 */
function getMemberName(item: ImGroupMemberRespVO) {
  return item.displayUserName || item.nickname || `用户 ${item.userId}`
}

/** 是否可管理成员 */
function canManageMember(item: ImGroupMemberRespVO) {
  if (!canManageGroup.value || item.userId === userStore.userInfo.userId || item.role === ImGroupMemberRole.OWNER) {
    return false
  }
  return isOwner.value || item.role === ImGroupMemberRole.NORMAL
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
function editMyNick() {
  if (!formData.value?.id) {
    return
  }
  uni.showModal({
    title: '我在本群的昵称',
    editable: true,
    content: myGroupNick.value,
    placeholderText: '请输入昵称',
    success: async ({ confirm, content }) => {
      if (!confirm) {
        return
      }
      await updateGroupMember({ groupId: formData.value!.id, displayUserName: content || '' })
      await getDetail()
      toast.success('已保存')
    },
  })
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
  const actions: Array<{ name: string, value: string, mutedSeconds?: number }> = []
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
  actions.push({ name: '移出群聊', value: 'remove' })
  uni.showActionSheet({
    itemList: actions.map(action => action.name),
    success: ({ tapIndex }) => handleMemberAction(item, actions[tapIndex]),
  })
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
</script>
