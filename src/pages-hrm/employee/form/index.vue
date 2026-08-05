<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="个人信息">
          <wd-form-item v-if="isFieldVisible('name')" title="员工姓名" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入员工姓名" :maxlength="255" />
          </wd-form-item>
          <UserFormPicker
            v-if="isFieldVisible('userId')"
            v-model="formData.userId"
            label="绑定用户"
            label-width="200rpx"
            prop="userId"
            placeholder="请选择后台用户"
          />
          <wd-form-item v-if="formMode === 'candidate' && formData.candidateId" title="候选人编号" title-width="200rpx">
            <wd-input :model-value="String(formData.candidateId)" readonly align-right />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('mobile')" title="手机号" title-width="200rpx" prop="mobile">
            <wd-input v-model="formData.mobile" clearable placeholder="请输入手机号" :maxlength="11" />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('email')" title="邮箱" title-width="200rpx" prop="email">
            <wd-input v-model="formData.email" clearable placeholder="请输入邮箱" :maxlength="255" />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('country')" title="国家或地区" title-width="200rpx" prop="country">
            <wd-input v-model="formData.country" clearable placeholder="请输入国家或地区" :maxlength="64" />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('nation')" title="民族" title-width="200rpx" prop="nation">
            <wd-input v-model="formData.nation" clearable placeholder="请输入民族" :maxlength="64" />
          </wd-form-item>
          <yd-form-picker
            v-if="isFieldVisible('idType')"
            v-model="formData.idType"
            label="证件类型"
            label-width="200rpx"
            prop="idType"
            :columns="idTypeColumns"
            placeholder="请选择证件类型"
          />
          <wd-form-item v-if="isFieldVisible('idNumber')" title="证件号码" title-width="200rpx" prop="idNumber">
            <wd-input v-model="formData.idNumber" clearable placeholder="请输入证件号码" :maxlength="255" />
          </wd-form-item>
          <yd-form-picker
            v-if="isFieldVisible('sex')"
            v-model="formData.sex"
            label="性别"
            label-width="200rpx"
            prop="sex"
            :dict-type="DICT_TYPE.SYSTEM_USER_SEX"
            placeholder="请选择性别"
          />
          <wd-form-item v-if="isFieldVisible('nativePlace')" title="籍贯" title-width="200rpx" prop="nativePlace">
            <wd-input v-model="formData.nativePlace" clearable placeholder="请输入籍贯" :maxlength="128" />
          </wd-form-item>
          <wd-form-item
            v-if="isFieldVisible('birthday')"
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
            v-if="isFieldVisible('highestEducation')"
            v-model="formData.highestEducation"
            label="最高学历"
            label-width="200rpx"
            prop="highestEducation"
            :dict-type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            placeholder="请选择最高学历"
          />
          <wd-form-item v-if="isFieldVisible('address')" title="户籍地址" title-width="200rpx" prop="address">
            <wd-input v-model="formData.address" clearable placeholder="请输入户籍地址" :maxlength="255" />
          </wd-form-item>
        </wd-cell-group>

        <wd-cell-group border title="入职信息">
          <wd-form-item v-if="isFieldVisible('jobNumber')" title="工号" title-width="200rpx" prop="jobNumber">
            <wd-input v-model="formData.jobNumber" clearable placeholder="请输入工号" :maxlength="64" />
          </wd-form-item>
          <yd-form-picker
            v-if="isFieldVisible('entryStatus')"
            v-model="formData.entryStatus"
            label="入职状态"
            label-width="200rpx"
            prop="entryStatus"
            :columns="entryStatusColumns"
            :disabled="formMode === 'update' || formMode === 'confirm' || formMode === 'rehire' || formMode === 'candidate'"
            placeholder="请选择入职状态"
          />
          <DeptFormPicker
            v-if="isFieldVisible('deptId')"
            v-model="formData.deptId"
            label="部门"
            label-width="200rpx"
            prop="deptId"
            placeholder="请选择部门"
          />
          <wd-form-item v-if="isFieldVisible('postName')" title="职位名称" title-width="200rpx" prop="postName">
            <wd-input v-model="formData.postName" clearable placeholder="请输入职位名称" :maxlength="255" />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('postLevel')" title="岗位职级" title-width="200rpx" prop="postLevel">
            <wd-input v-model="formData.postLevel" clearable placeholder="请输入岗位职级" :maxlength="255" />
          </wd-form-item>
          <EmployeeFormPicker
            v-if="isFieldVisible('leaderEmployeeId')"
            v-model="formData.leaderEmployeeId"
            label="直属上级"
            label-width="200rpx"
            prop="leaderEmployeeId"
            placeholder="请选择直属上级"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
            :disabled-ids="formData.id ? [formData.id] : []"
          />
          <ChannelFormPicker
            v-if="isFieldVisible('channelId')"
            v-model="formData.channelId"
            label="招聘渠道"
            label-width="200rpx"
            prop="channelId"
          />
          <yd-form-picker
            v-if="isFieldVisible('type')"
            v-model="formData.type"
            label="聘用形式"
            label-width="200rpx"
            prop="type"
            :dict-type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
            :disabled="formMode === 'update'"
            placeholder="请选择聘用形式"
            @confirm="handleTypeChange"
          />
          <yd-form-picker
            v-if="isFieldVisible('status') && formData.type === HrmEmployeeType.INFORMAL"
            v-model="formData.status"
            label="员工状态"
            label-width="200rpx"
            prop="status"
            :columns="nonFormalStatusColumns"
            :disabled="formMode === 'update'"
            placeholder="请选择员工状态"
          />
          <wd-form-item
            v-else-if="isFieldVisible('status')"
            title="员工状态"
            title-width="200rpx"
            prop="status"
          >
            <wd-input
              :model-value="getDictLabel(DICT_TYPE.HRM_EMPLOYEE_STATUS, formData.status) || '保存后自动计算'"
              readonly
              align-right
            />
          </wd-form-item>
          <wd-form-item
            v-if="isFieldVisible('entryTime')"
            title="入职时间"
            title-width="200rpx"
            prop="entryTime"
            center
          >
            <view class="w-full" @click="entryTimeVisible = true">
              <wd-input
                :model-value="formatDateTime(entryTimePicker) || ''"
                readonly
                align-right
                placeholder="请选择入职时间"
              />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="entryTimePicker"
            v-model:visible="entryTimeVisible"
            type="datetime"
            title="入职时间"
          />
          <wd-form-item
            v-if="isFieldVisible('probation') && formData.type === HrmEmployeeType.FORMAL"
            title="试用期（月）"
            title-width="200rpx"
            prop="probation"
          >
            <wd-input-number
              v-model="formData.probation"
              allow-null
              :min="0"
              :max="6"
              :precision="0"
              :disabled="formMode === 'update'"
            />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('workCity')" title="工作城市" title-width="200rpx" prop="workCity">
            <wd-input v-model="formData.workCity" clearable placeholder="请输入工作城市" :maxlength="64" />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('workAddress')" title="工作地点" title-width="200rpx" prop="workAddress">
            <wd-input v-model="formData.workAddress" clearable placeholder="请输入工作地点" :maxlength="255" />
          </wd-form-item>
          <wd-form-item
            v-if="isFieldVisible('workDetailAddress')"
            title="详细地址"
            title-width="200rpx"
            prop="workDetailAddress"
          >
            <wd-input
              v-model="formData.workDetailAddress"
              clearable
              placeholder="请输入详细地址"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item v-if="isFieldVisible('remark')" title="备注" title-width="200rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="500"
              show-word-limit
            />
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
import type { Employee } from '@/api/hrm/employee'
import type { RecruitCandidate } from '@/api/hrm/recruit/candidate'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  confirmEmployeeEntry,
  createEmployee,
  getEmployee,
  rehireEmployee,
  updateEmployee,
} from '@/api/hrm/employee'
import { getEmployeeCreateFieldConfigList } from '@/api/hrm/employee/config'
import {
  convertRecruitCandidateToEmployee,
  getRecruitCandidate,
} from '@/api/hrm/recruit/candidate'
import DeptFormPicker from '@/components/system-select/dept-form-picker.vue'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { createFormSchema } from '@/utils/wot'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ChannelFormPicker from '@/pages-hrm/recruit/channel/components/channel-form-picker.vue'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  HRM_EMPLOYEE_CREATE_ENTRY_STATUSES,
  HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  HRM_EMPLOYEE_NON_FORMAL_STATUSES,
  HRM_RECRUIT_CANDIDATE_EMPLOYEE_EDUCATION_MAP,
  HrmEmployeeEntryStatus,
  HrmEmployeeIdType,
  HrmEmployeeIdTypeOptions,
  HrmEmployeeStatus,
  HrmEmployeeType,
} from '@/pages-hrm/utils/constants'

