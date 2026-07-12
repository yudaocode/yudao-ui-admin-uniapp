<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="音乐详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <view v-if="formData?.imageUrl" class="bg-white p-24rpx">
        <wd-img
          :src="formData.imageUrl"
          width="100%"
          height="360rpx"
          radius="8rpx"
          mode="aspectFit"
          enable-preview
        />
      </view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="用户" :value="getUserName(formData?.userId)" />
        <wd-cell title="音乐名称" :value="formData?.title || '-'" />
        <wd-cell title="音乐状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.AI_MUSIC_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="生成模式">
          <dict-tag v-if="formData?.generateMode != null" :type="DICT_TYPE.AI_GENERATE_MODE" :value="formData.generateMode" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="平台">
          <dict-tag v-if="formData?.platform" :type="DICT_TYPE.AI_PLATFORM" :value="formData.platform" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="模型" :value="formData?.model || '-'" />
        <wd-cell title="描述词" :value="formData?.gptDescriptionPrompt || '-'" />
        <wd-cell title="提示词" :value="formData?.prompt || '-'" />
        <wd-cell title="歌词" :value="formData?.lyric || '-'" />
        <wd-cell title="风格标签" :value="formatTags(formData?.tags)" />
        <wd-cell title="音乐时长" :value="formData?.duration != null ? `${formData.duration} 秒` : '-'" />
        <wd-cell title="任务编号" :value="formData?.taskId || '-'" />
        <wd-cell title="音频地址" :value="formData?.audioUrl || '-'" />
        <wd-cell title="视频地址" :value="formData?.videoUrl || '-'" />
        <wd-cell title="是否公开">
          <wd-switch
            v-if="hasAccessByCodes(['ai:music:update']) && formData"
            v-model="formData.publicStatus"
            :disabled="formData.status !== AiMusicStatusEnum.SUCCESS"
            @change="handlePublicChange"
          />
          <text v-else>{{ formData?.publicStatus ? '是' : '否' }}</text>
        </wd-cell>
        <wd-cell title="错误信息" :value="formData?.errorMessage || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="formData?.audioUrl" class="flex-1" type="primary" @click="handleCopyUrl(formData.audioUrl)">
          复制音频地址
        </wd-button>
        <wd-button v-if="formData?.videoUrl" class="flex-1" type="info" @click="handleCopyUrl(formData.videoUrl)">
          复制视频地址
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:music:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MusicVO } from '@/api/ai/music'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteMusic, getMusic, updateMusic } from '@/api/ai/music'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiMusicStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const formData = ref<MusicVO>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/music/manager/index')
}

/** 加载音乐详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMusic(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 切换公开状态 */
async function handlePublicChange() {
  if (!formData.value?.id) {
    return
  }
  try {
    await updateMusic({
      id: formData.value.id,
      publicStatus: formData.value.publicStatus,
    })
    toast.success('更新成功')
    uni.$emit('ai:music:reload')
  } catch {
    formData.value.publicStatus = !formData.value.publicStatus
  }
}

/** 删除音乐记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该音乐记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMusic(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:music:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 复制媒体地址 */
function handleCopyUrl(url: string) {
  uni.setClipboardData({
    data: url,
    success: () => toast.success('已复制地址'),
  })
}

/** 格式化风格标签 */
function formatTags(tags?: string[]) {
  return tags?.join('、') || '-'
}

/** 获取用户昵称 */
function getUserName(userId?: number) {
  return userList.value.find(user => user.id === userId)?.nickname || String(userId || '-')
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getSimpleUserList().then(data => userList.value = data),
  ])
})
</script>
