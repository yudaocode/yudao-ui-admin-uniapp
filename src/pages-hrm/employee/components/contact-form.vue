<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <view class="px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="联系人" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入联系人" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="关系" title-width="200rpx" prop="relation">
            <wd-input v-model="formData.relation" clearable placeholder="请输入关系" :maxlength="64" />
          </wd-form-item>
          <wd-form-item title="电话" title-width="200rpx" prop="phone">
            <wd-input v-model="formData.phone" clearable placeholder="请输入电话" :maxlength="40" />
          </wd-form-item>
          <wd-form-item title="工作单位" title-width="200rpx" prop="workUnit">
            <wd-input v-model="formData.workUnit" clearable placeholder="请输入工作单位" :maxlength="128" />
          </wd-form-item>
          <wd-form-item title="职务" title-width="200rpx" prop="postName">
            <wd-input v-model="formData.postName" clearable placeholder="请输入职务" :maxlength="128" />
          </wd-form-item>
          <wd-form-item title="地址" title-width="200rpx" prop="address">
            <wd-input v-model="formData.address" clearable placeholder="请输入地址" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="200rpx" prop="sort">
            <wd-input-number v-model="formData.sort" allow-null :min="0" :precision="0" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { EmployeeContact } from '@/api/hrm/employee/contact'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createEmployeeContact,
  updateEmployeeContact,
} from '@/api/hrm/employee/contact'
import { createFormSchema } from '@/utils/wot'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗
const formLoading = ref(false) // 提交中
const formRef = ref<FormInstance>() // 表单
const formData = ref<EmployeeContact>({ sort: 1 }) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '联系人不能为空' }],
})
const title = computed(() => formData.value.id ? '修改联系人' : '新增联系人')

/** 打开弹窗 */
function open(employeeId: number, row?: EmployeeContact) {
  visible.value = true
  formData.value = {
    sort: 1,
    employeeId,
    ...row,
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateEmployeeContact(formData.value)
    } else {
      await createEmployeeContact(formData.value)
    }
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

defineExpose({ open })
</script>
