<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="visible = false">
    <scroll-view scroll-y class="max-h-80vh px-32rpx pb-32rpx pt-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ title }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-form-picker
            v-model="formData.education"
            label="学历"
            label-width="200rpx"
            prop="education"
            :dict-type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            placeholder="请选择学历"
          />
          <wd-form-item title="毕业院校" title-width="200rpx" prop="graduateSchool">
            <wd-input v-model="formData.graduateSchool" clearable placeholder="请输入毕业院校" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="专业" title-width="200rpx" prop="major">
            <wd-input v-model="formData.major" clearable placeholder="请输入专业" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="入学日期" title-width="200rpx" prop="admissionTime" center>
            <view class="w-full" @click="admissionVisible = true">
              <wd-input
                :model-value="formatDate(admissionPicker) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="admissionPicker"
            v-model:visible="admissionVisible"
            type="date"
            title="入学日期"
          />
          <wd-form-item title="毕业日期" title-width="200rpx" prop="graduationTime" center>
            <view class="w-full" @click="graduationVisible = true">
              <wd-input
                :model-value="formatDate(graduationPicker) || ''"
                readonly
                align-right
                placeholder="请选择"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="graduationPicker"
            v-model:visible="graduationVisible"
            type="date"
            title="毕业日期"
          />
          <yd-form-picker
            v-model="formData.teachingMethods"
            label="教学方式"
            label-width="200rpx"
            prop="teachingMethods"
            :columns="teachingMethodColumns"
            placeholder="请选择教学方式"
          />
          <wd-form-item title="第一学历" title-width="200rpx" prop="firstDegree" center>
            <wd-switch v-model="formData.firstDegree" />
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
    </scroll-view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { EmployeeEducationExperience } from '@/api/hrm/employee/education-experience'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import {
  createEmployeeEducationExperience,
  updateEmployeeEducationExperience,
} from '@/api/hrm/employee/education-experience'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { HrmEmployeeTeachingMethodOptions } from '@/pages-hrm/utils/constants'

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false)
const formLoading = ref(false)
const admissionVisible = ref(false)
const graduationVisible = ref(false)
const admissionPicker = ref<number | string>('') // 入学日期本地值
const graduationPicker = ref<number | string>('') // 毕业日期本地值
const formRef = ref<FormInstance>()
const formData = ref<EmployeeEducationExperience>({
  sort: 1,
  firstDegree: false,
})
const teachingMethodColumns = [...HrmEmployeeTeachingMethodOptions]
const formSchema = createFormSchema({
  education: [{ required: true, message: '学历不能为空' }],
  graduateSchool: [{ required: true, message: '毕业院校不能为空' }],
  major: [{ required: true, message: '专业不能为空' }],
  firstDegree: [{ required: true, message: '是否第一学历不能为空' }],
})
const title = computed(() => formData.value.id ? '修改教育经历' : '新增教育经历')

/** 打开弹窗 */
function open(employeeId: number, row?: EmployeeEducationExperience) {
  visible.value = true
  formData.value = {
    sort: 1,
    firstDegree: false,
    employeeId,
    ...row,
  }
  admissionPicker.value = toTimestamp(row?.admissionTime) || ''
  graduationPicker.value = toTimestamp(row?.graduationTime) || ''
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.admissionTime = admissionPicker.value || undefined
  formData.value.graduationTime = graduationPicker.value || undefined
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  const { admissionTime, graduationTime } = formData.value
  if (
    admissionTime != null
    && graduationTime != null
    && Number(graduationTime) < Number(admissionTime)
  ) {
    toast.warning('毕业日期不能早于入学日期')
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateEmployeeEducationExperience(formData.value)
    } else {
      await createEmployeeEducationExperience(formData.value)
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
