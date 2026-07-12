<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="绘图详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <view v-if="formData?.picUrl" class="bg-white p-24rpx">
        <wd-img
          :src="formData.picUrl"
          width="100%"
          height="480rpx"
          radius="8rpx"
          mode="aspectFit"
          enable-preview
        />
      </view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="用户" :value="getUserName(formData?.userId)" />
        <wd-cell title="绘画状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.AI_IMAGE_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="平台">
          <dict-tag v-if="formData?.platform" :type="DICT_TYPE.AI_PLATFORM" :value="formData.platform" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="模型" :value="formData?.model || '-'" />
        <wd-cell title="提示词" :value="formData?.prompt || '-'" />
        <wd-cell title="图片尺寸" :value="formatSize()" />
        <wd-cell title="绘制参数">
          <view class="whitespace-pre-wrap break-all text-26rpx text-[#666]">
            {{ formatOptions(formData?.options) }}
          </view>
        </wd-cell>
        <wd-cell title="图片地址" :value="formData?.picUrl || '-'" />
        <wd-cell title="是否公开">
          <wd-switch
            v-if="hasAccessByCodes(['ai:image:update']) && formData"
            v-model="formData.publicStatus"
            :disabled="formData.status !== AiImageStatusEnum.SUCCESS"
            @change="handlePublicChange"
          />
          <text v-else>{{ formData?.publicStatus ? '是' : '否' }}</text>
        </wd-cell>
        <wd-cell title="错误信息" :value="formData?.errorMessage || '-'" />
        <wd-cell title="完成时间" :value="formatDateTime(formData?.finishTime) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="formData?.picUrl" class="flex-1" type="primary" @click="handleCopyUrl">
          复制图片地址
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['ai:image:delete'])"
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
import type { AiImage } from '@/api/ai/image'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteImage, getImage, updateImage } from '@/api/ai/image'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiImageStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'

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
const formData = ref<AiImage>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/image/manager/index')
}

/** 加载绘图详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getImage(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 切换公开状态 */
async function handlePublicChange() {
  if (!formData.value?.id) {
    return
  }
  const publicStatus = formData.value.publicStatus
  const text = publicStatus ? '公开' : '私有'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要“${text}”该图片吗？`,
    })
  } catch {
    formData.value.publicStatus = !publicStatus
    return
  }
  try {
    await updateImage({
      id: formData.value.id,
      publicStatus,
    })
    toast.success('更新成功')
    uni.$emit('ai:image:reload')
  } catch {
    formData.value.publicStatus = !publicStatus
  }
}

/** 删除绘图记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该绘图记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteImage(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:image:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 复制图片地址 */
function handleCopyUrl() {
  if (!formData.value?.picUrl) {
    return
  }
  uni.setClipboardData({
    data: formData.value.picUrl,
    success: () => toast.success('已复制地址'),
  })
}

/** 格式化图片尺寸 */
function formatSize() {
  return formData.value?.width && formData.value?.height
    ? `${formData.value.width} × ${formData.value.height}`
    : '-'
}

/** 格式化绘制参数 */
function formatOptions(options?: Record<string, any>) {
  return options && Object.keys(options).length > 0 ? formatJson(options) : '-'
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
