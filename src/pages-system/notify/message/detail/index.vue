<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="站内信详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="用户类型">
          <dict-tag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
        </wd-cell>
        <wd-cell title="用户编号" :value="String(formData?.userId ?? '-')" />
        <wd-cell title="模版编号" :value="String(formData?.templateId ?? '-')" />
        <wd-cell title="模板编码" :value="String(formData?.templateCode ?? '-')" />
        <wd-cell title="发送人名称" :value="String(formData?.templateNickname ?? '-')" />
        <wd-cell title="模版内容" :value="String(formData?.templateContent ?? '-')" />
        <wd-cell title="模版参数" :value="formatTemplateParams(formData?.templateParams)" />
        <wd-cell title="模版类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="formData?.templateType" />
        </wd-cell>
        <wd-cell title="是否已读">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.readStatus" />
        </wd-cell>
        <wd-cell title="阅读时间" :value="formatDateTime(formData?.readTime) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { NotifyMessage } from '@/api/system/notify/message'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getNotifyMessage } from '@/api/system/notify/message'
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
const formData = ref<NotifyMessage>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/notify/index')
}

/** 格式化模版参数 */
function formatTemplateParams(params: any) {
  if (!params) {
    return '-'
  }
  try {
    return typeof params === 'string' ? params : JSON.stringify(params)
  } catch {
    return '-'
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getNotifyMessage(Number(props.id))
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
