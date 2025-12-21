<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="登录日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="日志编号" :value="formData?.id" />
        <wd-cell title="登录类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_LOGIN_TYPE" :value="formData?.logType" />
        </wd-cell>
        <wd-cell title="用户名称" :value="formData?.username || '-'" />
        <wd-cell title="登录地址" :value="formData?.userIp || '-'" />
        <wd-cell title="浏览器" :value="formData?.userAgent || '-'" />
        <wd-cell title="登录结果">
          <dict-tag :type="DICT_TYPE.SYSTEM_LOGIN_RESULT" :value="formData?.result" />
        </wd-cell>
        <wd-cell title="登录时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { LoginLog } from '@/api/system/login-log'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'

import { getLoginLog } from '@/api/system/login-log'
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
const formData = ref<LoginLog>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/login-log/index')
}

/** 加载登录日志详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getLoginLog(props.id)
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
