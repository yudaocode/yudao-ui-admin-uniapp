<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 安灯呼叫记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        呼叫信息
      </view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
        <wd-cell title="工作站编码" :value="formData?.workstationCode || '-'" />
        <wd-cell title="工作站名称" :value="formData?.workstationName || '-'" />
        <wd-cell title="生产工单" :value="formData?.workOrderCode || '-'" />
        <wd-cell title="工序名称" :value="formData?.processName || '-'" />
        <wd-cell title="发起人" :value="formData?.userNickname || '-'" />
        <wd-cell title="发起时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="呼叫原因" :value="formData?.reason || '-'" />
        <wd-cell title="级别">
          <dict-tag v-if="formData?.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="formData.level" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="处置状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_ANDON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
      </wd-cell-group>

      <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        处置信息
      </view>
      <wd-cell-group border>
        <wd-cell title="处置时间" :value="formatDateTime(formData?.handleTime) || '-'" />
        <wd-cell title="处置人" :value="formData?.handlerUserNickname || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasActiveActions" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:pro-andon-record:update'])"
          class="flex-1"
          type="success"
          @click="handleDispose"
        >
          处置
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:pro-andon-record:delete'])"
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
import { onShow } from '@dcloudio/uni-app'
import type { ProAndonRecord } from '@/api/mes/pro/andon/record'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteAndonRecord, getAndonRecord } from '@/api/mes/pro/andon/record'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesProAndonStatusEnum } from '@/utils/constants'
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
const formData = ref<ProAndonRecord>() // 详情数据
const deleting = ref(false) // 删除状态
const hasActiveActions = computed(() => {
  return formData.value?.status === MesProAndonStatusEnum.ACTIVE
    && (hasAccessByCodes(['mes:pro-andon-record:update']) || hasAccessByCodes(['mes:pro-andon-record:delete']))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/andon/record/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getAndonRecord(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 处置 */
function handleDispose() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/andon/record/form/index?id=${props.id}&mode=update` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.reason || formData.value.id}」安灯呼叫记录吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAndonRecord(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:pro:andon:record:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
