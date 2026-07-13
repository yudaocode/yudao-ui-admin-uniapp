<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="封禁群组"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="群名称" :value="groupName || '-'" />
          <wd-form-item title="封禁原因" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              placeholder="请输入封禁原因"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        确认封禁
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { banManagerGroup } from '@/api/im/manager/group'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
  name?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const groupName = ref(props.name ? decodeURIComponent(props.name) : '') // 群名称
const formData = ref({
  reason: '',
}) // 表单数据
const formSchema = createFormSchema({
  reason: [{ required: true, message: '封禁原因不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 提交表单 */
async function handleSubmit() {
  if (!props.id) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await banManagerGroup({ id: Number(props.id), reason: formData.value.reason })
    toast.success('封禁成功')
    uni.$emit('im:manager:group:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}
</script>
