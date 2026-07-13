<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="频道详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="频道头像" center>
          <wd-img
            v-if="formData?.avatar"
            :src="formData.avatar"
            width="96rpx"
            height="96rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="频道编码" :value="formData?.code || '-'" />
        <wd-cell title="频道名称" :value="formData?.name || '-'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['im:manager:channel:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['im:manager:channel:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteManagerChannel, getManagerChannel } from '@/api/im/manager/channel'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<ImManagerChannelVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/index')
}

/** 加载频道详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getManagerChannel(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑频道 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-im/manager/channel/form/index?id=${props.id}`,
  })
}

/** 删除频道 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该频道吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteManagerChannel(Number(props.id))
    toast.success('删除成功')
    uni.$emit('im:manager:channel:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化频道详情和变更监听 */
onMounted(() => {
  uni.$on('im:manager:channel:reload', getDetail)
  getDetail()
})

/** 移除频道变更监听 */
onUnload(() => {
  uni.$off('im:manager:channel:reload', getDetail)
})
</script>
