<template>
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无项目，点击右下角新建"
    @query="queryList"
  >
    <!-- 搜索：项目名称 -->
    <template #top>
      <view class="bg-white">
        <wd-search v-model="name" placeholder="搜索项目名称" hide-cancel @search="reload" @clear="reload" />
      </view>
    </template>

    <!-- 项目列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="handleOpen(item)"
      >
        <view class="flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1 break-all text-32rpx text-[#333] font-semibold">
            {{ item.name }}
          </view>
          <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="item.status" />
        </view>
        <view class="mt-12rpx flex flex-wrap items-center gap-8rpx text-24rpx text-[#999]">
          <dict-tag v-if="item.style" :type="DICT_TYPE.AI_DRAMA_STYLE" :value="item.style" />
          <text v-if="item.composeAspectRatio">{{ item.composeAspectRatio }}</text>
          <text>镜头视频 {{ item.storyboardSuccessCount || 0 }} / {{ item.storyboardCount || 0 }}</text>
        </view>
        <view class="mt-12rpx flex flex-wrap items-center gap-8rpx text-24rpx text-[#999]">
          <text>成片：</text>
          <dict-tag v-if="item.composeStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="item.composeStatus" />
          <text v-else>未合成</text>
          <wd-tag v-if="item.publicStatus" type="success">
            已公开
          </wd-tag>
        </view>
        <view v-if="item.description" class="line-clamp-2 mt-12rpx break-all text-26rpx text-[#666]">
          {{ item.description }}
        </view>
        <view class="mt-16rpx flex items-center justify-between gap-16rpx">
          <text class="text-22rpx text-[#999]">更新于 {{ formatDateTime(item.updateTime) || '-' }}</text>
          <view class="flex shrink-0 gap-16rpx">
            <wd-button size="small" type="primary" variant="plain" @click.stop="handleOpen(item)">
              进入
            </wd-button>
            <wd-button
              size="small"
              type="danger"
              variant="plain"
              :disabled="isAiDramaRunning(item.composeStatus)"
              @click.stop="handleDelete(item)"
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
import { ref } from 'vue'
import { deleteDramaProjectMy, getDramaProjectMyPage } from '@/api/ai/drama/project'
import { DICT_TYPE, isAiDramaRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const toast = useToast()
const dialog = useDialog()
const list = ref<DramaProject[]>([]) // 项目列表
const pagingRef = ref<any>() // 分页组件引用
const name = ref('') // 项目名称搜索

/** 查询项目列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getDramaProjectMyPage({ pageNo, pageSize, name: name.value || undefined })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 进入项目 */
function handleOpen(item: DramaProject) {
  uni.navigateTo({ url: `/pages-ai/drama/project/index?id=${item.id}` })
}

/** 删除项目 */
async function handleDelete(item: DramaProject) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '删除后剧本、资产、分镜一并删除，是否继续？',
    })
  } catch {
    return
  }
  await deleteDramaProjectMy(item.id)
  toast.success('删除成功')
  reload()
}

defineExpose({ reload })
</script>
