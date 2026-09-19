<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="邮箱账号详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 账号信息 -->
    <wd-cell-group v-if="formData" border>
      <wd-cell title="邮箱地址" :value="formData.mail" />
      <wd-cell title="邮箱服务" :value="providerName || '-'" />
      <wd-cell title="登录名" :value="formData.username" />
      <wd-cell title="默认发件账号" :value="formData.defaultStatus ? '是' : '否'" />
      <wd-cell title="状态">
        <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
      </wd-cell>
    </wd-cell-group>

    <!-- 底部操作 -->
    <view v-if="formData" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:mail-account:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:mail-account:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          移除绑定
        </wd-button>
        <wd-button
          v-if="moreActions.length"
          class="flex-1" type="info" :loading="operating" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
  </view>
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/oa/mail'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteMailAccount, getMailAccount, getSimpleMailProviderList, testMailAccountConnection, updateMailAccountDefault } from '@/api/oa/mail'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  id?: string
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
const formData = ref<MailAccount>() // 账号详情
const providerName = ref('') // 邮箱服务名称
const deleting = ref(false) // 移除绑定状态
const operating = ref(false) // 更多操作执行状态
const moreActionVisible = ref(false) // 更多操作菜单
const moreActions = computed(() => { // 启用账号可设为默认、测试连接
  const actions: Array<{ name: string, value: string }> = []
  if (formData.value?.status === CommonStatusEnum.ENABLE) {
    if (!formData.value.defaultStatus && hasAccessByCodes(['oa:mail-account:update'])) {
      actions.push({ name: '设为默认', value: 'default' })
    }
    actions.push({ name: '测试连接', value: 'test' })
  }
  return actions
})

/** 返回账号列表 */
function handleBack() {
  navigateBackPlus('/pages-oa/mail/account/index')
}

/** 加载账号详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getMailAccount(Number(props.id))
  const providers = await getSimpleMailProviderList()
  providerName.value = providers.find(item => item.id === formData.value?.providerId)?.name || ''
}

/** 编辑账号 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-oa/mail/account/form/index?id=${props.id}` })
}

/** 执行账号操作，测试连接不发送邮件 */
async function handleMoreAction({ item }: { item: { value: string } }) {
  if (!props.id || operating.value) {
    return
  }
  operating.value = true
  try {
    if (item.value === 'default') {
      await updateMailAccountDefault(Number(props.id))
      toast.success('设置成功')
      await getDetail()
    } else if (item.value === 'test') {
      const result = await testMailAccountConnection(Number(props.id))
      if (result.imap && result.smtp) {
        toast.success('连接成功')
      } else if (result.imap || result.smtp) {
        toast.warning(`部分连接失败：${result.imap ? '' : '收件(IMAP) '}${result.smtp ? '' : '发件(SMTP)'}`)
      } else {
        toast.error('收件与发件连接均失败')
      }
    }
  } finally {
    operating.value = false
  }
}

/** 移除账号绑定 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认移除邮箱账号「${formData.value?.mail}」的绑定？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMailAccount(Number(props.id))
    toast.success('移除成功')
    handleBack()
  } finally {
    deleting.value = false
  }
}

/** 初始化与编辑返回刷新 */
onShow(() => {
  getDetail()
})
</script>
