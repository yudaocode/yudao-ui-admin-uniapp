<template>
  <view class="yd-page-container">
    <wd-navbar
      title="邮箱账号详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="邮箱" :value="String(formData?.mail ?? '-')" />
        <wd-cell title="用户名" :value="String(formData?.username ?? '-')" />
        <wd-cell title="SMTP 服务器域名" :value="String(formData?.host ?? '-')" />
        <wd-cell title="SMTP 服务器端口" :value="String(formData?.port ?? '-')" />
        <wd-cell title="是否开启 SSL">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.sslEnable" />
        </wd-cell>
        <wd-cell title="是否开启 STARTTLS">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.starttlsEnable" />
        </wd-cell>
        <wd-cell title="备注" :value="String(formData?.remark ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <view class="safe-area-inset-bottom fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:mail-account:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:mail-account:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MailAccount } from '@/api/system/mail/account/index'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteMailAccount, getMailAccount } from '@/api/system/mail/account/index'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<MailAccount>()
const deleting = ref(false)

function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMailAccount(props.id)
  } finally {
    toast.close()
  }
}

function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/mail/account/form/index?id=${props.id}`,
  })
}

function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该邮箱账号吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteMailAccount(props.id)
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
