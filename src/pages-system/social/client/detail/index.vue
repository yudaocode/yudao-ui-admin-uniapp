<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="三方应用详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id" />
        <wd-cell title="应用名" :value="formData?.name" />
        <wd-cell title="社交平台">
          <dict-tag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="formData?.socialType" />
        </wd-cell>
        <wd-cell title="用户类型">
          <dict-tag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
        </wd-cell>
        <wd-cell title="应用编号" :value="formData?.clientId" />
        <wd-cell title="应用密钥" :value="formData?.clientSecret" />
        <wd-cell title="agentId" :value="formData?.agentId ?? '-'" />
        <wd-cell title="publicKey" :value="formData?.publicKey ?? '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['system:social-client:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:social-client:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SocialClient } from '@/api/system/social/client'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteSocialClient, getSocialClient } from '@/api/system/social/client'
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
const formData = ref<SocialClient>()
const deleting = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/social/index')
}

/** 加载三方应用详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSocialClient(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑三方应用 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/social/client/form/index?id=${props.id}`,
  })
}

/** 删除三方应用 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该三方应用吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteSocialClient(props.id)
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
