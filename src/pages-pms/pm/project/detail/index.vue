<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="project?.name || '项目详情'" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon
            v-if="project?.memberStatus"
            :name="project.favoriteStatus ? 'star-fill' : 'star'"
            size="38rpx"
            :color="project.favoriteStatus ? '#fa8c16' : '#333'"
            @click="handleCollect"
          />
          <wd-icon v-if="moreActions.length" name="more-vertical" size="38rpx" color="#333" @click="moreVisible = true" />
        </view>
      </template>
    </wd-navbar>

    <template v-if="project">
      <!-- 项目页签 -->
      <view class="bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in availableTabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <!-- 页签内容 -->
      <view class="min-h-0 flex-1">
        <OverviewSection
          v-if="activeTab === 'overview'"
          :key="`overview-${project.id}`"
          :project="project"
          :editable="editable"
          @open-tab="handleOpenTab"
        />
        <PlanningSection
          v-else-if="activeTab === 'planning'"
          :key="`planning-${project.id}`"
          :project-id="project.id"
          :project-type="project.type"
          :editable="editable"
        />
        <IterationSection
          v-else-if="activeTab === 'iteration'"
          :key="`iteration-${project.id}`"
          :project-id="project.id"
          :editable="editable"
        />
        <GanttSection
          v-else-if="activeTab === 'gantt'"
          :key="`gantt-${project.id}`"
          :project-id="project.id"
          :project-type="project.type"
          :editable="editable"
        />
        <WorklogSection
          v-else-if="activeTab === 'worklog'"
          :key="`worklog-${project.id}`"
          :project-id="project.id"
          :project-type="project.type"
          :editable="editable"
        />
        <WorkItemSection
          v-else
          :key="`workitem-${activeTab}-${project.id}`"
          :project-id="project.id"
          :project-type="project.type"
          :type="getWorkItemTabType()"
          :editable="editable"
          :initial-assignee-user-id="pendingAssigneeUserId"
        />
      </view>
    </template>

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="moreVisible"
      :actions="moreActions"
      @select="handleMoreSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getProject } from '@/api/pms/pm/project'
import { createProjectFavorite, deleteProjectFavorite } from '@/api/pms/pm/project/favorite'
import { exitProject } from '@/api/pms/pm/project/member'
import IterationSection from '@/pages-pms/pm/iteration/components/iteration-section.vue'
import WorkItemSection from '@/pages-pms/pm/workitem/components/work-item-section.vue'
import { PmsProjectStatus, PmsProjectType, PmsWorkItemType } from '@/pages-pms/pm/utils/constants'
import { navigateBackPlus } from '@/utils'
import GanttSection from './components/gantt-section.vue'
import OverviewSection from './components/overview-section.vue'
import PlanningSection from './components/planning-section.vue'
import WorklogSection from './components/worklog-section.vue'

const props = defineProps<{
  id?: number | any
  tabs?: string // 初始页签
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const project = ref<Project>() // 项目详情
const tabIndex = ref(0) // 当前页签下标
const moreVisible = ref(false) // 更多操作弹窗显示状态

const allTabs = [ // 项目详情页签
  { key: 'overview', title: '概况', agile: false },
  { key: 'planning', title: '待规划', agile: true },
  { key: 'iteration', title: '迭代', agile: true },
  { key: 'all', title: '全部事项', agile: true },
  { key: 'requirement', title: '需求', agile: true },
  { key: 'task', title: '任务', agile: false },
  { key: 'defect', title: '缺陷', agile: true },
  { key: 'gantt', title: '甘特图', agile: false },
  { key: 'worklog', title: '工时', agile: true },
]
const agileProject = computed(() => project.value?.type === PmsProjectType.AGILE) // 是否敏捷项目
const availableTabs = computed(() => allTabs.filter(tab => !tab.agile || agileProject.value)) // 当前项目可用页签
const activeTab = computed(() => availableTabs.value[tabIndex.value]?.key || 'overview') // 当前页签
const editable = computed(() =>
  Boolean(project.value?.writeStatus && project.value.status === PmsProjectStatus.ACTIVE),
) // 当前用户是否可以编辑项目业务数据
const moreActions = computed(() => { // 更多操作项
  if (!project.value) {
    return []
  }
  const actions: Array<{ name: string }> = []
  if (project.value.adminStatus) {
    actions.push({ name: '项目设置' })
  }
  if (project.value.exitStatus) {
    actions.push({ name: '退出项目' })
  }
  return actions
})

const pendingAssigneeUserId = ref<number>() // 概况「分配给我的-查看更多」带过来的负责人预选

/** 概况页请求切换页签 */
function handleOpenTab(tab: string, assigneeUserId?: number) {
  pendingAssigneeUserId.value = assigneeUserId
  const index = availableTabs.value.findIndex(item => item.key === tab)
  if (index >= 0) {
    tabIndex.value = index
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pms/pm/project/list/index')
}

/** 获得当前页签对应的工作项类型 */
function getWorkItemTabType() {
  return {
    requirement: PmsWorkItemType.REQUIREMENT,
    task: PmsWorkItemType.TASK,
    defect: PmsWorkItemType.DEFECT,
  }[activeTab.value]
}

/** 查询项目详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  project.value = await getProject(Number(props.id))
  // 初始化页签：路由指定页签有效时使用，否则默认任务页
  const requested = props.tabs
  const index = availableTabs.value.findIndex(tab => tab.key === requested)
  tabIndex.value = index >= 0 ? index : Math.max(availableTabs.value.findIndex(tab => tab.key === 'task'), 0)
}

/** 星标或取消星标项目 */
async function handleCollect() {
  if (!project.value) {
    return
  }
  if (project.value.favoriteStatus) {
    await deleteProjectFavorite(project.value.id)
  } else {
    await createProjectFavorite(project.value.id)
  }
  project.value.favoriteStatus = !project.value.favoriteStatus
  toast.success(project.value.favoriteStatus ? '收藏成功' : '已取消收藏')
}

/** 更多操作选择 */
async function handleMoreSelect({ item: action }: { item: { name: string } }) {
  if (!project.value) {
    return
  }
  if (action.name === '项目设置') {
    uni.navigateTo({ url: `/pages-pms/pm/project/config/index?id=${project.value.id}` })
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认退出项目“${project.value.name}”吗？退出后将不能访问该项目，需要项目管理员重新邀请才能加入。`,
    })
    await exitProject(project.value.id)
    toast.success('已退出项目')
    uni.$emit('pms:pm:project:reload')
    handleBack()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('pms:pm:project:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pms:pm:project:reload', getDetail)
})
</script>
