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
        <wd-cell-group border>
          <wd-form-item title="职位名称" title-width="200rpx" prop="postName">
            <wd-input
              v-model="formData.postName"
              clearable
              placeholder="请输入职位名称"
              :maxlength="255"
            />
          </wd-form-item>
          <DeptFormPicker
            v-model="formData.deptId"
            label="用人部门"
            label-width="200rpx"
            prop="deptId"
            placeholder="请选择用人部门"
          />
          <yd-form-picker
            v-model="formData.jobNature"
            label="工作性质"
            label-width="200rpx"
            prop="jobNature"
            :dict-type="DICT_TYPE.HRM_RECRUIT_JOB_NATURE"
            placeholder="请选择工作性质"
          />
          <yd-tree-select
            v-model="formData.areaId"
            :data="areaTree"
            label="工作城市"
            prop="areaId"
            label-width="200rpx"
            placeholder="请选择工作城市"
          />
          <wd-form-item title="招聘人数" title-width="200rpx" prop="recruitNum">
            <wd-input-number
              v-model="formData.recruitNum"
              allow-null
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="招聘原因" title-width="200rpx" prop="reason">
            <wd-input
              v-model="formData.reason"
              clearable
              placeholder="请输入招聘原因"
              :maxlength="255"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.workTime"
            label="工作经验"
            label-width="200rpx"
            prop="workTime"
            :dict-type="DICT_TYPE.HRM_RECRUIT_WORK_TIME"
            placeholder="请选择工作经验"
          />
          <yd-form-picker
            v-model="formData.educationRequire"
            label="学历要求"
            label-width="200rpx"
            prop="educationRequire"
            :dict-type="DICT_TYPE.HRM_RECRUIT_POST_EDUCATION"
            placeholder="请选择学历要求"
          />
          <wd-form-item title="薪资范围" title-width="200rpx" prop="minSalary" vertical>
            <view class="w-full">
              <view class="mb-16rpx flex items-center justify-end">
                <wd-checkbox v-model="salaryNegotiable" @change="handleSalaryNegotiableChange">
                  面议
                </wd-checkbox>
              </view>
              <view class="mb-16rpx flex items-center gap-12rpx">
                <wd-input-number
                  v-model="formData.minSalary"
                  allow-null
                  :disabled="salaryNegotiable"
                  :min="0"
                  :max="99999999.99"
                  :precision="2"
                />
                <text class="shrink-0 text-26rpx text-[#999]">至</text>
                <wd-input-number
                  v-model="formData.maxSalary"
                  allow-null
                  :disabled="salaryNegotiable"
                  :min="0"
                  :max="99999999.99"
                  :precision="2"
                />
              </view>
              <yd-form-picker
                v-model="formData.salaryUnit"
                label="薪资单位"
                label-width="160rpx"
                :disabled="salaryNegotiable"
                :dict-type="DICT_TYPE.HRM_RECRUIT_SALARY_UNIT"
                placeholder="请选择单位"
              />
              <view class="mt-8rpx text-24rpx text-[#999]">
                最低薪资不能大于最高薪资；勾选「面议」后无需填写范围。
              </view>
            </view>
          </wd-form-item>
          <wd-form-item
            title="最迟到岗时间"
            title-width="200rpx"
            prop="latestEntryTime"
            is-link
            placeholder="请选择时间"
            :value="formatDateTime(latestEntryTimePicker) || ''"
            @click="latestEntryTimeVisible = true"
          />
          <wd-datetime-picker
            v-model="latestEntryTimePicker"
            v-model:visible="latestEntryTimeVisible"
            title="请选择最迟到岗时间"
            type="datetime"
          />
          <wd-form-item title="年龄要求" title-width="200rpx" prop="minAge" vertical>
            <view class="w-full">
              <view class="mb-16rpx flex items-center justify-end">
                <wd-checkbox v-model="ageUnlimited" @change="handleAgeUnlimitedChange">
                  不限
                </wd-checkbox>
              </view>
              <view class="flex items-center gap-12rpx">
                <wd-input-number
                  v-model="formData.minAge"
                  allow-null
                  :disabled="ageUnlimited"
                  :min="0"
                  :max="99"
                  :precision="0"
                />
                <text class="shrink-0 text-26rpx text-[#999]">至</text>
                <wd-input-number
                  v-model="formData.maxAge"
                  allow-null
                  :disabled="ageUnlimited"
                  :min="0"
                  :max="99"
                  :precision="0"
                />
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                最小年龄不能大于最大年龄；勾选「不限」后无需填写范围。
              </view>
            </view>
          </wd-form-item>
          <wd-form-item title="紧急程度" title-width="200rpx" prop="emergencyLevel" vertical>
            <wd-radio-group v-model="formData.emergencyLevel" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.HRM_RECRUIT_EMERGENCY_LEVEL)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <EmployeeFormPicker
            v-model="formData.ownerEmployeeId"
            label="招聘负责人"
            label-width="200rpx"
            prop="ownerEmployeeId"
            placeholder="请选择招聘负责人"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
          />
          <yd-tree-select
            v-model="formData.postTypeId"
            :data="postTypeTree"
            label="职位类型"
            prop="postTypeId"
            label-width="200rpx"
            placeholder="请选择职位类型"
            check-strictly
          />
          <EmployeeFormPicker
            v-model="formData.interviewEmployeeIds"
            type="checkbox"
            label="面试官"
            label-width="200rpx"
            prop="interviewEmployeeIds"
            placeholder="请选择面试官"
            :entry-status="HrmEmployeeEntryStatus.ACTIVE"
          />
          <wd-form-item title="职位描述" title-width="200rpx" prop="description" vertical>
            <wd-textarea
              v-model="formData.description"
              clearable
              placeholder="请输入职位描述"
              :maxlength="4000"
              show-word-limit
            />
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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Area } from '@/api/system/area'
import type { RecruitPost } from '@/api/hrm/recruit/post'
import type { RecruitPostType } from '@/api/hrm/recruit/post/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createRecruitPost,
  getRecruitPost,
  updateRecruitPost,
} from '@/api/hrm/recruit/post'
import { getRecruitPostTypeList } from '@/api/hrm/recruit/post/type'
import { getAreaTree } from '@/api/system/area'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'
import { DeptFormPicker } from '@/components/system-select'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  AGE_UNLIMITED_VALUE,
  HrmEmployeeEntryStatus,
  HrmRecruitEmergencyLevel,
  HrmRecruitJobNature,
  HrmRecruitPostEducation,
  HrmRecruitSalaryUnit,
  HrmRecruitWorkTime,
  SALARY_NEGOTIABLE_UNIT_VALUE,
  SALARY_NEGOTIABLE_VALUE,
} from '@/pages-hrm/utils/constants'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑招聘职位' : '新增招聘职位')
const formLoading = ref(false) // 表单提交状态
const areaTree = ref<Area[]>([]) // 地区树
const postTypeTree = ref<RecruitPostType[]>([]) // 职位类型树
const salaryNegotiable = ref(false) // 薪资是否面议
const ageUnlimited = ref(false) // 年龄是否不限
const latestEntryTimePicker = ref<string | number>('') // 最迟到岗时间本地值
const latestEntryTimeVisible = ref(false) // 最迟到岗时间选择器
const formData = ref<RecruitPost>({
  id: undefined,
  postName: '',
  deptId: undefined,
  jobNature: HrmRecruitJobNature.FULL_TIME,
  areaId: undefined,
  recruitNum: undefined,
  reason: '',
  workTime: HrmRecruitWorkTime.UNLIMITED,
  educationRequire: HrmRecruitPostEducation.UNLIMITED,
  minSalary: undefined,
  maxSalary: undefined,
  salaryUnit: HrmRecruitSalaryUnit.MONTH,
  minAge: undefined,
  maxAge: undefined,
  latestEntryTime: undefined,
  ownerEmployeeId: undefined,
  interviewEmployeeIds: [],
  description: '',
  emergencyLevel: HrmRecruitEmergencyLevel.URGENT,
  postTypeId: undefined,
}) // 表单数据

