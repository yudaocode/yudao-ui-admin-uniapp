<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="项目回收站"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <ProjectNameSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 项目列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="回收站暂无项目"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <wd-tag type="default" plain>
              {{ formatProjectTypeShort(item.type) }}
            </wd-tag>
          </view>
          <view class="mb-16rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">删除时间：</text>{{ formatDateTime(item.recycleTime) || '-' }}
          </view>
          <view class="flex justify-end gap-16rpx">
            <wd-button
              v-if="item.adminStatus && hasAccessByCodes(['pms:pm:project:update'])"
              size="small" variant="plain"
              @click="handleRestore(item)"
            >
              恢复项目
            </wd-button>
            <wd-button
              v-if="item.ownerStatus && hasAccessByCodes(['pms:pm:project:delete'])"
              size="small" type="danger" variant="plain"
              @click="handleDelete(item)"
            >
              彻底删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import { deleteProject, getProjectPage, restoreProject } from '@/api/pms/pm/project'
import { useAccess } from '@/hooks/useAccess'
import { PmsProjectSceneType, PmsProjectSortType, PmsProjectStatus } from '@/pages-pms/pm/utils/constants'
import { formatProjectTypeShort } from '@/pages-pms/pm/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import ProjectNameSearchForm from '../components/project-name-search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<Project[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询回收站项目分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProjectPage({
      ...queryParams.value,
      pageNo,
      pageSize,
      sceneType: PmsProjectSceneType.ALL,
      status: PmsProjectStatus.RECYCLED,
      sortType: PmsProjectSortType.ACCESS_TIME,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({})
}

/** 恢复回收站项目 */
async function handleRestore(item: Project) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认恢复项目“${item.name}”吗？` })
  } catch {
    return
  }
  await restoreProject(item.id)
  toast.success('项目已恢复')
  pagingRef.value?.reload()
}

/** 彻底删除回收站项目 */
async function handleDelete(item: Project) {
  try {
    await dialog.confirm({ title: '提示', msg: `彻底删除后不可恢复，确认删除项目“${item.name}”吗？` })
  } catch {
    return
  }
  await deleteProject(item.id)
  toast.success('项目已彻底删除')
  pagingRef.value?.reload()
}
</script>
