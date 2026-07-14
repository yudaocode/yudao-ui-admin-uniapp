<template>
  <view class="yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="通讯录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 联系人列表 -->
    <view class="min-h-0 flex-1">
      <FriendList @add="handleAdd" />
    </view>

    <!-- 底部导航栏 -->
    <ImTabbar active="contact" />

    <!-- 新增操作菜单 -->
    <wd-action-sheet v-model="addActionVisible" :actions="addActions" @select="handleAddAction" />
  </view>
</template>

<script lang="ts" setup>
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { navigateBackPlus } from '@/utils'
import ImTabbar from '../components/im-tabbar.vue'
import { useImRuntimeStore } from '../store/runtimeStore'
import FriendList from './components/friend-list.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const addActionVisible = ref(false) // 新增操作菜单显示状态
const addActions = [ // 新增操作菜单项
  { name: '添加好友', value: 'friend' },
  { name: '创建群聊', value: 'group' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/index/index')
}

/** 打开新增操作 */
function handleAdd() {
  addActionVisible.value = true
}

/** 处理新增操作 */
function handleAddAction({ item }: { item: { value: string } }) {
  uni.navigateTo({
    url: item.value === 'friend'
      ? '/pages-im/home/contact/friend/apply/index'
      : '/pages-im/home/contact/group/form/index',
  })
}

/** 进入页面时确保 IM 运行时已启动 */
onShow(() => {
  void useImRuntimeStore().ensure()
})
</script>
