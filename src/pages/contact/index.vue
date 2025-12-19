<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="通讯录"
      placeholder safe-area-inset-top fixed
    />

    <!-- 面包屑导航 -->
    <Breadcrumb ref="breadcrumbRef" v-model="currentDeptId" />

    <!-- 通讯录列表 -->
    <view class="p-24rpx">
      <!-- 部门列表 -->
      <view
        v-for="item in currentDeptList"
        :key="`dept-${item.id}`"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleEnterDept(item)"
      >
        <view class="flex items-center p-24rpx">
          <view class="mr-16rpx h-80rpx w-80rpx flex items-center justify-center rounded-8rpx bg-[#1890ff]">
            <wd-icon name="folder" size="32px" color="#fff" />
          </view>
          <view class="flex-1">
            <view class="text-28rpx text-[#333] font-medium">
              {{ item.name }}
            </view>
            <view v-if="item.children && item.children.length > 0" class="mt-8rpx text-24rpx text-[#999]">
              {{ item.children.length }} 个子部门
            </view>
          </view>
          <wd-icon name="arrow-right" size="16px" color="#999" />
        </view>
      </view>

      <!-- 用户列表 -->
      <view v-if="currentDeptList.length > 0 && currentUserList.length > 0" class="my-24rpx flex items-center">
        <view class="h-1rpx flex-1 bg-[#ddd]" />
        <text class="mx-16rpx text-24rpx text-[#999]">部门成员</text>
        <view class="h-1rpx flex-1 bg-[#ddd]" />
      </view>
      <view
        v-for="item in currentUserList"
        :key="`user-${item.id}`"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleUserClick(item)"
      >
        <view class="flex items-center p-24rpx">
          <view
            v-if="item.avatar"
            class="mr-16rpx h-80rpx w-80rpx overflow-hidden rounded-full"
          >
            <image :src="item.avatar" class="h-full w-full" mode="aspectFill" />
          </view>
          <view
            v-else
            class="mr-16rpx h-80rpx w-80rpx flex items-center justify-center rounded-full bg-[#1890ff] text-32rpx text-white"
          >
            {{ item.nickname?.charAt(0) || item.username?.charAt(0) }}
          </view>
          <view class="flex-1">
            <view class="text-28rpx text-[#333] font-medium">
              {{ item.nickname }}
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && currentDeptList.length === 0 && currentUserList.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无数据" />
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSimpleDeptList } from '@/api/system/dept'
import { getSimpleUserList, getUser } from '@/api/system/user'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false)
const deptList = ref<Dept[]>([]) // 完整部门列表（树形结构）
const userList = ref<User[]>([]) // 用户列表
const toast = useToast()

const currentDeptId = ref(0) // 当前层级的部门编号
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()

/** 当前层级的部门列表 */
const currentDeptList = computed(() => {
  if (currentDeptId.value === 0) {
    return deptList.value.filter(item => item.parentId === 0)
  }
  return findChildren(deptList.value, currentDeptId.value)
})

/** 当前层级的用户列表 */
const currentUserList = computed(() => {
  if (currentDeptId.value === 0) {
    // 根层级不显示用户，只显示部门
    return []
  }
  return userList.value.filter(item => item.deptId === currentDeptId.value)
})

/** 进入部门层级 */
function handleEnterDept(item: Dept) {
  breadcrumbRef.value?.enter({ id: item.id!, name: item.name })
}

/** 点击用户：弹出联系方式 */
async function handleUserClick(item: User) {
  const userInfo = await getUser(item.id!)
  const actions: string[] = []
  if (userInfo.mobile) {
    actions.push(`手机：${userInfo.mobile}`)
  }
  if (userInfo.email) {
    actions.push(`邮箱：${userInfo.email}`)
  }
  if (actions.length === 0) {
    toast.show('暂无联系方式')
    return
  }
  uni.showActionSheet({
    title: userInfo.nickname,
    itemList: actions,
    success: (res) => {
      const selected = actions[res.tapIndex]
      if (selected.startsWith('手机')) {
        uni.makePhoneCall({ phoneNumber: userInfo.mobile! })
      } else if (selected.startsWith('邮箱')) {
        uni.setClipboardData({ data: userInfo.email!, success: () => {
          toast.success('邮箱已复制')
        } })
      }
    },
  })
}

/** 初始化 */
onMounted(async () => {
  loading.value = true
  try {
    // 获取部门列表
    const deptData = await getSimpleDeptList()
    deptList.value = handleTree(deptData)
    // 获取用户列表
    userList.value = await getSimpleUserList()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
</style>
