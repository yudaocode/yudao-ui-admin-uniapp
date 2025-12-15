<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="菜单管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 面包屑导航 -->
    <Breadcrumb ref="breadcrumbRef" v-model="currentParentId" />

    <!-- 菜单列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in currentList"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <!-- 主内容区域：点击进入详情 -->
        <view class="p-24rpx" @click="handleDetail(item)">
          <!-- 第一行：图标、名称、状态标签 -->
          <view class="flex items-center justify-between">
            <view class="flex items-center">
              <view class="mr-16rpx h-48rpx w-48rpx flex items-center justify-center rounded-8rpx" :class="getTypeIconBg(item.type)">
                <wd-icon :name="getTypeIcon(item.type)" size="20px" color="#fff" />
              </view>
              <view class="text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <!-- 第二行：类型描述、子菜单入口 -->
          <view class="mt-12rpx flex items-center justify-between pl-64rpx">
            <view class="text-24rpx text-[#999]">
              {{ getTypeDesc(item) }}
            </view>
            <view
              v-if="item.children && item.children.length > 0"
              class="flex items-center"
              @click.stop="handleEnterChildren(item)"
            >
              <text class="text-24rpx text-[#1890ff]">子菜单 ({{ item.children.length }})</text>
              <wd-icon name="arrow-right" size="12px" color="#1890ff" />
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无菜单数据" />
      </view>
    </view>

    <!-- 新增按钮 -->
    <view
      class="fixed bottom-100rpx right-32rpx z-10 h-100rpx w-100rpx flex items-center justify-center rounded-full bg-[#1890ff] shadow-lg"
      @click="handleAdd"
    >
      <wd-icon name="add" size="24px" color="#fff" />
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Menu } from '@/api/system/menu'
import { computed, onMounted, ref } from 'vue'
import { getMenuList } from '@/api/system/menu'
import { DICT_TYPE, SystemMenuTypeEnum } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const loading = ref(false)
const list = ref<Menu[]>([]) // 完整菜单列表（树形结构）

const currentParentId = ref(0) // 当前层级的父节点编号
const currentList = computed(() => {
  if (currentParentId.value === 0) {
    return list.value.filter(item => item.parentId === 0)
  }
  return findChildren(list.value, currentParentId.value)
}) // 当前层级的菜单列表
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()

/** 返回上一页或上一层级 */
function handleBack() {
  if (!breadcrumbRef.value?.back()) {
    uni.navigateBack()
  }
}

/** 获取菜单类型图标 */
function getTypeIcon(type: number): string {
  switch (type) {
    case SystemMenuTypeEnum.DIR:
      return 'folder'
    case SystemMenuTypeEnum.MENU:
      return 'read'
    case SystemMenuTypeEnum.BUTTON:
      return 'tips'
    default:
      return 'folder'
  }
}

/** 获取菜单类型图标背景色 */
function getTypeIconBg(type: number): string {
  switch (type) {
    case SystemMenuTypeEnum.DIR:
      return 'bg-[#1890ff]'
    case SystemMenuTypeEnum.MENU:
      return 'bg-[#52c41a]'
    case SystemMenuTypeEnum.BUTTON:
      return 'bg-[#faad14]'
    default:
      return 'bg-[#1890ff]'
  }
}

/** 获取菜单类型描述（根据类型展示不同信息） */
function getTypeDesc(item: Menu): string {
  switch (item.type) {
    case SystemMenuTypeEnum.DIR:
      return `路由：${item.path}`
    case SystemMenuTypeEnum.MENU:
      return `路由：${item.path}`
    case SystemMenuTypeEnum.BUTTON:
      return `权限：${item.permission}`
    default:
      return ''
  }
}

/** 进入子菜单层级 */
function handleEnterChildren(item: Menu) {
  breadcrumbRef.value?.enter({ id: item.id!, name: item.name })
}

/** 查询菜单列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getMenuList()
    list.value = handleTree(data)
  } finally {
    loading.value = false
  }
}

/** 新增菜单 */
function handleAdd() {
  uni.navigateTo({
    url: `/pages-system/menu/form/index?parentId=${currentParentId.value}`,
  })
}

/** 查看详情 */
function handleDetail(item: Menu) {
  uni.navigateTo({
    url: `/pages-system/menu/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
</style>
