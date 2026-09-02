<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="我的项目" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon
            v-if="hasAccessByCodes(['pms:pm:project-group:query'])"
            name="menu-fold" size="38rpx" color="#333"
            @click="handleGroupManage"
          />
        </view>
      </template>
    </wd-navbar>

    <!-- 星标项目 -->
    <view v-if="favoriteList.length > 0" class="bg-white pb-16rpx">
      <view class="p-24rpx pb-8rpx text-28rpx text-[#333] font-semibold">
        星标项目
      </view>
      <scroll-view scroll-x class="whitespace-nowrap px-24rpx">
        <view
          v-for="item in favoriteList"
          :key="item.id"
          class="mr-16rpx inline-block w-280rpx rounded-12rpx bg-[#f7f8fa] p-20rpx align-top"
          @click="handleDetail(item)"
        >
          <view class="mb-8rpx flex items-center justify-between gap-8rpx">
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#1677ff]">{{ item.name }}</text>
            <wd-icon name="star-fill" size="32rpx" color="#fa8c16" @click.stop="handleCollect(item)" />
          </view>
          <view class="mb-8rpx truncate text-24rpx text-[#999]">
            {{ formatProjectTypeShort(item.type) }} · {{ item.description || '暂无项目描述' }}
          </view>
          <wd-progress :percentage="formatProjectCompletionRate(item)" hide-text />
          <TrendBars
            v-if="item.completedTrends?.length"
            :values="item.completedTrends.map(point => point.count)"
            height="60rpx"
            class="mt-8rpx"
          />
        </view>
      </scroll-view>
    </view>

    <!-- 项目范围页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleSceneChange">
        <wd-tab
          v-for="tab in sceneTabs"
          :key="tab.value"
          :title="tab.label"
        />
      </wd-tabs>
    </view>

    <!-- 搜索组件 -->
    <SearchForm
      :is-participated-scene="isParticipatedScene"
      :groups="groupList"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 项目列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无项目"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="flex shrink-0 items-center gap-12rpx">
              <wd-tag type="primary" plain>
                {{ formatProjectTypeShort(item.type) }}
              </wd-tag>
              <wd-icon
                :name="item.favoriteStatus ? 'star-fill' : 'star'" size="36rpx"
                :color="item.favoriteStatus ? '#fa8c16' : '#999'"
                @click.stop="handleCollect(item)"
              />
              <wd-icon name="more-vertical" size="36rpx" color="#666" @click.stop="handleMore(item)" />
            </view>
          </view>
          <view class="mb-12rpx flex items-center gap-16rpx">
            <wd-progress class="flex-1" :percentage="formatProjectCompletionRate(item)" hide-text />
            <text class="shrink-0 text-24rpx text-[#999]">
              {{ item.completedWorkItemCount }}/{{ item.pendingWorkItemCount }}/{{ item.processingWorkItemCount }}
            </text>
          </view>
          <view class="flex items-center justify-between text-28rpx text-[#666]">
            <text class="min-w-0 flex-1 truncate">
              <text class="mr-8rpx text-[#999]">管理员：</text>{{ item.adminNames.join('、') || '-' }}
            </text>
            <text class="shrink-0 text-[#999]">
              {{ item.endTime ? `${formatDate(item.endTime)} 截止` : `创建于 ${formatDate(item.createTime) || '-'}` }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['pms:pm:project:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="actionVisible"
      :actions="actionList"
      @select="handleActionSelect"
    />

    <!-- 移动到分组 -->
    <wd-action-sheet
      v-model="groupVisible"
      :actions="groupActions"
      @select="handleGroupSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import type { ProjectGroup } from '@/api/pms/pm/project/group'
import { onUnload } from '@dcloudio/uni-app'
import {
  archiveProject,
  getFavoriteProjectList,
  getProjectOverview,
  getProjectPage,
  recycleProject,
} from '@/api/pms/pm/project'
import { createProjectFavorite, deleteProjectFavorite } from '@/api/pms/pm/project/favorite'
import { getProjectGroupList, moveProjectToGroup } from '@/api/pms/pm/project/group'
import { exitProject } from '@/api/pms/pm/project/member'
import { useAccess } from '@/hooks/useAccess'
import {
  PmsProjectGroupType,
  PmsProjectSceneType,
  PmsProjectSortType,
  PmsProjectStatus,
  PmsProjectType,
} from '@/pages-pms/pm/utils/constants'
import { formatProjectCompletionRate, formatProjectTypeShort } from '@/pages-pms/pm/utils/format'
import { navigateBackPlus } from '@/utils'
import TrendBars from '@/pages-pms/pm/components/trend-bars.vue'
import { formatDate } from '@/utils/date'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(2) // 当前项目范围页签下标，默认「我参与的」
const sceneTabs = [ // 项目范围页签
  { label: '全部项目', value: PmsProjectSceneType.ALL },
  { label: '我负责的', value: PmsProjectSceneType.MANAGED },
  { label: '我参与的', value: PmsProjectSceneType.PARTICIPATED },
]
const list = ref<Project[]>([]) // 列表数据
const favoriteList = ref<Project[]>([]) // 星标项目列表
const groupList = ref<ProjectGroup[]>([]) // 个人项目分组列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ sortType: PmsProjectSortType.ACCESS_TIME }) // 查询参数
const actionVisible = ref(false) // 更多操作弹窗显示状态
const groupVisible = ref(false) // 移动分组弹窗显示状态
const currentProject = ref<Project>() // 当前操作的项目

const sceneType = computed(() => sceneTabs[tabIndex.value].value) // 当前项目范围
const isParticipatedScene = computed(() => sceneType.value === PmsProjectSceneType.PARTICIPATED) // 是否「我参与的」场景
const movableGroupList = computed(() =>
  groupList.value.filter(item => item.type !== PmsProjectGroupType.ALL),
) // 可以移动到的个人分组
const actionList = computed(() => { // 当前项目的更多操作项
  const project = currentProject.value
  if (!project) {
    return []
  }
  const actions: Array<{ name: string }> = []
  if (project.adminStatus && hasAccessByCodes(['pms:pm:project:update'])) {
    actions.push({ name: '项目设置' })
  }
  if (project.memberStatus && movableGroupList.value.length > 0) {
    actions.push({ name: '移动到分组' })
  }
  if (project.exitStatus && hasAccessByCodes(['pms:pm:project-member:query'])) {
    actions.push({ name: '退出项目' })
  }
  if (project.adminStatus && hasAccessByCodes(['pms:pm:project:update'])) {
    actions.push({ name: '归档项目' }, { name: '移入回收站' })
  }
  return actions
})
const groupActions = computed(() => movableGroupList.value.map(item => ({ name: item.name }))) // 移动分组操作项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询项目分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProjectPage({
      ...queryParams.value,
      pageNo,
      pageSize,
      sceneType: sceneType.value,
      status: PmsProjectStatus.ACTIVE,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查询星标项目列表（并行补齐各项目完成趋势，对齐 PC） */
async function getFavoriteList() {
  const projects = await getFavoriteProjectList()
  favoriteList.value = await Promise.all(
    projects.map(async project => ({
      ...project,
      completedTrends: (await getProjectOverview(project.id)).completedTrends,
    })),
  )
}

/** 查询个人项目分组 */
async function getGroupList() {
  groupList.value = await getProjectGroupList()
}

/** 切换项目范围 */
function handleSceneChange() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({ sortType: PmsProjectSortType.ACCESS_TIME })
}

/** 查看项目详情（敏捷项目默认落「待规划」页签，对齐 PC） */
function handleDetail(item: Project) {
  const query = item.type === PmsProjectType.AGILE ? '&tabs=planning' : ''
  uni.navigateTo({ url: `/pages-pms/pm/project/detail/index?id=${item.id}${query}` })
}

/** 新建项目 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-pms/pm/project/form/index' })
}

/** 打开项目分组管理 */
function handleGroupManage() {
  uni.navigateTo({ url: '/pages-pms/pm/project/group/index' })
}

/** 打开更多操作 */
function handleMore(item: Project) {
  currentProject.value = item
  actionVisible.value = true
}

/** 更多操作选择 */
async function handleActionSelect({ item: action }: { item: { name: string } }) {
  const project = currentProject.value
  if (!project) {
    return
  }
  if (action.name === '项目设置') {
    uni.navigateTo({ url: `/pages-pms/pm/project/config/index?id=${project.id}` })
    return
  }
  if (action.name === '移动到分组') {
    groupVisible.value = true
    return
  }
  if (action.name === '退出项目') {
    await handleExit(project)
    return
  }
  try {
    if (action.name === '归档项目') {
      await dialog.confirm({ title: '提示', msg: `确认归档项目“${project.name}”吗？` })
      await archiveProject(project.id)
      toast.success('项目已归档')
    } else if (action.name === '移入回收站') {
      await dialog.confirm({ title: '提示', msg: `确认将项目“${project.name}”移入回收站吗？` })
      await recycleProject(project.id)
      toast.success('项目已移入回收站')
    }
    await handleProjectChanged()
  } catch {}
}

/** 移动项目到个人分组 */
async function handleGroupSelect({ index }: { index: number }) {
  const project = currentProject.value
  const group = movableGroupList.value[index]
  if (!project || !group) {
    return
  }
  await moveProjectToGroup({ projectId: project.id, groupId: group.id })
  toast.success('项目分组已更新')
  await Promise.all([pagingRef.value?.reload(), getGroupList()])
}

/** 主动退出项目 */
async function handleExit(project: Project) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认退出项目“${project.name}”吗？退出后将不能访问该项目，需要项目管理员重新邀请才能加入。`,
    })
  } catch {
    return
  }
  await exitProject(project.id)
  toast.success('已退出项目')
  await handleProjectChanged()
}

/** 星标或取消星标项目 */
async function handleCollect(item: Project) {
  if (item.favoriteStatus) {
    await deleteProjectFavorite(item.id)
  } else {
    await createProjectFavorite(item.id)
  }
  toast.success(item.favoriteStatus ? '已取消星标' : '星标成功')
  item.favoriteStatus = !item.favoriteStatus
  getFavoriteList()
}

/** 项目发生变化后刷新项目与星标列表 */
async function handleProjectChanged() {
  await Promise.all([pagingRef.value?.reload(), getFavoriteList()])
}

/** 初始化 */
onMounted(() => {
  getGroupList()
  getFavoriteList()
  uni.$on('pms:pm:project:reload', handleProjectChanged)
  uni.$on('pms:pm:project-group:reload', getGroupList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pms:pm:project:reload', handleProjectChanged)
  uni.$off('pms:pm:project-group:reload', getGroupList)
})
</script>
