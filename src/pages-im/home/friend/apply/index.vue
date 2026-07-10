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
            />
          </wd-form-item>
          <wd-form-item title="申请理由" title-width="180rpx" prop="applyContent">
            <wd-textarea
              v-model="formData.applyContent"
              clearable
              placeholder="请输入申请理由"
              :maxlength="200"
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
import { ref } from 'vue'
import { applyFriendRequest } from '@/api/im/friend/request'
import { UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { ImFriendAddSource } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formData = ref({
  toUserId: undefined as number | undefined,
  displayName: '',
  applyContent: '你好，我想添加你为好友',
}) // 表单数据
const formSchema = createFormSchema({
  toUserId: [{ required: true, message: '目标用户不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index?tab=friend')
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid || !formData.value.toUserId) {
    return
  }
  formLoading.value = true
  try {
    await applyFriendRequest({
      toUserId: formData.value.toUserId,
      displayName: formData.value.displayName,
      applyContent: formData.value.applyContent,
      addSource: ImFriendAddSource.SEARCH,
    })
    toast.success('申请已发送')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}
</script>
