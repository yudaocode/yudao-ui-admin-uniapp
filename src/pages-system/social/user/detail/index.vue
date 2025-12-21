<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="三方用户详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="三方平台">
          <dict-tag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="用户昵称" :value="formData?.nickname ?? '-'" />
        <wd-cell v-if="formData?.avatar" title="用户头像">
          <wd-img :src="formData.avatar" width="120rpx" height="120rpx" />
        </wd-cell>
        <wd-cell title="社交 openid" is-link @click="handleCopyText(formData?.openid, '社交 openid')">
          <view class="max-w-400rpx truncate text-right">
            {{ formData?.openid }}
          </view>
        </wd-cell>
        <wd-cell title="社交 token" is-link @click="handleCopyText(formData?.token, '社交 token')">
          <view class="max-w-400rpx truncate text-right">
            {{ formData?.token }}
          </view>
        </wd-cell>
        <wd-cell title="原始 Token 数据" is-link @click="handleCopyText(formData?.rawTokenInfo, '原始 Token 数据')">
          <view class="max-w-400rpx truncate text-right">
            {{ formData?.rawTokenInfo }}
          </view>
        </wd-cell>
        <wd-cell title="原始 User 数据" is-link @click="handleCopyText(formData?.rawUserInfo, '原始 User 数据')">
          <view class="max-w-400rpx truncate text-right">
            {{ formData?.rawUserInfo }}
          </view>
        </wd-cell>
        <wd-cell title="最后一次的认证 code" :value="formData?.code ?? '-'" />
        <wd-cell title="最后一次的认证 state" :value="formData?.state ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
        <wd-cell title="更新时间" :value="formatDateTime(formData?.updateTime)" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SocialUser } from '@/api/system/social/user'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSocialUser } from '@/api/system/social/user'
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

const toast = useToast()
const formData = ref<SocialUser>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/social/index')
}

/** 复制文本并提示 */
function handleCopyText(text?: string, title?: string) {
  if (!text || text === '-') {
    return
  }
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.hideToast()
      toast.success(`${title || '内容'}已复制`)
    },
  })
}

/** 加载三方用户详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSocialUser(props.id)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
