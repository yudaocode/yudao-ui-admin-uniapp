<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar
      :title="navbarTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    >
      <template #right>
        <text
          v-if="showAddFriend"
          class="pr-8rpx text-28rpx text-[#333]"
          @click="openFriendApply"
        >
          添加朋友
        </text>
      </template>
    </wd-navbar>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar :title="navbarTitle" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <text
            v-if="showAddFriend"
            class="whitespace-nowrap text-26rpx text-[#333]"
            @click="openFriendApply"
          >
            添加朋友
          </text>
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <!-- 申请类型 -->
    <wd-tabs v-if="!singleGroupId" v-model="activeTab" line-theme="text" @change="handleTabChange">
      <wd-tab title="好友申请" :name="0" />
      <wd-tab title="加群申请" :name="1" />
    </wd-tabs>

    <FriendRequestList v-if="activeTab === 0" ref="friendRequestListRef" />
    <GroupRequestList v-else ref="groupRequestListRef" :group-id="singleGroupId" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { computed, nextTick, ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import { useImRuntimeStore } from '../../store/runtimeStore'
import FriendRequestList from './components/friend-request-list.vue'
import GroupRequestList from './components/group-request-list.vue'

const props = defineProps<{
  tab?: string
  groupId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const activeTab = ref(props.tab === 'group' ? 1 : 0) // 当前申请类型
const singleGroupId = computed(() => Number(props.groupId) || 0) // 指定群聊编号
const navbarTitle = computed(() => singleGroupId.value
  ? '进群申请'
  : activeTab.value === 0 ? '新的朋友' : '加群申请') // 当前页面标题
const showAddFriend = computed(() => !singleGroupId.value && activeTab.value === 0) // 是否显示添加朋友入口
const friendRequestListRef = ref<InstanceType<typeof FriendRequestList>>() // 好友申请列表引用
const groupRequestListRef = ref<InstanceType<typeof GroupRequestList>>() // 加群申请列表引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 打开添加朋友页 */
function openFriendApply() {
  uni.navigateTo({ url: '/pages-im/home/contact/friend/apply/index' })
}

/** 加载当前申请列表 */
function loadData() {
  if (activeTab.value === 0) {
    void friendRequestListRef.value?.load()
  } else {
    void groupRequestListRef.value?.load()
  }
}

/** 切换申请类型 */
async function handleTabChange() {
  await nextTick()
  loadData()
}

/** 初始化 */
onShow(async () => {
  void useImRuntimeStore().ensure()
  activeTab.value = singleGroupId.value || props.tab === 'group' ? 1 : activeTab.value
  await nextTick()
  loadData()
})
</script>
