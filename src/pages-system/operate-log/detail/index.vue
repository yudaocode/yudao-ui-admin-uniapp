<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="操作日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="日志编号" :value="String(formData?.id ?? '-')" />
        <wd-cell v-if="formData?.traceId" title="链路追踪" :value="formData.traceId" />
        <wd-cell title="操作人编号" :value="String(formData?.userId ?? '-')" />
        <wd-cell title="操作人类型">
          <dict-tag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
        </wd-cell>
        <wd-cell title="操作人名字" :value="formData?.userName || '-'" />
        <wd-cell title="操作人 IP" :value="formData?.userIp || '-'" />
        <wd-cell title="操作人 UA" :value="formData?.userAgent || '-'" />
        <wd-cell title="操作模块" :value="formData?.type || '-'" />
        <wd-cell title="操作名" :value="formData?.subType || '-'" />
        <wd-cell title="操作内容" :value="formData?.action || '-'" />
        <wd-cell v-if="formData?.extra" title="操作拓展参数" :value="formData.extra" />
        <wd-cell title="请求 URL" :value="getRequestUrl()" />
        <wd-cell title="操作时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="业务编号" :value="String(formData?.bizId ?? '-')" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OperateLog } from '@/api/system/operate-log'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getOperateLog } from '@/api/system/operate-log'
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
const formData = ref<OperateLog>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/operate-log/index')
}

/** 获取请求 URL */
// TODO @AI：放在界面里，这里不要这么搞；
function getRequestUrl() {
  if (formData.value?.requestMethod && formData.value?.requestUrl) {
    return `${formData.value.requestMethod} ${formData.value.requestUrl}`
  }
  return '-'
}

/** 加载操作日志详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getOperateLog(props.id)
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
