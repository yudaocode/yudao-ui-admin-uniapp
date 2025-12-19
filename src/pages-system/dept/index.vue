<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="部门管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 面包屑导航 -->
    <Breadcrumb ref="breadcrumbRef" v-model="currentParentId" />

    <!-- 部门列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in currentList"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <!-- 主内容区域：点击进入详情 -->
        <view class="p-24rpx" @click="handleDetail(item)">
          <!-- 第一行：名称、状态标签 -->
          <view class="flex items-center justify-between">
            <view class="flex items-center">
              <view class="mr-16rpx h-48rpx w-48rpx flex items-center justify-center rounded-8rpx bg-[#1890ff]">
                <wd-icon name="folder" size="20px" color="#fff" />
              </view>
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <!-- 第二行：负责人、子部门入口 -->
          <view class="mt-12rpx flex items-center justify-between pl-64rpx">
            <view class="text-24rpx text-[#999]">
              负责人：{{ getLeaderName(item.leaderUserId) }}
            </view>
            <view
              v-if="item.children && item.children.length > 0"
              class="flex items-center"
              @click.stop="handleEnterChildren(item)"
            >
              <text class="text-24rpx text-[#1890ff]">子部门 ({{ item.children.length }})</text>
              <wd-icon name="arrow-right" size="12px" color="#1890ff" />
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无部门数据" />
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { getDeptList } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false)
const list = ref<Dept[]>([]) // 完整部门列表（树形结构）
const userList = ref<User[]>([]) // 用户列表

const currentParentId = ref(0) // 当前层级的父节点编号
const currentList = computed(() => {
  if (currentParentId.value === 0) {
    return list.value.filter(item => item.parentId === 0)
  }
  return findChildren(list.value, currentParentId.value)
}) // 当前层级的部门列表
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()

const queryParams = ref<Record<string, any>>({})

/** 返回上一页或上一层级 */
function handleBack() {
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus()
  }
}

/** 获取负责人名称 */
function getLeaderName(leaderUserId?: number): string {
  if (!leaderUserId) {
    return '未设置'
  }
  const user = userList.value.find(u => u.id === leaderUserId)
  return user?.nickname || '未知'
}

/** 进入子部门层级 */
function handleEnterChildren(item: Dept) {
  breadcrumbRef.value?.enter({ id: item.id!, name: item.name })
}

/** 查询部门列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getDeptList(queryParams.value)
    list.value = handleTree(data)
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  // 重置面包屑
  currentParentId.value = 0
  breadcrumbRef.value?.reset()
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 新增部门 */
function handleAdd() {
  uni.navigateTo({
    url: `/pages-system/dept/form/index?parentId=${currentParentId.value}`,
  })
}

/** 查看详情 */
function handleDetail(item: Dept) {
  uni.navigateTo({
    url: `/pages-system/dept/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(async () => {
  // 获取用户列表
  userList.value = await getSimpleUserList()
  // 获取部门列表
  await getList()
})
</script>

<style lang="scss" scoped>
</style>
