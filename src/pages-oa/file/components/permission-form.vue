<template>
  <wd-popup v-model="visible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="bg-white p-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ formData.id ? '修改共享' : '新增共享' }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker v-model="formData.subjectType" label="共享类型" label-width="180rpx" prop="subjectType" :dict-type="DICT_TYPE.OA_FILE_SUBJECT_TYPE" placeholder="请选择共享类型" :disabled="!!formData.id" @confirm="formData.subjectId = undefined" />
          <UserFormPicker v-if="formData.subjectType === OA_FILE_SUBJECT_TYPE.USER" v-model="formData.subjectId" label="共享对象" label-width="180rpx" prop="subjectId" :disabled="!!formData.id" />
          <DeptFormPicker v-else v-model="formData.subjectId" label="共享对象" label-width="180rpx" prop="subjectId" :disabled="!!formData.id" />
          <yd-form-picker v-model="formData.level" label="权限" label-width="180rpx" prop="level" :dict-type="DICT_TYPE.OA_FILE_PERMISSION_LEVEL" placeholder="请选择权限" />
          <wd-form-item title="继承权限" title-width="180rpx" prop="inherit" center>
            <wd-switch v-model="formData.inherit" />
          </wd-form-item>
          <wd-form-item title="到期时间" title-width="180rpx" prop="expireTime">
            <view class="flex items-center justify-end gap-12rpx" @click="expireTimeVisible = true">
              <text class="text-28rpx" :class="expireTime === '' ? 'text-[#999]' : 'text-[#333]'">{{ expireTime === '' ? '不填则长期有效' : formatDateTime(expireTime) }}</text><text v-if="expireTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="expireTime = ''">清除</text>
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-24rpx flex gap-16rpx">
        <wd-button class="flex-1" variant="plain" :disabled="loading" @click="visible = false">
          取消
        </wd-button><wd-button class="flex-1" type="primary" :loading="loading" @click="emit('submit')">
          确定
        </wd-button>
      </view>
    </view>
    <wd-datetime-picker v-model="expireTime" v-model:visible="expireTimeVisible" type="datetime" title="到期时间" />
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { FilePermission } from '@/api/oa/file'
import { ref } from 'vue'
import { DeptFormPicker, UserFormPicker } from '@/components/system-select'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { OA_FILE_SUBJECT_TYPE } from '../../utils/constants'

defineProps<{ formSchema: Record<string, any>, loading: boolean }>()
const emit = defineEmits<{ submit: [] }>()
const visible = defineModel<boolean>({ default: false })
const formData = defineModel<Partial<FilePermission>>('formData', { default: () => ({}) })
const expireTime = defineModel<number | ''>('expireTime', { default: '' })
const expireTimeVisible = ref(false) // 到期时间选择器显示状态
const formRef = ref<FormInstance>() // 表单引用

/** 校验共享表单 */
async function validate() {
  return formRef.value?.validate()
}

defineExpose({ validate })
</script>
