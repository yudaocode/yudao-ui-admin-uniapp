<template>
  <!-- 搜索组件 -->
  <ProjectSearchForm @search="handleQuery" @reset="handleReset" />

  <!-- 项目列表 -->
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无短剧项目"
    @query="queryList"
  >
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1 break-all text-30rpx text-[#333] font-semibold">
            {{ item.name }}
          </view>
          <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="item.status" />
        </view>
        <view class="mt-12rpx flex flex-wrap items-center gap-8rpx text-24rpx text-[#999]">
          <dict-tag v-if="item.style" :type="DICT_TYPE.AI_DRAMA_STYLE" :value="item.style" />
          <text v-if="item.composeAspectRatio">{{ item.composeAspectRatio }}</text>
          <text>镜头 {{ item.storyboardSuccessCount || 0 }} / {{ item.storyboardCount || 0 }}</text>
        </view>
        <view class="mt-12rpx flex flex-wrap items-center gap-8rpx text-24rpx text-[#999]">
          <text>用户：{{ item.userNickname || '-' }}</text>
          <text>· 成片：</text>
          <dict-tag v-if="item.composeStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="item.composeStatus" />
          <text v-else>未合成</text>
          <text v-if="item.composeStatus === AiDramaStatusEnum.SUCCESS">· {{ formatAiDramaDuration(item.composeDuration) }}</text>
        </view>
        <view class="mt-12rpx text-22rpx text-[#999]">
          #{{ item.id }} · 更新于 {{ formatDateTime(item.updateTime) || '-' }}
        </view>
        <view class="mt-16rpx flex items-center justify-between gap-16rpx" @click.stop>
          <view class="flex items-center gap-12rpx text-26rpx text-[#666]">
            <text>公开</text>
            <wd-switch
              v-if="hasAccessByCodes(['ai:drama:update'])"
              :model-value="item.publicStatus"
              :disabled="!item.publicStatus && item.composeStatus !== AiDramaStatusEnum.SUCCESS"
              @change="handlePublicChange(item, $event)"
            />
            <text v-else>{{ item.publicStatus ? '是' : '否' }}</text>
          </view>
          <view class="flex shrink-0 gap-16rpx">
            <wd-button size="small" variant="plain" @click="handleDetail(item)">
              详情
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['ai:drama:delete'])"
              size="small"
              type="danger"
              variant="plain"
              :disabled="isAiDramaRunning(item.composeStatus)"
              @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { DramaProject } from '@/api/ai/drama/project'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref } from 'vue'
import { deleteDramaProject, getDramaProjectPage, updateDramaProjectPublic } from '@/api/ai/drama/project'
import { useAccess } from '@/hooks/useAccess'
import { AiDramaStatusEnum, DICT_TYPE, formatAiDramaDuration, isAiDramaRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ProjectSearchForm from './project-search-form.vue'

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<DramaProject[]>([]) // 项目列表
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询项目列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDramaProjectPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看项目详情 */
function handleDetail(item: DramaProject) {
  uni.navigateTo({ url: `/pages-ai/drama/manager/detail/index?id=${item.id}` })
}

/** 切换公开状态：只有成片已完成的项目可以公开，取消不限 */
async function handlePublicChange(item: DramaProject, { value }: { value: unknown }) {
  const publicStatus = !!value
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要“${publicStatus ? '公开' : '取消公开'}”该项目吗？`,
    })
  } catch {
    return
  }
  await updateDramaProjectPublic({ id: item.id, publicStatus })
  item.publicStatus = publicStatus
  toast.success('更新成功')
}

/** 删除项目 */
async function handleDelete(item: DramaProject) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '删除项目会一并删除剧本、资产、分镜与成片记录，是否继续？',
    })
  } catch {
    return
  }
  await deleteDramaProject(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:drama:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('ai:drama:reload', reload)
})
</script>
