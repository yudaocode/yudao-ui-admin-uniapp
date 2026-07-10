<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="IM 联系人"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 联系人类型 -->
    <wd-tabs v-model="activeTab" line-theme="text" @change="handleTabChange">
      <wd-tab title="好友" :name="0" />
      <wd-tab title="群聊" :name="1" />
    </wd-tabs>

    <!-- 搜索框 -->
    <wd-search v-model="keyword" placeholder="搜索联系人" hide-cancel />

    <!-- 好友列表 -->
    <scroll-view v-if="activeTab === 0" class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view
          v-for="item in filteredFriends"
          :key="item.friendUserId"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-center gap-20rpx">
            <ImAvatar :src="item.avatar" :name="getFriendName(item)" />
            <view class="min-w-0 flex-1" @click="handleFriendChat(item)">
              <view class="flex items-center gap-10rpx">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ getFriendName(item) }}
                </view>
                <wd-tag v-if="item.pinned" type="primary" plain>
                  置顶
                </wd-tag>
                <wd-tag v-if="item.blocked" type="danger" plain>
                  已拉黑
                </wd-tag>
              </view>
              <view class="mt-6rpx truncate text-24rpx text-[#999]">
                昵称：{{ item.nickname || '-' }}
              </view>
            </view>
            <wd-button size="small" type="primary" variant="plain" @click.stop="handleFriendChat(item)">
              聊天
            </wd-button>
            <wd-button size="small" variant="plain" @click.stop="handleFriendMore(item)">
              更多
            </wd-button>
          </view>
        </view>
        <wd-empty v-if="!loading && filteredFriends.length === 0" icon="content" tip="暂无好友" />
      </view>
    </scroll-view>

    <!-- 群聊列表 -->
    <scroll-view v-else class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <view
          v-for="item in filteredGroups"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-center gap-20rpx">
            <ImAvatar :src="item.avatar" :name="item.name" :round="false" />
            <view class="min-w-0 flex-1" @click="handleGroupDetail(item)">
              <view class="flex items-center gap-10rpx">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name }}
                </view>
                <wd-tag v-if="item.banned" type="danger" plain>
                  已封禁
                </wd-tag>
                <wd-tag v-if="item.mutedAll" type="warning" plain>
                  全员禁言
                </wd-tag>
              </view>
              <view class="mt-6rpx truncate text-24rpx text-[#999]">
                {{ item.notice || '暂无群公告' }}
              </view>
            </view>
            <wd-button size="small" type="primary" variant="plain" @click.stop="handleGroupChat(item)">
              聊天
            </wd-button>
            <wd-button size="small" variant="plain" @click.stop="handleGroupDetail(item)">
              详情
            </wd-button>
          </view>
        </view>
        <wd-empty v-if="!loading && filteredGroups.length === 0" icon="content" tip="暂无群聊" />
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleCreate"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImFriendRespVO } from '@/api/im/friend'
import type { ImGroupRespVO } from '@/api/im/group'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import {
  blockFriend,
  deleteFriend,
  getMyFriendList,
  unblockFriend,
  updateFriend,
} from '@/api/im/friend'
import { getMyGroupList } from '@/api/im/group'
import { navigateBackPlus } from '@/utils'
import { ImConversationType } from '@/utils/constants'
import ImAvatar from '../components/im-avatar.vue'

const props = defineProps<{
  tab?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const activeTab = ref(props.tab === 'group' ? 1 : 0) // 当前联系人类型
const keyword = ref('') // 搜索关键词
const loading = ref(false) // 列表加载状态
const friendList = ref<ImFriendRespVO[]>([]) // 好友列表
const groupList = ref<ImGroupRespVO[]>([]) // 群聊列表

/** 好友过滤列表 */
const filteredFriends = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  return friendList.value
    .filter(item => item.status !== 1)
    .filter((item) => {
      if (!word) {
        return true
      }
      return [item.displayName, item.nickname, item.friendUserId].some(value => String(value || '').toLowerCase().includes(word))
    })
})

/** 群聊过滤列表 */
const filteredGroups = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  return groupList.value
    .filter(item => item.status !== 1)
    .filter((item) => {
      if (!word) {
        return true
      }
      return [item.name, item.notice, item.id].some(value => String(value || '').toLowerCase().includes(word))
    })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/index/index')
}

/** 切换联系人类型 */
function handleTabChange() {
  keyword.value = ''
}

/** 新增联系人 */
function handleCreate() {
  uni.navigateTo({
    url: activeTab.value === 0 ? '/pages-im/home/friend/apply/index' : '/pages-im/home/group/form/index',
  })
}

/** 获取好友显示名 */
function getFriendName(item: ImFriendRespVO) {
  return item.displayName || item.nickname || `用户 ${item.friendUserId}`
}

/** 打开好友聊天 */
function handleFriendChat(item: ImFriendRespVO) {
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${ImConversationType.PRIVATE}&targetId=${item.friendUserId}&title=${encodeURIComponent(getFriendName(item))}`,
  })
}

/** 打开群聊 */
function handleGroupChat(item: ImGroupRespVO) {
  uni.navigateTo({
    url: `/pages-im/home/chat/index?type=${ImConversationType.GROUP}&targetId=${item.id}&title=${encodeURIComponent(item.name)}`,
  })
}

/** 查看群详情 */
function handleGroupDetail(item: ImGroupRespVO) {
  uni.navigateTo({
    url: `/pages-im/home/group/detail/index?id=${item.id}`,
  })
}

/** 好友更多操作 */
function handleFriendMore(item: ImFriendRespVO) {
  const actions = [
    '复制用户编号',
    item.pinned ? '取消置顶' : '置顶联系人',
    item.silent ? '取消免打扰' : '设置免打扰',
    item.blocked ? '移出黑名单' : '拉黑好友',
    '删除好友',
  ]
  uni.showActionSheet({
    itemList: actions,
    success: async ({ tapIndex }) => {
      const action = actions[tapIndex]
      if (action === '复制用户编号') {
        uni.setClipboardData({ data: String(item.friendUserId) })
      } else if (action.includes('置顶')) {
        await updateFriend({ friendUserId: item.friendUserId, pinned: !item.pinned })
        toast.success('更新成功')
        loadData()
      } else if (action.includes('免打扰')) {
        await updateFriend({ friendUserId: item.friendUserId, silent: !item.silent })
        toast.success('更新成功')
        loadData()
      } else if (action.includes('黑名单') || action.includes('拉黑')) {
        if (item.blocked) {
          await unblockFriend(item.friendUserId)
        } else {
          await blockFriend(item.friendUserId)
        }
        toast.success('更新成功')
        loadData()
      } else if (action === '删除好友') {
        await handleDeleteFriend(item)
      }
    },
  })
}

/** 删除好友 */
async function handleDeleteFriend(item: ImFriendRespVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除好友“${getFriendName(item)}”吗？`,
    })
  } catch {
    return
  }
  await deleteFriend(item.friendUserId, false)
  toast.success('删除成功')
  loadData()
}

/** 加载联系人 */
async function loadData() {
  loading.value = true
  try {
    const [friends, groups] = await Promise.all([getMyFriendList(), getMyGroupList()])
    friendList.value = friends
    groupList.value = groups
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onShow(() => {
  activeTab.value = props.tab === 'group' ? 1 : activeTab.value
  loadData()
})
</script>