const formSchema = createFormSchema({
  postName: [{ required: true, message: '职位名称不能为空' }],
  jobNature: [{ required: true, message: '工作性质不能为空' }],
  minSalary: [{
    validator: () => {
      if (
        !salaryNegotiable.value
        && formData.value.minSalary != null
        && formData.value.maxSalary != null
        && formData.value.minSalary > formData.value.maxSalary
      ) {
        return '最低薪资不能大于最高薪资'
      }
      return true
    },
  }],
  minAge: [{
    validator: () => {
      if (
        !ageUnlimited.value
        && formData.value.minAge != null
        && formData.value.maxAge != null
        && formData.value.minAge > formData.value.maxAge
      ) {
        return '最小年龄不能大于最大年龄'
      }
      return true
    },
  }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/recruit/post/index')
}

/** 切换薪资面议 */
function handleSalaryNegotiableChange() {
  formData.value.minSalary = undefined
  formData.value.maxSalary = undefined
  if (!salaryNegotiable.value) {
    formData.value.salaryUnit = HrmRecruitSalaryUnit.MONTH
  }
}

/** 切换年龄不限 */
function handleAgeUnlimitedChange() {
  formData.value.minAge = undefined
  formData.value.maxAge = undefined
}

/** 加载招聘职位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getRecruitPost(Number(props.id))
  salaryNegotiable.value
    = data.salaryUnit === SALARY_NEGOTIABLE_UNIT_VALUE
      || (data.minSalary === SALARY_NEGOTIABLE_VALUE && data.maxSalary === SALARY_NEGOTIABLE_VALUE)
  ageUnlimited.value
    = data.minAge === AGE_UNLIMITED_VALUE && data.maxAge === AGE_UNLIMITED_VALUE
  formData.value = {
    ...data,
    interviewEmployeeIds: data.interviewEmployeeIds ?? [],
  }
  latestEntryTimePicker.value = data.latestEntryTime
    ? Number(data.latestEntryTime)
    : ''
  if (salaryNegotiable.value) {
    formData.value.minSalary = undefined
    formData.value.maxSalary = undefined
    formData.value.salaryUnit = HrmRecruitSalaryUnit.MONTH
  }
  if (ageUnlimited.value) {
    formData.value.minAge = undefined
    formData.value.maxAge = undefined
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: RecruitPost = {
      ...formData.value,
      minSalary: salaryNegotiable.value ? SALARY_NEGOTIABLE_VALUE : formData.value.minSalary,
      maxSalary: salaryNegotiable.value ? SALARY_NEGOTIABLE_VALUE : formData.value.maxSalary,
      salaryUnit: salaryNegotiable.value
        ? SALARY_NEGOTIABLE_UNIT_VALUE
        : formData.value.salaryUnit,
      minAge: ageUnlimited.value ? AGE_UNLIMITED_VALUE : formData.value.minAge,
      maxAge: ageUnlimited.value ? AGE_UNLIMITED_VALUE : formData.value.maxAge,
      latestEntryTime: latestEntryTimePicker.value
        ? Number(latestEntryTimePicker.value)
        : undefined,
      interviewEmployeeIds: formData.value.interviewEmployeeIds ?? [],
    }
    if (props.id) {
      await updateRecruitPost(data)
      toast.success('修改成功')
    } else {
      await createRecruitPost(data)
      toast.success('新增成功')
    }
    uni.$emit('hrm:recruit:post:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  const [areas, postTypes] = await Promise.all([
    getAreaTree(),
    getRecruitPostTypeList({ status: CommonStatusEnum.ENABLE }),
  ])
  areaTree.value = areas
  postTypeTree.value = handleTree(postTypes)
  await getDetail()
})
</script>
