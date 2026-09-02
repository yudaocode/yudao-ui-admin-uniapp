<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="归档项目"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 项目列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无归档项目"
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
            <text class="mr-8rpx text-[#999]">归档时间：</text>{{ formatDateTime(item.archiveTime) || '-' }}
          </view>
          <view v-if="item.adminStatus && hasAccessByCodes(['pms:pm:project:update'])" class="flex justify-end">
            <wd-button size="small" variant="plain" @click="handleRestore(item)">
              恢复项目
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import { getProjectPage, restoreProject } from '@/api/pms/pm/project'
import { useAccess } from '@/hooks/useAccess'
import { PmsProjectSceneType, PmsProjectSortType, PmsProjectStatus } from '@/pages-pms/pm/utils/constants'
import { formatProjectTypeShort } from '@/pages-pms/pm/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'

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

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询归档项目分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProjectPage({
      pageNo,
      pageSize,
      sceneType: PmsProjectSceneType.ALL,
      status: PmsProjectStatus.ARCHIVED,
      sortType: PmsProjectSortType.ACCESS_TIME,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 恢复归档项目 */
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
</script>
