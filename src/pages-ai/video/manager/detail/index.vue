<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="视频详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容：管理员视角 -->
    <view v-if="formData" class="pb-160rpx">
      <VideoDetail :video="formData" admin />
      <wd-cell-group border>
        <wd-cell title="是否公开">
          <wd-switch
            v-if="hasAccessByCodes(['ai:video:update'])"
            :model-value="formData.publicStatus"
            :disabled="formData.status !== AiVideoStatusEnum.SUCCESS"
            @change="handlePublicChange"
          />
          <text v-else>{{ formData.publicStatus ? '是' : '否' }}</text>
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:video:delete'])" class="yd-detail-footer">
      <wd-button
        type="danger"
        block
        :loading="deleting"
        :disabled="isAiVideoRunning(formData?.status)"
        @click="handleDelete"
      >
        删除
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Video } from '@/api/ai/video'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteVideo, getVideo, updateVideo } from '@/api/ai/video'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiVideoStatusEnum, isAiVideoRunning } from '@/utils/constants'
import VideoDetail from '../../components/video-detail.vue'

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
const formData = ref<Video | null>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/video/manager/index')
}

/** 加载视频详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getVideo(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 切换公开状态 */
async function handlePublicChange({ value }: { value: unknown }) {
  if (!formData.value) {
    return
  }
  const publicStatus = !!value
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要“${publicStatus ? '公开' : '取消公开'}”该视频吗？`,
    })
  } catch {
    return
  }
  await updateVideo({ id: formData.value.id, publicStatus })
  formData.value.publicStatus = publicStatus
  toast.success('更新成功')
  uni.$emit('ai:video:reload')
}

/** 删除视频记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该视频记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVideo(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:video:reload')
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
