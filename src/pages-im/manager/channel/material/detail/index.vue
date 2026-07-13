<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="素材详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="封面图" center>
          <wd-img
            v-if="formData?.coverUrl"
            :src="formData.coverUrl"
            width="120rpx"
            height="120rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="所属频道" :value="formData?.channelName || '-'" />
        <wd-cell title="内容类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.IM_CHANNEL_MATERIAL_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="标题" :value="formData?.title || '-'" />
        <wd-cell title="摘要" :value="formData?.summary || '-'" />
        <wd-cell v-if="formData?.type !== ImChannelMaterialType.CONTENT" title="跳转链接" :value="formData?.url || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 站内正文 -->
      <view v-if="formData?.type === ImChannelMaterialType.CONTENT && formData?.content" class="mt-20rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          正文
        </view>
        <view class="text-28rpx text-[#333] leading-44rpx">
          {{ formData.content }}
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['im:manager:channel-material:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['im:manager:channel-material:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerChannelMaterialVO } from '@/api/im/manager/channel/material'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteManagerChannelMaterial, getManagerChannelMaterial } from '@/api/im/manager/channel/material'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, ImChannelMaterialType } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ImManagerChannelMaterialVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/material/index')
}

/** 加载素材详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getManagerChannelMaterial(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑素材 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-im/manager/channel/material/form/index?id=${props.id}`,
  })
}

/** 删除素材 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该素材吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteManagerChannelMaterial(Number(props.id))
    toast.success('删除成功')
    uni.$emit('im:manager:channel-material:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化频道素材详情和变更监听 */
onMounted(() => {
  uni.$on('im:manager:channel-material:reload', getDetail)
  getDetail()
})

/** 移除频道素材变更监听 */
onUnload(() => {
  uni.$off('im:manager:channel-material:reload', getDetail)
})
</script>
