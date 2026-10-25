<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="新增分销用户"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="用户编号" title-width="200rpx" prop="userId">
            <wd-input v-model="formData.userId" type="number" clearable placeholder="请输入会员用户编号" />
          </wd-form-item>
          <wd-form-item title="推广员编号" title-width="200rpx" prop="bindUserId">
            <wd-input v-model="formData.bindUserId" type="number" clearable placeholder="请输入推广员编号" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { createTradeBrokerageUser } from '@/api/mall/trade/brokerage/user'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const formData = ref<{ userId?: number | string, bindUserId?: number | string }>({
  userId: undefined,
  bindUserId: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  userId: [{ required: true, message: '用户编号不能为空' }],
  bindUserId: [{ required: true, message: '推广员编号不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/brokerage/user/index')
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await createTradeBrokerageUser({
      userId: parseId(formData.value.userId) as number,
      bindUserId: parseId(formData.value.bindUserId) as number,
    })
    toast.success('新增成功')
    uni.$emit('mall:brokerage-user:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}
</script>
