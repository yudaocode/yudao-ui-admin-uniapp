<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="表情详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="表情图" center>
          <wd-img
            v-if="formData?.url"
            :src="formData.url"
            width="120rpx"
            height="120rpx"
            radius="12rpx"
            mode="aspectFit"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="表情名" :value="formData?.name || '-'" />
        <wd-cell title="尺寸" :value="formData ? `${formData.width} × ${formData.height}` : '-'" />
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
          v-if="hasAccessByCodes(['im:manager:face-pack-item:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['im:manager:face-pack-item:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackItemVO } from '@/api/im/manager/face/item'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteManagerFacePackItem, getManagerFacePackItem } from '@/api/im/manager/face/item'
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
const formData = ref<ImManagerFacePackItemVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/face/item/index')
}

/** 加载表情详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getManagerFacePackItem(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑表情 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-im/manager/face/item/form/index?id=${props.id}`,
  })
}

/** 删除表情 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该表情吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteManagerFacePackItem(Number(props.id))
    toast.success('删除成功')
    uni.$emit('im:manager:face-pack-item:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化表情详情和变更监听 */
onMounted(() => {
  uni.$on('im:manager:face-pack-item:reload', getDetail)
  getDetail()
})

/** 移除表情变更监听 */
onUnload(() => {
  uni.$off('im:manager:face-pack-item:reload', getDetail)
})
</script>
