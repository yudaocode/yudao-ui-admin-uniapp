<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="支付应用详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="应用编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="应用名" :value="formData.name || '-'" />
      <wd-cell title="应用标识" :value="formData.appKey || '-'" />
      <wd-cell title="开启状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="商户名称" :value="formData.merchantName || '-'" />
      <wd-cell title="支付渠道">
        <view class="flex justify-end">
          <dict-tag v-if="formData.channelCodes?.length" :type="DICT_TYPE.PAY_CHANNEL_CODE" :value="formData.channelCodes" />
          <text v-else>-</text>
        </view>
      </wd-cell>
      <wd-cell title="支付回调">
        <text class="break-all text-right text-[#333]">{{ formData.orderNotifyUrl || formData.payNotifyUrl || '-' }}</text>
      </wd-cell>
      <wd-cell title="退款回调">
        <text class="break-all text-right text-[#333]">{{ formData.refundNotifyUrl || '-' }}</text>
      </wd-cell>
      <wd-cell title="转账回调">
        <text class="break-all text-right text-[#333]">{{ formData.transferNotifyUrl || '-' }}</text>
      </wd-cell>
      <wd-cell title="备注" :value="formData.remark || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="canConfigChannel || hasAccessByCodes(['pay:app:update']) || hasAccessByCodes(['pay:app:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canConfigChannel" class="flex-1" type="primary" @click="handleChannelConfig">
          渠道配置
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['pay:app:update']) && formData.status != null" class="flex-1" :type="formData.status === CommonStatusEnum.ENABLE ? 'info' : 'success'" :loading="statusChanging" @click="handleToggleStatus">
          {{ formData.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['pay:app:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['pay:app:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PayApp } from '@/api/pay/app'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deletePayApp, getPayApp, updatePayAppStatus } from '@/api/pay/app'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PayApp>({}) // 详情数据
const deleting = ref(false) // 删除状态
const statusChanging = ref(false) // 状态切换中
const canConfigChannel = computed(() => !!props.id && hasAccessByCodes(['pay:channel:query'])) // 可查看渠道配置

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pay/app/index')
}

/** 切换启用/停用状态 */
async function handleToggleStatus() {
  const next = formData.value.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${next === CommonStatusEnum.ENABLE ? '启用' : '停用'}该支付应用吗？` })
  } catch {
    return
  }
  statusChanging.value = true
  try {
    await updatePayAppStatus({ id: Number(props.id), status: next })
    toast.success('操作成功')
    uni.$emit('pay:app:reload')
    await getDetail()
  } finally {
    statusChanging.value = false
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPayApp(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 渠道配置 */
function handleChannelConfig() {
  uni.navigateTo({ url: `/pages-pay/app/channel/index?appId=${props.id}` })
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-pay/app/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该支付应用吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePayApp(Number(props.id))
    toast.success('删除成功')
    uni.$emit('pay:app:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('pay:app:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('pay:app:reload', getDetail)
})
</script>
