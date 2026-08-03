<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="组织管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 面包屑导航 -->
    <Breadcrumb ref="breadcrumbRef" v-model="currentParentId" />

    <!-- 人数说明 -->
    <view class="mx-24rpx mt-16rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-16rpx text-24rpx text-[#1677ff]">
      人数格式为：直属人数（包含下级部门人数）
    </view>

    <!-- 组织列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in currentList"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <!-- 主内容区域：点击进入详情 -->
        <view class="p-24rpx" @click="handleDetail(item)">
          <view class="flex items-center justify-between">
            <view class="min-w-0 flex flex-1 items-center">
              <view class="mr-16rpx h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#13c2c2]">
                <wd-icon name="organization" size="20px" color="#fff" />
              </view>
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mt-16rpx pl-64rpx text-26rpx text-[#666]">
            <view class="mb-8rpx">
              <text class="mr-8rpx text-[#999]">在职员工：</text>
              {{ formatStatistics(item, 'activeCount') }}
            </view>
            <view class="mb-8rpx">
              <text class="mr-8rpx text-[#999]">全职员工：</text>
              {{ formatStatistics(item, 'fullTimeCount') }}
            </view>
            <view>
              <text class="mr-8rpx text-[#999]">非全职人数：</text>
              {{ formatStatistics(item, 'nonFullTimeCount') }}
            </view>
          </view>
          <view class="mt-12rpx flex items-center justify-between pl-64rpx">
            <view class="text-24rpx text-[#999]">
              负责人：{{ getLeaderName(item.leaderUserId) }}
            </view>
            <view
              v-if="item.children && item.children.length > 0"
              class="flex items-center"
              @click.stop="handleEnterChildren(item)"
            >
              <text class="text-24rpx text-[#1890ff]">下级 ({{ item.children.length }})</text>
              <wd-icon name="arrow-right" size="12px" color="#1890ff" />
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
        <wd-empty icon="content" tip="暂无组织数据" />
      </view>
    </view>

    <!-- 新建部门（跳转系统部门管理） -->
    <wd-fab
      v-if="hasAccessByCodes(['system:dept:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeDeptStatistics } from '@/api/hrm/employee'
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getEmployeeDeptStatistics } from '@/api/hrm/employee'
import { getSimpleDeptList } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
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

interface EmployeeStatistics {
  activeCount: number
  fullTimeCount: number
  nonFullTimeCount: number
}

interface DeptTreeNode extends Dept {
  children?: DeptTreeNode[]
  directStatistics: EmployeeStatistics
  totalStatistics: EmployeeStatistics
}

const EMPTY_STATISTICS: EmployeeStatistics = {
  activeCount: 0,
  fullTimeCount: 0,
  nonFullTimeCount: 0,
}

const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 列表加载状态
const deptTree = ref<DeptTreeNode[]>([]) // 组织树
const userList = ref<User[]>([]) // 用户列表
const appliedName = ref<string>() // 已应用的部门名称
const currentParentId = ref(0) // 当前层级的父节点编号
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()
const filteredDeptTree = computed(() => filterDeptTree(deptTree.value, appliedName.value)) // 过滤后的组织树
const currentList = computed(() => { // 当前层级的组织列表
  if (currentParentId.value === 0) {
    return filteredDeptTree.value
  }
  return findChildren(filteredDeptTree.value, currentParentId.value)
})

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

/** 格式化直属人数和包含下级的人数 */
function formatStatistics(item: DeptTreeNode, field: keyof EmployeeStatistics) {
  return `${item.directStatistics[field]}（${item.totalStatistics[field]}）`
}

/** 进入下级组织层级 */
function handleEnterChildren(item: DeptTreeNode) {
  breadcrumbRef.value?.enter({ id: item.id!, name: item.name })
}

/** 构建包含直属与下级人数统计的组织树 */
function buildDeptTree(
  deptList: Dept[],
  statisticsList: EmployeeDeptStatistics[],
): DeptTreeNode[] {
  function buildNode(dept: Dept): DeptTreeNode {
    const children = (dept.children || []).map(buildNode)
    const matched = statisticsList.find(statistics => statistics.deptId === dept.id)
    const directStatistics = matched
      ? {
          activeCount: matched.activeCount,
          fullTimeCount: matched.fullTimeCount,
          nonFullTimeCount: matched.nonFullTimeCount,
        }
      : { ...EMPTY_STATISTICS }
    const totalStatistics = children.reduce<EmployeeStatistics>(
      (statistics, child) => ({
        activeCount: statistics.activeCount + child.totalStatistics.activeCount,
        fullTimeCount: statistics.fullTimeCount + child.totalStatistics.fullTimeCount,
        nonFullTimeCount: statistics.nonFullTimeCount + child.totalStatistics.nonFullTimeCount,
      }),
      { ...directStatistics },
    )
    return {
      ...dept,
      children,
      directStatistics,
      totalStatistics,
    }
  }

  return (handleTree(deptList) as Dept[]).map(buildNode)
}

/** 按部门名称过滤组织树，并保留命中节点的上级路径 */
function filterDeptTree(deptList: DeptTreeNode[], name?: string): DeptTreeNode[] {
  const keyword = name?.trim()
  if (!keyword) {
    return deptList
  }
  return deptList.reduce<DeptTreeNode[]>((result, dept) => {
    const children = filterDeptTree(dept.children || [], keyword)
    if (dept.name.includes(keyword) || children.length > 0) {
      result.push({ ...dept, children })
    }
    return result
  }, [])
}

/** 查询组织树和员工统计 */
async function getList() {
  loading.value = true
  try {
    const [deptList, statisticsList] = await Promise.all([
      getSimpleDeptList(),
      getEmployeeDeptStatistics(),
    ])
    deptTree.value = buildDeptTree(deptList, statisticsList)
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  appliedName.value = data?.name
  // 重置面包屑
  currentParentId.value = 0
  breadcrumbRef.value?.reset()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 新建部门（跳转系统部门管理） */
function handleAdd() {
  uni.navigateTo({
    url: `/pages-system/dept/form/index?parentId=${currentParentId.value}`,
  })
}

/** 查看组织详情 */
function handleDetail(item: DeptTreeNode) {
  uni.navigateTo({
    url: `/pages-hrm/dept/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(async () => {
  userList.value = await getSimpleUserList()
  await getList()
  uni.$on('hrm:dept:reload', getList)
  uni.$on('system:dept:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:dept:reload', getList)
  uni.$off('system:dept:reload', getList)
})
</script>
