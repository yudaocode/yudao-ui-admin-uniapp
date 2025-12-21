<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="站内信模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="模板编号" :value="formData?.id" />
        <wd-cell title="模板名称" :value="formData?.name" />
        <wd-cell title="模板编码" :value="formData?.code" />
        <wd-cell title="发送人名称" :value="formData?.nickname" />
        <wd-cell title="模板类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="模板内容" :value="formData?.content" />
        <wd-cell title="备注" :value="formData?.remark ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 发送测试站内信弹窗 -->
    <SendForm v-model="sendVisible" :template="formData" />

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:notify-template:send-notify'])"
          class="flex-1" type="primary" @click="handleSendTest"
        >
          测试
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:notify-template:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:notify-template:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { NotifyTemplate } from '@/api/system/notify/template'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteNotifyTemplate, getNotifyTemplate } from '@/api/system/notify/template'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SendForm from './components/send-form.vue'

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
const formData = ref<NotifyTemplate>()
const deleting = ref(false)

// 发送测试站内信相关
const sendVisible = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/notify/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getNotifyTemplate(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/notify/template/form/index?id=${props.id}`,
  })
}

/** 删除 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该站内信模板吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteNotifyTemplate(props.id)
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

/** 打开发送测试站内信弹窗 */
function handleSendTest() {
  sendVisible.value = true
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
