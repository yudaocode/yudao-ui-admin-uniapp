<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="添加好友"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <UserFormPicker
            v-model="formData.toUserId"
            label="目标用户"
            prop="toUserId"
            placeholder="请选择用户"
          />
          <wd-form-item title="好友备注" title-width="180rpx" prop="displayName">
            <wd-input
              v-model="formData.displayName"
              clearable
              placeholder="请输入好友备注"
              :maxlength="16"
            />
          </wd-form-item>
          <wd-form-item title="申请理由" title-width="180rpx" prop="applyContent">
            <wd-textarea
              v-model="formData.applyContent"
              clearable
              placeholder="请输入申请理由"
              :maxlength="255"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        发送申请
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { UserFormPicker } from '@/components/system-select'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { ImFriendAddSource } from '@/pages-im/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import { useFriendStore } from '../../../store/friendStore'

const props = defineProps<{
  toUserId?: number | string
  source?: number | string
  sourceExtra?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const friendStore = useFriendStore()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formData = ref({
  toUserId: props.toUserId ? Number(props.toUserId) : undefined as number | undefined,
  displayName: '',
  applyContent: props.sourceExtra && userStore.userInfo.nickname
    ? `我是"${decodeURIComponent(props.sourceExtra)}"的${userStore.userInfo.nickname}`
    : userStore.userInfo.nickname ? `我是${userStore.userInfo.nickname}` : '',
}) // 表单数据
const formSchema = createFormSchema({
  toUserId: [{ required: true, message: '目标用户不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid || !formData.value.toUserId) {
    return
  }
  if (formData.value.toUserId === userStore.userInfo.userId) {
    toast.warning('不能添加自己为好友')
    return
  }
  const expectedUserId = userStore.userInfo.userId
  formLoading.value = true
  try {
    const requestId = await friendStore.applyFriendRequest({
      toUserId: formData.value.toUserId,
      displayName: formData.value.displayName.trim() || undefined,
      applyContent: formData.value.applyContent.trim() || undefined,
      addSource: props.source ? Number(props.source) : ImFriendAddSource.SEARCH,
    })
    if (userStore.userInfo.userId !== expectedUserId) {
      return
    }
    if (requestId === null) {
      await friendStore.fetchFriendInfo(formData.value.toUserId)
    }
    toast.success(requestId ? '申请已发送，等待对方验证' : '已添加为好友')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 IM 运行时 */
onMounted(() => {
  void useImRuntimeStore().ensure()
})
</script>
