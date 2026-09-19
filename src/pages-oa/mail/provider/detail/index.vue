<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="邮箱服务配置详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 服务配置详情 -->
    <view v-if="formData">
      <wd-cell-group title="基本信息" border>
        <wd-cell title="名称" :value="formData.name" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        </wd-cell>
      </wd-cell-group>
      <wd-cell-group title="收信配置（IMAP）" border>
        <wd-cell title="服务器" :value="formData.imap.host" />
        <wd-cell title="端口" :value="formData.imap.port" />
        <wd-cell title="SSL" :value="formData.imap.sslEnable ? '开启' : '关闭'" />
        <wd-cell title="STARTTLS" :value="formData.imap.starttlsEnable ? '开启' : '关闭'" />
      </wd-cell-group>
      <wd-cell-group title="发信配置（SMTP）" border>
        <wd-cell title="服务器" :value="formData.smtp.host" />
        <wd-cell title="端口" :value="formData.smtp.port" />
        <wd-cell title="SSL" :value="formData.smtp.sslEnable ? '开启' : '关闭'" />
        <wd-cell title="STARTTLS" :value="formData.smtp.starttlsEnable ? '开启' : '关闭'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作 -->
    <view v-if="formData" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:mail-provider:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:mail-provider:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MailProvider } from '@/api/oa/mail'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteMailProvider, getMailProvider } from '@/api/oa/mail'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

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
const formData = ref<MailProvider>() // 服务配置详情
const deleting = ref(false) // 删除状态

/** 返回服务配置列表 */
function handleBack() {
  navigateBackPlus('/pages-oa/mail/provider/index')
}

/** 加载服务配置详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getMailProvider(Number(props.id))
}

/** 编辑服务配置 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-oa/mail/provider/form/index?id=${props.id}` })
}

/** 删除服务配置 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除服务配置「${formData.value?.name}」？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMailProvider(Number(props.id))
    toast.success('删除成功')
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
