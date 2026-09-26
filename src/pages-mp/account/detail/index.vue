<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号账号详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="名称" :value="formData?.name || '-'" />
        <wd-cell title="微信号" :value="formData?.account || '-'" />
        <wd-cell title="AppID" :value="formData?.appId || '-'" />
        <wd-cell title="Token" :value="formatSecret(formData?.token)" />
        <wd-cell title="加解密密钥" :value="formatSecret(formData?.aesKey)" />
        <wd-cell title="服务器地址">
          <view class="break-all text-right text-26rpx text-[#666]">
            http://服务端地址/admin-api/mp/open/{{ formData?.appId || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="二维码">
          <wd-img v-if="formData?.qrCodeUrl" :src="formData.qrCodeUrl" width="180rpx" height="180rpx" mode="aspectFit" enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mp:account:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mp:account:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="moreActions.length > 0"
          class="flex-1" type="info" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
  </view>
</template>

<script lang="ts" setup>
import type { Account } from '@/api/mp/account'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { clearAccountQuota, deleteAccount, generateAccountQrCode, getAccount } from '@/api/mp/account'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
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
const formData = ref<Account>() // 详情数据
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 更多操作菜单
const moreActions = computed(() => {
  const actions = []
  if (hasAccessByCodes(['mp:account:qr-code']) && !formData.value?.qrCodeUrl) {
    actions.push({ name: '生成二维码', value: 'qrCode' })
  }
  if (hasAccessByCodes(['mp:account:clear-quota'])) {
    actions.push({ name: '清空 API 配额', value: 'clearQuota' })
  }
  return actions
})

/** 格式化敏感配置，详情页不直接展示凭据 */
function formatSecret(value?: string) {
  return value ? '******' : '-'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/account/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAccount(Number(props.id))
}

/** 编辑账号 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mp/account/form/index?id=${props.id}` })
}

/** 删除账号 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该公众号账号吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAccount(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mp:account:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (item.value === 'qrCode') {
    handleGenerateQrCode()
  } else if (item.value === 'clearQuota') {
    handleClearQuota()
  }
}

/** 生成二维码 */
async function handleGenerateQrCode() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定生成「${formData.value?.name || ''}」的二维码吗？`,
    })
  } catch {
    return
  }
  await generateAccountQrCode(Number(props.id))
  toast.success('生成成功')
  getDetail()
}

/** 清空 API 配额 */
async function handleClearQuota() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定清空「${formData.value?.name || ''}」的 API 配额吗？`,
    })
  } catch {
    return
  }
  await clearAccountQuota(Number(props.id))
  toast.success('清空成功')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
