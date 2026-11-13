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
    :empty-view-text="scope === 'mine' ? '暂无作品，去「创作」开始吧～' : '暂无公开作品'"
    @query="queryList"
  >
    <!-- 轮询提示 -->
    <template v-if="runningList.length > 0" #top>
      <view class="bg-[#eef4ff] px-24rpx py-12rpx text-22rpx text-[#1677ff]">
        有生成中任务时每 3 秒刷新
      </view>
    </template>

    <!-- 作品列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <!-- 图片 -->
        <view class="relative bg-[#f5f5f5]">
          <wd-img
            v-if="item.status === AiImageStatusEnum.SUCCESS && item.picUrl"
            :src="item.picUrl"
            width="100%"
            height="600rpx"
            mode="aspectFit"
            enable-preview
          />
          <view
            v-else-if="item.status === AiImageStatusEnum.IN_PROGRESS"
            class="h-400rpx flex flex-col items-center justify-center gap-16rpx px-80rpx text-24rpx text-[#999]"
          >
            <wd-loading size="40rpx" />
            <text>生成中 {{ item.progress || 0 }}%</text>
            <view class="w-full">
              <wd-progress :percentage="item.progress || 0" hide-text />
            </view>
            <text v-if="item.midjourneyOptions?.providerStatus">{{ item.midjourneyOptions.providerStatus }}</text>
          </view>
          <view v-else class="min-h-240rpx flex items-center justify-center px-40rpx py-80rpx text-24rpx text-[#f5222d] leading-38rpx">
            <text class="line-clamp-4 break-all text-center">{{ item.errorMessage || '生成失败' }}</text>
          </view>
          <!-- 类型、公开标记：Seedream 与通用模型同为 AI 生图，按平台区分 -->
          <view class="absolute left-16rpx top-16rpx flex gap-8rpx">
            <wd-tag v-if="item.platform === AiPlatformEnum.BYTEDANCE" type="primary">
              Seedream
            </wd-tag>
            <dict-tag v-else :type="DICT_TYPE.AI_IMAGE_MODE" :value="item.mode" />
            <wd-tag v-if="scope === 'mine' && item.publicStatus" type="success">
              已公开
            </wd-tag>
          </view>
        </view>

        <!-- 信息 -->
        <view class="p-24rpx">
          <view class="line-clamp-2 break-all text-28rpx text-[#333] leading-40rpx">
            {{ item.prompt || '（无提示词）' }}
          </view>
          <view class="mt-8rpx flex items-center justify-between gap-16rpx text-22rpx text-[#999]">
            <text class="min-w-0 flex-1 truncate">{{ item.model }}</text>
            <text class="shrink-0">{{ formatDate(item.createTime, 'MM-DD HH:mm') }}</text>
          </view>

          <!-- Midjourney：U / V 宫格按钮（与四宫格位置对应） -->
          <template v-if="scope === 'mine'">
            <view
              v-for="group in getGridButtonGroups(item)"
              :key="group.label"
              class="mt-16rpx flex items-center gap-12rpx"
            >
              <text class="shrink-0 text-22rpx text-[#999]">{{ group.label }}</text>
              <view class="grid grid-cols-4 flex-1 gap-12rpx">
                <wd-button
                  v-for="button in group.buttons"
                  :key="button.customId"
                  size="small"
                  variant="plain"
                  :loading="actingId === `${item.id}-${button.customId}`"
                  @click="handleAction(item, button)"
                >
                  {{ button.label }}
                </wd-button>
              </view>
            </view>
          </template>

          <!-- 操作 -->
          <view class="mt-20rpx flex flex-wrap items-center justify-end gap-16rpx">
            <wd-button size="small" variant="plain" @click="emit('detail', item)">
              详情
            </wd-button>
            <wd-button v-if="item.status === AiImageStatusEnum.SUCCESS && item.picUrl" size="small" variant="plain" @click="handleSave(item)">
              保存
            </wd-button>
            <template v-if="scope === 'mine'">
              <wd-button v-if="canRegenerate(item)" size="small" type="primary" variant="plain" @click="emit('regenerate', item)">
                重新生成
              </wd-button>
              <wd-button v-if="getMoreActions(item).length > 0" size="small" variant="plain" @click="openMore(item)">
                更多
              </wd-button>
            </template>
          </view>
        </view>
      </view>
    </view>
  </z-paging>

  <!-- 更多操作：Midjourney 其它按钮、公开、删除 -->
  <wd-action-sheet
    v-model="moreVisible"
    :actions="moreActions"
    cancel-text="取消"
    root-portal
    :z-index="30"
    @select="handleMoreSelect"
  />
</template>

