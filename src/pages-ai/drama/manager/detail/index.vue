<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="短剧项目详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容：管理员只读视角 -->
    <view v-if="formData" class="pb-160rpx">
      <!-- 成片 -->
      <view v-if="formData.project.composeStatus === AiDramaStatusEnum.SUCCESS && formData.project.composeFileUrl" class="bg-white p-24rpx">
        <video
          :src="formData.project.composeFileUrl"
          controls
          object-fit="contain"
          class="h-420rpx w-full rounded-8rpx bg-black"
        />
      </view>

      <!-- 基本信息 -->
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData.project.id" />
        <wd-cell title="项目名称" :value="formData.project.name" />
        <wd-cell title="用户" :value="formData.project.userNickname || formData.project.userId" />
        <wd-cell title="画风">
          <dict-tag v-if="formData.project.style" :type="DICT_TYPE.AI_DRAMA_STYLE" :value="formData.project.style" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="画幅" :value="formData.project.composeAspectRatio || '-'" />
        <wd-cell title="项目状态">
          <dict-tag :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" :value="formData.project.status" />
        </wd-cell>
        <wd-cell title="故事想法" layout="vertical" value-align="left">
          <text class="whitespace-pre-wrap break-all">{{ formData.project.idea || '-' }}</text>
        </wd-cell>
        <wd-cell title="成片状态">
          <dict-tag v-if="formData.project.composeStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="formData.project.composeStatus" />
          <text v-else>未合成</text>
        </wd-cell>
        <wd-cell title="成片时长" :value="formatAiDramaDuration(formData.project.composeDuration)" />
        <wd-cell title="成片镜头数" :value="formData.project.composeStoryboardCount ? `${formData.project.composeStoryboardCount} 个` : '-'" />
        <wd-cell
          v-if="formData.project.composeStatus === AiDramaStatusEnum.FAIL && formData.project.composeErrorMessage"
          title="合成失败原因"
          layout="vertical"
          value-align="left"
        >
          <text class="break-all text-[#f5222d]">{{ formData.project.composeErrorMessage }}</text>
        </wd-cell>
        <wd-cell title="是否公开">
          <wd-switch
            v-if="hasAccessByCodes(['ai:drama:update'])"
            :model-value="formData.project.publicStatus"
            :disabled="!formData.project.publicStatus && formData.project.composeStatus !== AiDramaStatusEnum.SUCCESS"
            @change="handlePublicChange"
          />
          <text v-else>{{ formData.project.publicStatus ? '是' : '否' }}</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData.project.createTime) || '-'" />
        <wd-cell title="更新时间" :value="formatDateTime(formData.project.updateTime) || '-'" />
      </wd-cell-group>

      <!-- 分类 Tab -->
      <view class="mt-16rpx bg-white">
        <wd-tabs v-model="tabIndex" shrink>
          <wd-tab title="剧本" />
          <wd-tab :title="`角色（${formData.characters.length}）`" />
          <wd-tab :title="`场景与道具（${formData.locations.length + propList.length}）`" />
          <wd-tab :title="`镜头（${formData.storyboards.length}）`" />
        </wd-tabs>
      </view>

      <!-- 当前剧本 -->
      <view v-if="tabIndex === 0" class="bg-white p-24rpx">
        <template v-if="formData.script">
          <view class="text-30rpx text-[#333] font-semibold">
            {{ formData.script.title || '-' }}
          </view>
          <view class="my-12rpx whitespace-pre-wrap break-all text-24rpx text-[#999]">
            {{ formData.script.outline }}
          </view>
          <view class="whitespace-pre-wrap break-all text-28rpx text-[#333] leading-44rpx">
            {{ formData.script.content }}
          </view>
        </template>
        <view v-else class="py-40rpx text-center text-26rpx text-[#999]">
          暂无剧本
        </view>
      </view>

      <!-- 角色 -->
      <view v-else-if="tabIndex === 1" class="bg-white p-24rpx">
        <view v-for="character in formData.characters" :key="character.id" class="mb-24rpx">
          <view class="text-28rpx text-[#333] font-semibold">
            {{ character.name }}
          </view>
          <view class="mb-12rpx break-all text-24rpx text-[#999]">
            {{ character.description }}
          </view>
          <view class="flex flex-wrap gap-12rpx">
            <view v-for="appearance in character.appearances" :key="appearance.id" class="shrink-0">
              <wd-img
                v-if="getSelectedImageUrl(appearance.imageUrls, appearance.selectedIndex)"
                :src="getSelectedImageUrl(appearance.imageUrls, appearance.selectedIndex)"
                width="160rpx"
                height="160rpx"
                radius="8rpx"
                mode="aspectFill"
                enable-preview
              />
              <view v-else class="h-160rpx w-160rpx flex flex-col items-center justify-center gap-8rpx rounded-8rpx bg-[#f5f5f5] px-8rpx text-center text-22rpx text-[#999]">
                <wd-loading v-if="isAiDramaRunning(appearance.status)" size="36rpx" />
                <text v-else-if="appearance.status === AiDramaStatusEnum.FAIL" class="line-clamp-3 break-all text-[#f5222d]">{{ appearance.errorMessage || '生成失败' }}</text>
                <text v-else>暂无图片</text>
              </view>
            </view>
          </view>
        </view>
        <view v-if="!formData.characters.length" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无角色
        </view>
      </view>

      <!-- 场景与道具 -->
      <view v-else-if="tabIndex === 2" class="bg-white p-24rpx">
        <view class="flex flex-wrap gap-20rpx">
          <view v-for="location in formData.locations" :key="`l${location.id}`" class="w-200rpx">
            <wd-img
              v-if="getSelectedImageUrl(location.imageUrls, location.selectedIndex)"
              :src="getSelectedImageUrl(location.imageUrls, location.selectedIndex)"
              width="200rpx"
              height="200rpx"
              radius="8rpx"
              mode="aspectFill"
              enable-preview
            />
            <view v-else class="h-200rpx w-200rpx flex flex-col items-center justify-center gap-8rpx rounded-8rpx bg-[#f5f5f5] px-8rpx text-center text-22rpx text-[#999]">
              <wd-loading v-if="isAiDramaRunning(location.status)" size="36rpx" />
              <text v-else-if="location.status === AiDramaStatusEnum.FAIL" class="line-clamp-3 break-all text-[#f5222d]">{{ location.errorMessage || '生成失败' }}</text>
              <text v-else>暂无图片</text>
            </view>
            <view class="mt-8rpx truncate text-center text-22rpx text-[#666]">
              场景：{{ location.name }}
            </view>
          </view>
          <view v-for="asset in propList" :key="`v${asset.id}`" class="w-200rpx">
            <wd-img
              v-if="asset.imageUrl"
              :src="asset.imageUrl"
              width="200rpx"
              height="200rpx"
              radius="8rpx"
              mode="aspectFill"
              enable-preview
            />
            <view v-else class="h-200rpx w-200rpx flex flex-col items-center justify-center gap-8rpx rounded-8rpx bg-[#f5f5f5] px-8rpx text-center text-22rpx text-[#999]">
              <wd-loading v-if="isAiDramaRunning(asset.status)" size="36rpx" />
              <text v-else-if="asset.status === AiDramaStatusEnum.FAIL" class="line-clamp-3 break-all text-[#f5222d]">{{ asset.errorMessage || '生成失败' }}</text>
              <text v-else>暂无图片</text>
            </view>
            <view class="mt-8rpx truncate text-center text-22rpx text-[#666]">
              道具：{{ asset.title }}
            </view>
          </view>
        </view>
        <view v-if="!formData.locations.length && !propList.length" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无场景与道具
        </view>
      </view>

      <!-- 当前版本镜头 -->
      <view v-else class="p-24rpx">
        <view
          v-for="item in formData.storyboards"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 break-all text-28rpx text-[#333] font-semibold">
              {{ item.sceneNo }}. {{ item.title || '-' }}
            </view>
            <dict-tag v-if="item.videoStatus" :type="DICT_TYPE.AI_DRAMA_STATUS" :value="item.videoStatus" />
            <text v-else class="shrink-0 text-24rpx text-[#999]">未生成</text>
          </view>
          <view class="mt-8rpx text-24rpx text-[#999]">
            时长：{{ item.duration ?? '-' }} 秒
          </view>
          <view class="mt-8rpx whitespace-pre-wrap break-all text-26rpx text-[#666]">
            {{ item.sceneText || '-' }}
          </view>
          <view v-if="item.taskId" class="mt-8rpx break-all text-22rpx text-[#999]">
            服务商任务：{{ item.taskId }}
          </view>
          <view v-if="item.videoStatus === AiDramaStatusEnum.FAIL" class="mt-8rpx break-all text-24rpx text-[#f5222d]">
            失败原因：{{ item.errorMessage || '-' }}
          </view>
          <video
            v-if="item.videoUrl"
            :src="item.videoUrl"
            controls
            object-fit="contain"
            class="mt-16rpx h-360rpx w-full rounded-8rpx bg-black"
          />
        </view>
        <view v-if="!formData.storyboards.length" class="py-40rpx text-center text-26rpx text-[#999]">
          暂无镜头
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:drama:delete'])" class="yd-detail-footer">
      <wd-button
        type="danger"
        block
        :loading="deleting"
        :disabled="isAiDramaRunning(formData?.project.composeStatus)"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteDramaProject, getDramaProjectDetail, updateDramaProjectPublic } from '@/api/ai/drama/project'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiDramaStatusEnum, AiDramaVisualAssetKindEnum, DICT_TYPE, formatAiDramaDuration, isAiDramaRunning } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<DramaProjectDetail>() // 详情数据
