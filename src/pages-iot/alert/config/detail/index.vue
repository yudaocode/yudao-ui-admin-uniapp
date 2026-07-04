<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="告警配置详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="配置编号" :value="String(formData?.id || '-')" />
        <wd-cell title="配置名称" :value="formData?.name || '-'" />
        <wd-cell title="告警级别">
          <dict-tag :type="DICT_TYPE.IOT_ALERT_LEVEL" :value="formData?.level" />
        </wd-cell>
        <wd-cell title="配置状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="接收人" :value="formatReceiveUserNames(formData?.receiveUserNames)" />
        <wd-cell title="场景规则" :value="`${String(formData?.sceneRuleIds?.length || 0)} 条`" />
        <wd-cell title="接收类型">
          <view class="flex flex-wrap justify-end gap-8rpx">
            <dict-tag
              v-for="receiveType in formData?.receiveTypes"
              :key="receiveType"
              :type="DICT_TYPE.IOT_ALERT_RECEIVE_TYPE"
              :value="receiveType"
            />
            <text v-if="!formData?.receiveTypes?.length">-</text>
          </view>
        </wd-cell>
        <wd-cell title="配置描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['iot:alert-config:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:alert-config:delete'])"
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
import type { AlertConfig } from '@/api/iot/alert/config'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteAlertConfig, getAlertConfig } from '@/api/iot/alert/config'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<AlertConfig>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/alert/config/index')
}

/** 加载告警配置详情 */
async function getDetail() {
  if (props.id && !deleting.value) {
    formData.value = await getAlertConfig(Number(props.id))
  }
}

/** 编辑告警配置 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/alert/config/form/index?id=${props.id}` })
}

/** 格式化接收人 */
function formatReceiveUserNames(names?: string[]) {
  return names?.length ? names.join('、') : '-'
}

/** 删除告警配置 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该告警配置吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAlertConfig(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:alert-config:reload')
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
