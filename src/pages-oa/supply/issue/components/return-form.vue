<template>
  <!-- 归还弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="p-24rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">归还 - {{ item?.itemName || '' }}</text>
        <wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="mb-16rpx text-26rpx text-[#999]">
        实发数量：{{ item?.issuedQuantity ?? 0 }}{{ item?.unit || '' }} · 已归还：{{ item?.returnedQuantity ?? 0 }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="本次归还" title-width="180rpx" prop="quantity">
            <wd-input-number
              v-model="formData.quantity"
              :min="1"
              :max="maxReturnQuantity"
              :precision="0"
              placeholder="请输入归还数量"
            />
          </wd-form-item>
          <wd-form-item title="归还备注" title-width="180rpx" prop="returnRemark">
            <wd-textarea
              v-model="formData.returnRemark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入归还备注"
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
        确认归还
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SupplyIssue } from '@/api/oa/supply/issue'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { returnSupplyItem } from '@/api/oa/supply/issue'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const item = ref<SupplyIssue>() // 当前归还明细
const formData = ref({ quantity: undefined as number | undefined, returnRemark: '' }) // 表单数据
const maxReturnQuantity = computed(() => (item.value?.issuedQuantity ?? 0) - (item.value?.returnedQuantity ?? 0)) // 最多可归还数量
const formSchema = createFormSchema({
  quantity: [{ required: true, message: '归还数量不能为空' }],
  returnRemark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 打开弹窗，默认归还剩余数量 */
function open(row: SupplyIssue) {
  item.value = row
  formData.value = { quantity: (row.issuedQuantity ?? 0) - (row.returnedQuantity ?? 0), returnRemark: '' }
  visible.value = true
}
defineExpose({ open })

/** 提交归还 */
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
    await returnSupplyItem({
      id: item.value.id,
      quantity: Number(formData.value.quantity),
      returnRemark: formData.value.returnRemark || undefined,
    })
    toast.success('归还成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
