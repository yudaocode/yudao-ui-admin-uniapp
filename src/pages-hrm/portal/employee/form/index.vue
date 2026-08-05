<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑我的档案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item v-if="isEditable('name')" title="姓名" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入姓名" :maxlength="255" />
          </wd-form-item>
          <wd-form-item v-if="isEditable('mobile')" title="手机号" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" clearable placeholder="请输入手机号" :maxlength="11" />
          </wd-form-item>
          <wd-form-item v-if="isEditable('email')" title="邮箱" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" clearable placeholder="请输入邮箱" :maxlength="255" />
          </wd-form-item>
          <wd-form-item v-if="isEditable('country')" title="国家或地区" title-width="200rpx" prop="country">
            <wd-input v-model="formData.country" clearable placeholder="请输入国家或地区" :maxlength="64" />
          </wd-form-item>
          <wd-form-item v-if="isEditable('nation')" title="民族" title-width="200rpx" prop="nation">
            <wd-input v-model="formData.nation" clearable placeholder="请输入民族" :maxlength="64" />
          </wd-form-item>
          <yd-form-picker
            v-if="isEditable('idType')"
            v-model="formData.idType"
            label="证件类型"
            label-width="200rpx"
            prop="idType"
            :columns="idTypeColumns"
            placeholder="请选择证件类型"
          />
          <wd-form-item v-if="isEditable('idNumber')" title="证件号码" title-width="200rpx" prop="idNumber">
            <wd-input v-model="formData.idNumber" clearable placeholder="请输入证件号码" :maxlength="255" />
          </wd-form-item>
          <yd-form-picker
            v-if="isEditable('sex')"
            v-model="formData.sex"
            label="性别"
            label-width="200rpx"
            prop="sex"
            :dict-type="DICT_TYPE.SYSTEM_USER_SEX"
            placeholder="请选择性别"
          />
          <wd-form-item v-if="isEditable('nativePlace')" title="籍贯" title-width="200rpx" prop="nativePlace">
            <wd-input v-model="formData.nativePlace" clearable placeholder="请输入籍贯" :maxlength="128" />
          </wd-form-item>
          <wd-form-item
            v-if="isEditable('birthday')"
            title="出生时间"
            title-width="200rpx"
            prop="birthday"
            center
          >
            <view class="w-full" @click="birthdayVisible = true">
              <wd-input
                :model-value="formatDateTime(birthdayPicker) || ''"
                readonly
                align-right
                placeholder="请选择出生时间"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="birthdayPicker"
            v-model:visible="birthdayVisible"
            type="datetime"
            title="出生时间"
          />
          <yd-form-picker
            v-if="isEditable('highestEducation')"
            v-model="formData.highestEducation"
            label="最高学历"
            label-width="200rpx"
            prop="highestEducation"
            :dict-type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            placeholder="请选择最高学历"
          />
          <wd-form-item v-if="isEditable('address')" title="户籍地址" title-width="200rpx" prop="address">
            <wd-input v-model="formData.address" clearable placeholder="请输入户籍地址" :maxlength="255" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PortalEmployeeUpdateReq } from '@/api/hrm/portal/employee'
import { onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getPortalEmployee, updatePortalEmployee } from '@/api/hrm/portal/employee'
import { getPortalEmployeeFieldConfigList } from '@/api/hrm/portal/employee/field-config'
import { createFormSchema } from '@/utils/wot'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { HrmEmployeeIdTypeOptions } from '@/pages-hrm/utils/constants'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<any>() // 表单引用
const formLoading = ref(false) // 表单提交状态
const birthdayVisible = ref(false) // 出生时间选择
const birthdayPicker = ref<number | string>('') // 出生时间本地值
const editableFields = ref<Set<string>>(new Set()) // 允许编辑的字段
const formData = ref<PortalEmployeeUpdateReq>({}) // 表单数据

const idTypeColumns = HrmEmployeeIdTypeOptions.map(item => ({
  label: item.label,
  value: item.value,
}))

const formSchema = createFormSchema({
  name: [{ required: () => isEditable('name'), message: '姓名不能为空' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机号码' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
})

/** 判断字段是否允许编辑 */
function isEditable(name: string) {
  return editableFields.value.has(name)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载可编辑字段与当前档案 */
async function getDetail() {
  const [employee, fields] = await Promise.all([
    getPortalEmployee(),
    getPortalEmployeeFieldConfigList(),
  ])
  editableFields.value = new Set(
    fields.filter(field => field.editable).map(field => field.name),
  )
  const employeeFormData: PortalEmployeeUpdateReq = {
    name: employee.name || '',
    mobile: employee.mobile,
    country: employee.country,
    nation: employee.nation,
    idType: employee.idType,
    idNumber: employee.idNumber,
    sex: employee.sex,
    email: employee.email,
    nativePlace: employee.nativePlace,
    birthday: employee.birthday ? Number(employee.birthday) : undefined,
    address: employee.address,
    highestEducation: employee.highestEducation,
  }
  formData.value = Object.fromEntries(
    Object.entries(employeeFormData).filter(([name]) => editableFields.value.has(name)),
  )
  birthdayPicker.value = employee.birthday && isEditable('birthday')
    ? Number(employee.birthday)
    : ''
}

/** 提交表单 */
async function handleSubmit() {
  if (isEditable('birthday')) {
    formData.value.birthday = birthdayPicker.value ? Number(birthdayPicker.value) : undefined
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await updatePortalEmployee(formData.value)
    toast.success('保存成功')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!(await checkHrmPortalAccess())) {
    return
  }
  await getDetail()
})
</script>