const props = defineProps<{
  id?: number | any
  mode?: string
  candidateId?: number | string
}>()

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
const entryTimeVisible = ref(false) // 入职时间选择
const birthdayPicker = ref<number | string>('') // 出生时间本地值
const entryTimePicker = ref<number | string>('') // 入职时间本地值
const createFieldVisibleMap = ref<Record<number, Set<string>>>({}) // 新建字段可见配置

const formMode = computed(() => { // 表单模式
  if (props.mode === 'confirm' || props.mode === 'rehire' || props.mode === 'candidate') {
    return props.mode
  }
  return props.id ? 'update' : 'create'
})

const getTitle = computed(() => {
  if (formMode.value === 'confirm') {
    return '确认入职'
  }
  if (formMode.value === 'rehire') {
    return '办理再入职'
  }
  if (formMode.value === 'candidate') {
    return '候选人转员工'
  }
  return props.id ? '编辑员工' : '新增员工'
})

const formData = ref<Employee & { candidateId?: number }>(createDefaultFormData()) // 表单数据

const idTypeColumns = HrmEmployeeIdTypeOptions.map(item => ({
  label: item.label,
  value: item.value,
}))

const entryStatusColumns = computed(() => {
  const options = getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS)
  if (formMode.value === 'update') {
    return options
  }
  return options.filter(item =>
    (HRM_EMPLOYEE_CREATE_ENTRY_STATUSES as readonly number[]).includes(Number(item.value)))
})

