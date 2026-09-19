<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="p-24rpx">
      <view class="mb-24rpx flex items-center justify-between">
        <text class="text-32rpx text-[#333] font-semibold">入库 - {{ itemName }}</text>
        <wd-icon name="close" size="32rpx" color="#999" @click="visible = false" />
      </view>
      <view class="mb-16rpx text-26rpx text-[#999]">
        当前库存：{{ stockQuantity ?? 0 }}{{ unit }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="入库数量" title-width="180rpx" prop="quantity">
            <wd-input-number v-model="formData.quantity" :min="1" :precision="0" placeholder="请输入入库数量" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-button class="mt-24rpx" type="primary" block :loading="loading" @click="submit">
        确认入库
      </wd-button>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { stockInSupplyItem } from '@/api/oa/supply/item'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id: number, itemName?: string, stockQuantity?: number, unit?: string }>()
const emit = defineEmits<{ success: [] }>()
const visible = defineModel<boolean>({ default: false })
const toast = useToast()
const loading = ref(false)
const formRef = ref<FormInstance>()
const formData = ref({ quantity: undefined as number | undefined })
const formSchema = createFormSchema({ quantity: [{ required: true, message: '入库数量不能为空' }] })

/** 打开入库表单时清空数量 */
function reset() {
  formData.value = { quantity: undefined }
}

/** 提交入库 */
async function submit() {
  const { valid } = await formRef.value!.validate()
  if (!valid || formData.value.quantity == null)
    return
  loading.value = true
  try {
    await stockInSupplyItem({ id: props.id, quantity: Number(formData.value.quantity) })
    toast.success('入库成功')
    visible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ reset })
</script>
