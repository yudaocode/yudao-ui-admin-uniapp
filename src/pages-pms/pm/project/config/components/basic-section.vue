<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view class="p-24rpx pb-60rpx">
      <!-- 项目基础字段 -->
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold">项目基本信息</text>
        <wd-button
          v-if="project.adminStatus && editable && hasAccessByCodes(['pms:pm:project:update'])"
          size="small" type="primary"
          @click="handleEdit"
        >
          编辑项目
        </wd-button>
      </view>
      <wd-cell-group border>
        <wd-cell title="项目名称" :value="project.name" />
        <wd-cell title="项目类型" :value="formatProjectType(project.type)" />
        <wd-cell title="项目周期" :value="`${formatDate(project.startTime) || '未设置'} 至 ${formatDate(project.endTime) || '未设置'}`" />
        <wd-cell title="可见范围" :value="formatProjectOpenStatus(project.openStatus)" />
        <wd-cell title="项目描述" :value="project.description || '暂无项目描述'" />
      </wd-cell-group>

      <!-- 项目生命周期管理 -->
      <template v-if="project.adminStatus && editable">
        <view class="mt-32rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="text-30rpx text-[#333] font-semibold">
                归档项目
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                归档后项目只允许查看，不能继续维护项目中的迭代和工作项。
              </view>
            </view>
            <wd-button size="small" variant="plain" @click="handleArchive">
              归档
            </wd-button>
          </view>
          <wd-divider />
          <view class="mt-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="text-30rpx text-[#333] font-semibold">
                移入回收站
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                项目进入回收站后不可访问；只有项目拥有者可以在回收站彻底删除。
              </view>
            </view>
            <wd-button size="small" type="danger" variant="plain" @click="handleRecycle">
              移入回收站
            </wd-button>
          </view>
        </view>
      </template>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { Project } from '@/api/pms/pm/project'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { archiveProject, recycleProject } from '@/api/pms/pm/project'
import { useAccess } from '@/hooks/useAccess'
import { formatProjectOpenStatus, formatProjectType } from '@/pages-pms/pm/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'

const props = defineProps<{
  project: Project
  editable: boolean
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()

/** 编辑项目 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-pms/pm/project/form/index?id=${props.project.id}` })
}

/** 归档项目 */
async function handleArchive() {
  try {
    await dialog.confirm({ title: '提示', msg: '归档后将不能继续操作项目中的数据，确认归档该项目吗？' })
  } catch {
    return
  }
  await archiveProject(props.project.id)
  toast.success('项目已归档')
  uni.$emit('pms:pm:project:reload')
  navigateBackPlus('/pages-pms/pm/project/archive/index')
}

/** 将项目移入回收站 */
async function handleRecycle() {
  try {
    await dialog.confirm({ title: '提示', msg: '确认将该项目移入回收站吗？' })
  } catch {
    return
  }
  await recycleProject(props.project.id)
  toast.success('项目已移入回收站')
  uni.$emit('pms:pm:project:reload')
  navigateBackPlus('/pages-pms/pm/project/recycle/index')
}
</script>
