<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 视频生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="创作" />
        <wd-tab title="我的作品" />
        <wd-tab title="公开作品" />
      </wd-tabs>
    </view>

    <!-- 创作：切换 Tab 时保留表单内容；参数区单独滚动，生成按钮在下方独占一行 -->
    <view v-show="tabIndex === 0" class="min-h-0 flex flex-1 flex-col">
      <scroll-view scroll-y class="min-h-0 flex-1">
        <VideoCreatePanel ref="createPanelRef" />
      </scroll-view>

      <!-- 底部生成按钮 -->
      <view class="shrink-0 bg-white px-24rpx pb-[calc(16rpx+env(safe-area-inset-bottom))] pt-16rpx">
        <wd-button block type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '开始生成' }}
        </wd-button>
      </view>
    </view>

    <!-- 我的作品 / 公开作品 -->
    <VideoList
      v-if="tabIndex !== 0"
      :key="tabIndex"
      ref="listRef"
      :square="tabIndex === 2"
      @detail="openDetail"
      @same="handleSame"
      @delete="handleDelete"
    />

    <!-- 详情 -->
    <VideoDetailPopup ref="detailRef" @same="handleSame" />
  </view>
</template>

<script lang="ts" setup>
import type { Video } from '@/api/ai/video'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteVideoMy } from '@/api/ai/video'
import { navigateBackPlus } from '@/utils'
import VideoCreatePanel from './components/video-create-panel.vue'
import VideoDetailPopup from './components/video-detail-popup.vue'
import VideoList from './components/video-list.vue'

const props = defineProps<{
  id?: number | any // 深链打开的作品编号
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前 Tab：0 创作、1 我的作品、2 公开作品
const submitting = ref(false) // 提交状态
const createPanelRef = ref<InstanceType<typeof VideoCreatePanel>>() // 创作面板引用
const listRef = ref<InstanceType<typeof VideoList>>() // 作品列表引用
const detailRef = ref<InstanceType<typeof VideoDetailPopup>>() // 详情弹窗引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交：成功后切到我的作品，列表重新挂载后从第一页加载 */
async function handleSubmit() {
  if (!createPanelRef.value || submitting.value) {
    return
  }
  submitting.value = true
  try {
    if (await createPanelRef.value.submit()) {
      toast.success('任务已提交，生成完成后会出现在我的作品中')
      tabIndex.value = 1
    }
  } finally {
    submitting.value = false
  }
}

/** 详情 */
function openDetail(item: Video) {
  detailRef.value?.open(item.id)
}

/** 做同款：带回创作面板 */
function handleSame(item: Video) {
  tabIndex.value = 0
  if (createPanelRef.value?.applySame(item)) {
    toast.success('已带入类型、模型与参数，请上传素材后生成')
  }
}

/** 删除 */
async function handleDelete(item: Video) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认删除该作品？删除后不可恢复。',
    })
  } catch {
    return
  }
  await deleteVideoMy(item.id)
  toast.success('删除成功')
  listRef.value?.reload()
}

/** 初始化：?id= 深链打开详情 */
onMounted(() => {
  if (props.id) {
    detailRef.value?.open(Number(props.id))
  }
})
</script>