const nonFormalStatusColumns = computed(() =>
  getIntDictOptions(DICT_TYPE.HRM_EMPLOYEE_STATUS)
    .filter(item => (HRM_EMPLOYEE_NON_FORMAL_STATUSES as readonly number[]).includes(Number(item.value))))

const formSchema = createFormSchema({
  name: [{ required: true, message: '员工姓名不能为空' }],
  jobNumber: [{
    required: () => formData.value.entryStatus === HrmEmployeeEntryStatus.ACTIVE,
    message: '在职员工工号不能为空',
  }],
  mobile: [
    { required: true, message: '手机号不能为空' },
    { type: 'mobile', message: '请输入正确的手机号码' },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
  entryStatus: [{ required: true, message: '请选择入职状态' }],
  type: [{ required: true, message: '请选择聘用形式' }],
  entryTime: [{ required: true, message: '请选择入职时间' }],
  probation: [{
    required: () => formData.value.type === HrmEmployeeType.FORMAL,
    message: '请输入试用期',
  }],
  status: [{
    required: () => formData.value.type === HrmEmployeeType.INFORMAL,
    message: '请选择员工状态',
  }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): Employee & { candidateId?: number } {
  return {
    id: undefined,
    name: '',
    jobNumber: '',
    mobile: '',
    country: '中国',
    nation: '',
    idType: HrmEmployeeIdType.ID_CARD,
    idNumber: '',
    sex: undefined,
    email: '',
    nativePlace: '',
    birthday: undefined,
    address: '',
    highestEducation: undefined,
    deptId: undefined,
    leaderEmployeeId: undefined,
    entryStatus: HrmEmployeeEntryStatus.ACTIVE,
    status: undefined,
    type: HrmEmployeeType.FORMAL,
    entryTime: undefined,
    probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS,
    postName: '',
    postLevel: '',
    workCity: '',
    workAddress: '',
    workDetailAddress: '',
    channelId: undefined,
    userId: undefined,
    candidateId: undefined,
    remark: '',
  }
}

/** 判断字段是否显示 */
function isFieldVisible(name: string) {
  if (formMode.value === 'update') {
    return true
  }
  const entryStatus = formData.value.entryStatus || HrmEmployeeEntryStatus.ACTIVE
  const visibleFields = createFieldVisibleMap.value[entryStatus]
  return !visibleFields || visibleFields.has(name)
}

/** 加载新建员工字段配置 */
async function loadCreateFieldConfig() {
  const [activeFields, pendingEntryFields] = await Promise.all([
    getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
    getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY),
  ])
  createFieldVisibleMap.value = {
    [HrmEmployeeEntryStatus.ACTIVE]: new Set(
      activeFields.filter(field => field.visible).map(field => field.name),
    ),
    [HrmEmployeeEntryStatus.PENDING_ENTRY]: new Set(
      pendingEntryFields.filter(field => field.visible).map(field => field.name),
    ),
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 切换聘用形式 */
function handleTypeChange() {
  if (formData.value.type === HrmEmployeeType.FORMAL) {
    formData.value.probation ??= HRM_EMPLOYEE_NO_PROBATION_MONTHS
    if (
      formData.value.status !== HrmEmployeeStatus.REGULAR
      && formData.value.status !== HrmEmployeeStatus.PROBATION
    ) {
      formData.value.status = undefined
    }
    return
  }
  formData.value.probation = undefined
  formData.value.regularTime = undefined
  if (!nonFormalStatusColumns.value.some(item => Number(item.value) === formData.value.status)) {
    formData.value.status = HrmEmployeeStatus.INTERN
  }
}

/** 按字段配置构造提交数据 */
function buildSubmitData() {
  if (formMode.value === 'update') {
    return formData.value
  }
  const entryStatus = formData.value.entryStatus || HrmEmployeeEntryStatus.ACTIVE
  const visibleFields = createFieldVisibleMap.value[entryStatus]
  if (!visibleFields) {
    return formData.value
  }
  const submitData: Partial<Employee> = {}
  Object.entries(formData.value).forEach(([name, value]) => {
    if (visibleFields.has(name)) {
      ;(submitData as any)[name] = value
    }
  })
  if (formMode.value === 'confirm' || formMode.value === 'rehire') {
    submitData.id = formData.value.id
  }
  if (formMode.value === 'candidate' && formData.value.candidateId) {
    ;(submitData as any).candidateId = formData.value.candidateId
  }
  return submitData as Employee
}

/** 按候选人预填转员工表单 */
function fillFromCandidate(candidate: RecruitCandidate) {
  const entryTime = candidate.entryTime ? Number(candidate.entryTime) : Date.now()
  formData.value = {
    ...createDefaultFormData(),
    candidateId: candidate.id,
    name: candidate.name,
    mobile: candidate.mobile,
    sex: candidate.sex,
    email: candidate.email || '',
    highestEducation: candidate.education != null
      ? HRM_RECRUIT_CANDIDATE_EMPLOYEE_EDUCATION_MAP[candidate.education]
      : undefined,
    deptId: candidate.deptId,
    postName: candidate.postName || '',
    channelId: candidate.channelId,
    remark: candidate.remark || '',
    entryStatus: HrmEmployeeEntryStatus.PENDING_ENTRY,
    status: HrmEmployeeStatus.PROBATION,
    type: HrmEmployeeType.FORMAL,
    entryTime,
    companyAgeStartTime: entryTime,
    probation: 3,
  }
  entryTimePicker.value = entryTime
  birthdayPicker.value = ''
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const employee = await getEmployee(Number(props.id))
  formData.value = employee
  birthdayPicker.value = employee.birthday ? Number(employee.birthday) : ''
  entryTimePicker.value = employee.entryTime ? Number(employee.entryTime) : ''
  if (formMode.value === 'confirm') {
    formData.value.entryStatus = HrmEmployeeEntryStatus.ACTIVE
    if (!formData.value.entryTime || Number(formData.value.entryTime) > Date.now()) {
      const entryTime = Date.now()
      formData.value.entryTime = entryTime
      entryTimePicker.value = entryTime
      formData.value.regularTime = undefined
      if (
        !formData.value.companyAgeStartTime
        || Number(formData.value.companyAgeStartTime) > entryTime
      ) {
        formData.value.companyAgeStartTime = entryTime
      }
    }
  } else if (formMode.value === 'rehire') {
    const entryTime = Date.now()
    formData.value = {
      ...formData.value,
      entryStatus: HrmEmployeeEntryStatus.ACTIVE,
      entryTime,
      companyAgeStartTime: entryTime,
      regularTime: undefined,
      leaveTime: undefined,
      probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS,
    }
    entryTimePicker.value = entryTime
    handleTypeChange()
  }
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.birthday = birthdayPicker.value || undefined
  formData.value.entryTime = entryTimePicker.value || undefined
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const submitData = buildSubmitData()
    if (formMode.value === 'create') {
      await createEmployee(submitData)
      toast.success('新增成功')
    } else if (formMode.value === 'candidate') {
      await convertRecruitCandidateToEmployee({
        ...submitData,
        candidateId: Number(formData.value.candidateId),
      })
      toast.success('已转为员工')
      uni.$emit('hrm:recruit:candidate:reload')
    } else if (formMode.value === 'confirm') {
      await confirmEmployeeEntry(submitData)
      toast.success('已确认入职')
    } else if (formMode.value === 'rehire') {
      await rehireEmployee({
        ...submitData,
        employeeId: formData.value.id,
      })
      toast.success('再入职办理成功')
    } else {
      await updateEmployee(formData.value)
      toast.success('修改成功')
    }
    handleBack()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (formMode.value !== 'update') {
    await loadCreateFieldConfig()
  }
  if (formMode.value === 'candidate' && props.candidateId) {
    const candidate = await getRecruitCandidate(Number(props.candidateId))
    fillFromCandidate(candidate)
    return
  }
  if (props.id) {
    await getDetail()
  }
})
</script>
