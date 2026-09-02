<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="项目设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="project">
      <!-- 设置页签 -->
      <view class="bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <!-- 页签内容 -->
      <view class="min-h-0 flex-1">
        <BasicSection
          v-if="activeTab === 'basic'"
          :project="project"
          :editable="editable"
        />
        <MemberSection
          v-else-if="activeTab === 'member'"
          :project="project"
          :editable="editable"
        />
        <AnnouncementSection
          v-else-if="activeTab === 'announcement'"
          :project-id="project.id"
          :editable="editable"
        />
        <CollaborationSection
          v-else-if="activeTab === 'configuration'"
          :project-id="project.id"
          :project-type="project.type"
        />
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import { onUnload } from '@dcloudio/uni-app'
import { getProject } from '@/api/pms/pm/project'
import { PmsProjectStatus } from '@/pages-pms/pm/utils/constants'
import { navigateBackPlus } from '@/utils'
import AnnouncementSection from './components/announcement-section.vue'
import BasicSection from './components/basic-section.vue'
import CollaborationSection from './components/collaboration-section.vue'
import MemberSection from './components/member-section.vue'

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

const project = ref<Project>() // 项目详情
const tabIndex = ref(0) // 当前配置页签下标

const tabs = [ // 项目设置页签
  { key: 'basic', title: '基本信息' },
  { key: 'member', title: '成员' },
  { key: 'announcement', title: '项目公告' },
  { key: 'configuration', title: '协作配置' },
]
const activeTab = computed(() => tabs[tabIndex.value]?.key || 'basic') // 当前配置页签
const editable = computed(() =>
  Boolean(project.value?.writeStatus && project.value.status === PmsProjectStatus.ACTIVE),
) // 当前项目是否允许编辑

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询项目详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  project.value = await getProject(Number(props.id))
  const index = tabs.findIndex(tab => tab.key === props.tabs)
  if (index >= 0) {
    tabIndex.value = index
  }
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