<script lang="ts" setup>
import type { Action } from '@wot-ui/ui/components/wd-action-sheet/types'
import type { AiImage, AiImageMidjourneyButton } from '@/api/ai/image'
import { onHide, onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { deleteImageMy, getImageListMyByIds, getImagePageMy, getImagePagePublic, midjourneyAction, updateImagePublicMy } from '@/api/ai/image'
import { AiImageModeEnum, AiImageStatusEnum, AiPlatformEnum, DICT_TYPE, isMjGridButton, isMjHiddenButton, isMjInpaintButton } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { saveImageToAlbum } from '@/utils/download'

const props = defineProps<{
  scope: string // 列表来源：mine - 我的作品；public - 公开画廊
}>()

const emit = defineEmits<{
  detail: [item: AiImage]
  regenerate: [item: AiImage]
}>()

const toast = useToast()
const dialog = useDialog()
const pollInterval = 3000 // 有生成中任务时的刷新间隔
const list = ref<AiImage[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const actingId = ref('') // 执行中的 Midjourney 按钮：作品编号-按钮标识
const moreVisible = ref(false) // 更多操作显示状态
const moreTarget = ref<AiImage>() // 更多操作的作品
const moreActions = ref<Action[]>([]) // 更多操作的选项
const runningList = computed(() => props.scope === 'mine' ? list.value.filter(item => item.status === AiImageStatusEnum.IN_PROGRESS) : []) // 生成中的作品：只在我的作品轮询
let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 上一次轮询未返回时不再发起

/** 查询作品列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = props.scope === 'mine'
      ? await getImagePageMy({ pageNo, pageSize })
      : await getImagePagePublic({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

/** Midjourney 按钮：只在成功后展示；CustomZoom 本期隐藏 */
function getButtons(item: AiImage) {
  if (item.status !== AiImageStatusEnum.SUCCESS) {
    return []
  }
  return (item.midjourneyOptions?.buttons || []).filter(button => !isMjHiddenButton(button.customId))
}

/** Midjourney U / V 宫格按钮：换脸结果没有 U / V */
function getGridButtonGroups(item: AiImage) {
  if (item.mode === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    return []
  }
  const buttons = getButtons(item).filter(button => isMjGridButton(button.customId))
  return [
    { label: '放大', buttons: buttons.filter(button => button.customId.includes('::upsample::')) },
    { label: '变化', buttons: buttons.filter(button => button.customId.includes('::variation::')) },
  ].filter(group => group.buttons.length > 0)
}

/** Midjourney 按钮的展示文案 */
function getButtonText(button: AiImageMidjourneyButton) {
  return [button.emoji, button.label].filter(Boolean).join(' ') || button.customId.split('::')[2]
}

/** 重新生成：按钮动作、局部重绘是派生任务，不回填 */
function canRegenerate(item: AiImage) {
  return item.mode !== AiImageModeEnum.MIDJOURNEY_ACTION
    && item.mode !== AiImageModeEnum.MIDJOURNEY_MODAL
    && item.status !== AiImageStatusEnum.IN_PROGRESS
}

/** 更多操作：Midjourney 其它按钮、公开 / 取消公开、删除；局部重绘需要绘制蒙版，移动端暂不支持 */
function getMoreActions(item: AiImage): Action[] {
  const actions: Action[] = getButtons(item)
    .filter(button => !isMjGridButton(button.customId))
    .map(button => isMjInpaintButton(button.customId)
      ? { name: getButtonText(button), description: '局部重绘需要绘制蒙版，请在 PC 端操作', disabled: true }
      : { name: getButtonText(button), button })
  if (item.status === AiImageStatusEnum.SUCCESS) {
    actions.push({ name: item.publicStatus ? '取消公开' : '公开', value: 'public' })
  }
  if (item.status !== AiImageStatusEnum.IN_PROGRESS) {
    actions.push({ name: '删除', color: '#f5222d', value: 'delete' })
  }
  return actions
}

/** 打开更多操作 */
function openMore(item: AiImage) {
  moreTarget.value = item
  moreActions.value = getMoreActions(item)
  moreVisible.value = true
}

/** 选择更多操作 */
function handleMoreSelect({ item }: { item: Action }) {
  const image = moreTarget.value
  if (!image) {
    return
  }
  if (item.value === 'public') {
    handlePublic(image)
  } else if (item.value === 'delete') {
    handleDelete(image)
  } else if (item.button) {
    handleAction(image, item.button)
  }
}

/** 执行 Midjourney 按钮：生成一条新的作品，回到第 1 页 */
async function handleAction(item: AiImage, button: AiImageMidjourneyButton) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认执行「${getButtonText(button)}」？将生成一条新的作品` })
  } catch {
    return
  }
  actingId.value = `${item.id}-${button.customId}`
  try {
    await midjourneyAction({ id: item.id, customId: button.customId })
    toast.success('已提交')
    reload()
  } finally {
    actingId.value = ''
  }
}

/** 保存图片 */
async function handleSave(item: AiImage) {
  await saveImageToAlbum(item.picUrl!, `ai-image-${item.id}.png`)
}

/** 公开、取消公开 */
async function handlePublic(item: AiImage) {
  const publicStatus = !item.publicStatus
  try {
    await dialog.confirm({
      title: '提示',
      msg: publicStatus ? '确认公开该作品？公开后同租户的用户可在公开画廊看到' : '确认取消公开？取消后公开画廊不再展示',
    })
  } catch {
    return
  }
  await updateImagePublicMy({ id: item.id, publicStatus })
  item.publicStatus = publicStatus
  toast.success(publicStatus ? '已公开' : '已取消公开')
}

/** 删除 */
async function handleDelete(item: AiImage) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定删除该作品吗？派生作品与图片文件不随之删除。' })
  } catch {
    return
  }
  await deleteImageMy(item.id)
  toast.success('删除成功')
  reload()
}

/** 轮询生成中的作品：按编号批量刷新，避免重载分页打断滚动位置 */
async function pollRunning() {
  if (polling || runningList.value.length === 0) {
    return
  }
  polling = true
  try {
    const data = await getImageListMyByIds(runningList.value.map(item => item.id))
    data.forEach((image) => {
      const item = list.value.find(row => row.id === image.id)
      if (item) {
        Object.assign(item, image)
      }
    })
  } catch {
    // 轮询失败不打断页面，等待下一次刷新
  } finally {
    polling = false
  }
}

/** 开始轮询 */
function startPolling() {
  stopPolling()
  pollTimer = setInterval(pollRunning, pollInterval)
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 初始化 */
onMounted(() => {
  startPolling()
})

/** 页面重新显示：恢复轮询 */
onShow(() => {
  startPolling()
})

/** 页面隐藏：暂停轮询 */
onHide(() => {
  stopPolling()
})

/** 卸载 */
onUnmounted(() => {
  stopPolling()
})

defineExpose({ reload })
</script>