const deleting = ref(false) // 删除状态
const tabIndex = ref(0) // 当前 Tab：0 剧本、1 角色、2 场景与道具、3 镜头
const propList = computed(() => // 当前的道具：不含关键帧、历史版本
  (formData.value?.visualAssets || []).filter(item => item.kind === AiDramaVisualAssetKindEnum.PROP && !item.parentId),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/drama/manager/index')
}

/** 获得选用的候选图：未选用时为空 */
function getSelectedImageUrl(imageUrls?: string[], selectedIndex?: number) {
  if (!imageUrls?.length || selectedIndex === undefined || selectedIndex === null) {
    return undefined
  }
  return imageUrls[selectedIndex]
}

/** 加载项目详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDramaProjectDetail(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 切换公开状态：只有成片已完成的项目可以公开，取消不限 */
async function handlePublicChange({ value }: { value: unknown }) {
  if (!formData.value) {
    return
  }
  const publicStatus = !!value
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要“${publicStatus ? '公开' : '取消公开'}”该项目吗？`,
    })
  } catch {
    return
  }
  await updateDramaProjectPublic({ id: formData.value.project.id, publicStatus })
  formData.value.project.publicStatus = publicStatus
  toast.success('更新成功')
  uni.$emit('ai:drama:reload')
}

/** 删除项目 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '删除项目会一并删除剧本、资产、分镜与成片记录，是否继续？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDramaProject(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:drama:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
