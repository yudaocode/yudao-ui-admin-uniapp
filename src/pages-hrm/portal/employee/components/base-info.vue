<template>
  <view>
    <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-20rpx text-26rpx text-[#1677ff] leading-40rpx">
      {{ employeeReminder }}
    </view>

    <wd-cell-group border title="基本信息">
      <wd-cell v-if="isVisible('name')" title="姓名" :value="employee.name || '-'" />
      <wd-cell v-if="isVisible('sex')" title="性别">
        <dict-tag
          v-if="employee.sex != null"
          :type="DICT_TYPE.SYSTEM_USER_SEX"
          :value="employee.sex"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell
        v-if="isVisible('birthday')"
        title="出生时间"
        :value="formatDateTime(employee.birthday) || '-'"
      />
      <wd-cell
        v-if="isVisible('age')"
        title="年龄"
        :value="employee.age != null ? String(employee.age) : '-'"
      />
      <wd-cell v-if="isVisible('country')" title="国家或地区" :value="employee.country || '-'" />
      <wd-cell v-if="isVisible('nation')" title="民族" :value="employee.nation || '-'" />
      <wd-cell v-if="isVisible('nativePlace')" title="籍贯" :value="employee.nativePlace || '-'" />
      <wd-cell v-if="isVisible('highestEducation')" title="最高学历">
        <dict-tag
          v-if="employee.highestEducation != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
          :value="employee.highestEducation"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell
        v-if="isVisible('idType')"
        title="证件类型"
        :value="formatEmployeeIdType(employee.idType)"
      />
      <wd-cell v-if="isVisible('idNumber')" title="证件号码" :value="employee.idNumber || '-'" />
    </wd-cell-group>

    <wd-cell-group v-if="hasVisibleContactFields" border title="通讯信息">
      <wd-cell v-if="isVisible('mobile')" title="手机号" :value="employee.mobile || '-'" />
      <wd-cell v-if="isVisible('email')" title="邮箱" :value="employee.email || '-'" />
      <wd-cell v-if="isVisible('address')" title="户籍地址" :value="employee.address || '-'" />
    </wd-cell-group>

    <view class="mt-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
      教育经历
    </view>
    <view class="p-24rpx pb-8rpx">
      <view v-if="!educationExperienceList.length" class="py-40rpx text-center text-28rpx text-[#999]">
        暂无数据
      </view>
      <view
        v-for="item in educationExperienceList"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <text class="text-30rpx text-[#333] font-semibold">
            {{ item.graduateSchool || '-' }}
          </text>
          <dict-tag
            v-if="item.education != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="item.education"
          />
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          专业：{{ item.major || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          {{ formatHrmDate(item.admissionTime) }} 至 {{ formatHrmDate(item.graduationTime) }}
        </view>
      </view>
    </view>

    <view class="px-24rpx text-28rpx text-[#333] font-semibold">
      工作经历
    </view>
    <view class="p-24rpx pb-8rpx">
      <view v-if="!workExperienceList.length" class="py-40rpx text-center text-28rpx text-[#999]">
        暂无数据
      </view>
      <view
        v-for="item in workExperienceList"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          {{ item.workUnit || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          职务：{{ item.postName || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          {{ formatHrmDate(item.startTime) }} 至 {{ formatHrmDate(item.endTime) }}
        </view>
        <view class="text-26rpx text-[#666]">
          离职原因：{{ item.reason || '-' }}
        </view>
      </view>
    </view>

    <view class="px-24rpx text-28rpx text-[#333] font-semibold">
      证书/证件
    </view>
    <view class="p-24rpx pb-8rpx">
      <view v-if="!certificateList.length" class="py-40rpx text-center text-28rpx text-[#999]">
        暂无数据
      </view>
      <view
        v-for="item in certificateList"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          {{ item.name || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          级别：{{ item.level || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          证书编号：{{ item.no || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          发证机构：{{ item.issuingAuthority || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          发证日期：{{ formatHrmDate(item.issuingTime) }}
        </view>
      </view>
    </view>

    <view class="px-24rpx text-28rpx text-[#333] font-semibold">
      培训经历
    </view>
    <view class="p-24rpx pb-8rpx">
      <view v-if="!trainingExperienceList.length" class="py-40rpx text-center text-28rpx text-[#999]">
        暂无数据
      </view>
      <view
        v-for="item in trainingExperienceList"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          {{ item.course || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          培训机构：{{ item.organizationName || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          {{ formatHrmDate(item.startTime) }} 至 {{ formatHrmDate(item.endTime) }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          培训成绩：{{ item.result || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          培训证书：{{ item.certificateName || '-' }}
        </view>
      </view>
    </view>

    <view class="px-24rpx text-28rpx text-[#333] font-semibold">
      联系人
    </view>
    <view class="p-24rpx pb-32rpx">
      <view v-if="!contactList.length" class="py-40rpx text-center text-28rpx text-[#999]">
        暂无数据
      </view>
      <view
        v-for="item in contactList"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx text-30rpx text-[#333] font-semibold">
          {{ item.name || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          关系：{{ item.relation || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          联系电话：{{ item.phone || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          工作单位：{{ item.workUnit || '-' }}
        </view>
        <view class="text-26rpx text-[#666]">
          联系地址：{{ item.address || '-' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeFieldConfig } from '@/api/hrm/employee/config'
import type { EmployeeContact } from '@/api/hrm/employee/contact'
import type { EmployeeCertificate } from '@/api/hrm/portal/employee/certificate'
import type { EmployeeEducationExperience } from '@/api/hrm/portal/employee/education-experience'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import type { EmployeeTrainingExperience } from '@/api/hrm/portal/employee/training-experience'
import type { EmployeeWorkExperience } from '@/api/hrm/portal/employee/work-experience'
import { computed, onMounted, ref } from 'vue'
import { getPortalEmployeeCertificateList } from '@/api/hrm/portal/employee/certificate'
import { getPortalEmployeeContactList } from '@/api/hrm/portal/employee/contact'
import { getPortalEmployeeEducationExperienceList } from '@/api/hrm/portal/employee/education-experience'
import { getPortalEmployeeTrainingExperienceList } from '@/api/hrm/portal/employee/training-experience'
import { getPortalEmployeeWorkExperienceList } from '@/api/hrm/portal/employee/work-experience'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatEmployeeIdType, formatHrmDate } from '@/pages-hrm/utils/format'

const props = defineProps<{
  employee: PortalEmployee
  fieldConfigList: EmployeeFieldConfig[]
}>()

const educationExperienceList = ref<EmployeeEducationExperience[]>([]) // 教育经历列表
const workExperienceList = ref<EmployeeWorkExperience[]>([]) // 工作经历列表
const certificateList = ref<EmployeeCertificate[]>([]) // 证书列表
const trainingExperienceList = ref<EmployeeTrainingExperience[]>([]) // 培训经历列表
const contactList = ref<EmployeeContact[]>([]) // 联系人列表

const hasEditableFields = computed(() => props.fieldConfigList.some(field => field.editable)) // 是否存在可编辑字段
const visibleFieldNames = computed(
  () => new Set(props.fieldConfigList.filter(field => field.visible).map(field => field.name)),
)
const hasVisibleContactFields = computed(
  () => isVisible('mobile') || isVisible('email') || isVisible('address'),
)
const employeeReminder = computed(() =>
  hasEditableFields.value
    ? '可编辑的信息由公司管理员设置，如有问题，请联系公司管理员。'
    : '您的编辑权限已被管理员关闭，如有问题，请联系公司管理员。')

/** 判断字段是否允许员工查看 */
function isVisible(name: string) {
  return visibleFieldNames.value.has(name)
}

/** 获得员工个人信息各子模块 */
async function getList() {
  const [educationExperiences, workExperiences, certificates, trainingExperiences, contacts]
    = await Promise.all([
      getPortalEmployeeEducationExperienceList(),
      getPortalEmployeeWorkExperienceList(),
      getPortalEmployeeCertificateList(),
      getPortalEmployeeTrainingExperienceList(),
      getPortalEmployeeContactList(),
    ])
  educationExperienceList.value = educationExperiences
  workExperienceList.value = workExperiences
  certificateList.value = certificates
  trainingExperienceList.value = trainingExperiences
  contactList.value = contacts
}

defineExpose({ getList })

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
