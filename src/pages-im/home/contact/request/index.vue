<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="singleGroupId ? '进群申请' : 'IM 申请'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

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
const friendRequestListRef = ref<InstanceType<typeof FriendRequestList>>() // 好友申请列表引用
const groupRequestListRef = ref<InstanceType<typeof GroupRequestList>>() // 加群申请列表引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
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
