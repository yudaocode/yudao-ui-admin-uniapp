<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="应用详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="客户端编号" :value="String(formData?.clientId ?? '-')" />
        <wd-cell title="客户端密钥" :value="String(formData?.secret ?? '-')" />
        <wd-cell title="应用名" :value="String(formData?.name ?? '-')" />
        <wd-cell title="应用描述" :value="String(formData?.description ?? '-')" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="访问令牌有效期" :value="`${formData?.accessTokenValiditySeconds ?? '-'} 秒`" />
        <wd-cell title="刷新令牌有效期" :value="`${formData?.refreshTokenValiditySeconds ?? '-'} 秒`" />
        <wd-cell title="授权类型" :value="formData?.authorizedGrantTypes?.join(', ') || '-'" />
        <wd-cell title="授权范围" :value="formData?.scopes?.join(', ') || '-'" />
        <wd-cell title="可重定向 URI" :value="formData?.redirectUris?.join(', ') || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:oauth2-client:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:oauth2-client:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OAuth2Client } from '@/api/system/oauth2/client'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteOAuth2Client, getOAuth2Client } from '@/api/system/oauth2/client'
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
const formData = ref<OAuth2Client>()
const deleting = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/oauth2/index')
}

/** 加载应用详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getOAuth2Client(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑应用 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/oauth2/client/form/index?id=${props.id}`,
  })
}

/** 删除应用 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该应用吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteOAuth2Client(props.id)
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

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
