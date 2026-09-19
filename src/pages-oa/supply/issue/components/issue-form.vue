<template>
  <!-- 发放弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="p-24rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">发放 - {{ item?.itemName || '' }}</text>
        <wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="mb-16rpx text-26rpx text-[#999]">
        申请数量：{{ item?.applyQuantity ?? 0 }}{{ item?.unit || '' }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="实发数量" title-width="180rpx" prop="issuedQuantity">
            <wd-input-number
              v-model="formData.issuedQuantity"
              :min="1"
              :precision="0"
              placeholder="请输入实发数量"
            />
          </wd-form-item>
          <wd-form-item title="发放备注" title-width="180rpx" prop="issueRemark">
            <wd-textarea
              v-model="formData.issueRemark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入发放备注"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-button
        class="mt-24rpx"
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        确认发放
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SupplyIssue } from '@/api/oa/supply-issue'
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { issueSupplyItem } from '@/api/oa/supply-issue'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const item = ref<SupplyIssue>() // 当前发放明细
const formData = ref({ issuedQuantity: undefined as number | undefined, issueRemark: '' }) // 表单数据
const formSchema = createFormSchema({ // 表单校验规则
  issuedQuantity: [{ required: true, message: '实发数量不能为空' }],
  issueRemark: [{ max: 500 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 打开弹窗，默认按申请数量发放 */
function open(row: SupplyIssue) {
  item.value = row
  formData.value = { issuedQuantity: row.applyQuantity, issueRemark: '' }
  visible.value = true
}
defineExpose({ open })

/** 提交发放 */
async function handleSubmit() {
  if (!item.value?.id) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await issueSupplyItem({
      id: item.value.id,
      issuedQuantity: Number(formData.value.issuedQuantity),
      issueRemark: formData.value.issueRemark || undefined,
    })
    toast.success('发放成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
