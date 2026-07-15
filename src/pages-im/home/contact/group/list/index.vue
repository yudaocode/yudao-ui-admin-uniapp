<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="群聊" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索 -->
    <view class="bg-white px-24rpx pb-8rpx pt-12rpx">
      <wd-search v-model="keyword" placeholder="搜索群聊" hide-cancel />
    </view>

    <scroll-view class="min-h-0 flex-1 bg-white" scroll-y>
      <!-- 群聊列表 -->
      <GroupItem
        v-for="item in filteredGroups"
        :key="item.id"
        :group="item"
        @open="openChat"
      />

      <wd-empty v-if="!loading && filteredGroups.length === 0" icon="content" tip="暂无群聊" />
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { Group } from '../../../types'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { getGroupDisplayName as getGroupName, isGroupQuit } from '@/pages-im/utils/user'
import { buildConversationMessageUrl } from '@/pages-im/utils/conversation'
import { navigateBackPlus } from '@/utils'
import { ImConversationType } from '@/pages-im/utils/constants'
import { useGroupStore } from '../../../store/groupStore'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import GroupItem from '../components/group-item.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const keyword = ref('') // 搜索关键词
const groupStore = useGroupStore()
const { groups, loading } = storeToRefs(groupStore)

/** 群聊过滤列表（排除已退群） */
const filteredGroups = computed(() => {
  const word = keyword.value.trim().toLowerCase()
  return groups.value
    .filter(group => !isGroupQuit(group))
    .filter((item) => {
      if (!word) {
        return true
      }
      return getGroupName(item).toLowerCase().includes(word)
    })
})

/** 返回 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 打开群聊 */
function openChat(item: Group) {
  uni.navigateTo({
    url: buildConversationMessageUrl({
      type: ImConversationType.GROUP,
      targetId: item.id,
    }),
  })
}

onShow(() => {
  void useImRuntimeStore().ensure()
  void groupStore.fetchGroupList()
})
</script>
