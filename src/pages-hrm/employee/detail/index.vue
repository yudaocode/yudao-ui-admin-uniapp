<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工档案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view v-if="formData.id" class="bg-white px-24rpx py-24rpx">
      <view class="mb-16rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
          {{ formData.name || '-' }}
        </view>
        <view class="flex shrink-0 flex-col items-end gap-8rpx">
          <dict-tag
            v-if="formData.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="formData.entryStatus"
          />
          <dict-tag
            v-if="formData.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="formData.status"
          />
        </view>
      </view>
      <view class="mb-8rpx text-26rpx text-[#999]">
        员工编号：{{ formData.id }}
      </view>
      <view class="text-26rpx text-[#666]">
        {{ formData.deptName || '-' }} · {{ formData.postName || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        工号：{{ formData.jobNumber || '-' }} · 手机：{{ formData.mobile || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        直属上级：{{ formData.leaderEmployeeName || '-' }}
      </view>
    </view>

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 岗位信息 -->
    <view v-if="activeTab === 'post'" class="pb-160rpx">
      <wd-cell-group border title="岗位信息">
        <wd-cell title="工号" :value="formData.jobNumber || '-'" />
        <wd-cell title="所属部门" :value="formData.deptName || '-'" />
        <wd-cell title="职位名称" :value="formData.postName || '-'" />
        <wd-cell title="岗位职级" :value="formData.postLevel || '-'" />
        <wd-cell title="直属上级" :value="formData.leaderEmployeeName || '-'" />
        <wd-cell title="入职状态">
          <dict-tag
            v-if="formData.entryStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
            :value="formData.entryStatus"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="员工状态">
          <dict-tag
            v-if="formData.status != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="聘用形式">
          <dict-tag
            v-if="formData.type != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
            :value="formData.type"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="入职时间" :value="formatDateTime(formData.entryTime) || '-'" />
        <wd-cell title="试用期" :value="formData.probation != null ? `${formData.probation} 个月` : '-'" />
        <wd-cell title="转正时间" :value="formatDateTime(formData.regularTime) || '-'" />
        <wd-cell title="离职时间" :value="formatDateTime(formData.leaveTime) || '-'" />
        <wd-cell title="工作城市" :value="formData.workCity || '-'" />
        <wd-cell title="工作地点" :value="formData.workAddress || '-'" />
        <wd-cell title="详细地址" :value="formData.workDetailAddress || '-'" />
        <wd-cell title="招聘渠道" :value="formData.channelName || '-'" />
        <wd-cell title="司龄起算时间" :value="formatDateTime(formData.companyAgeStartTime) || '-'" />
        <wd-cell title="司龄" :value="formData.companyAge != null ? `${formData.companyAge} 年` : '-'" />
      </wd-cell-group>
      <view class="mt-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
        异动记录
      </view>
      <ChangeRecordList ref="changeRecordListRef" :employee-id="Number(props.id)" />
      <QuitInfoCard
        ref="quitInfoRef"
        :employee-id="Number(props.id)"
        editable
        @edit="openQuit"
      />
    </view>

    <!-- 基本信息 -->
    <view v-else-if="activeTab === 'basic'" class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="员工姓名" :value="formData.name || '-'" />
        <wd-cell title="手机号" :value="formData.mobile || '-'" />
        <wd-cell title="性别">
          <dict-tag v-if="formData.sex != null" :type="DICT_TYPE.SYSTEM_USER_SEX" :value="formData.sex" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="年龄" :value="formData.age != null ? String(formData.age) : '-'" />
        <wd-cell title="国家或地区" :value="formData.country || '-'" />
        <wd-cell title="民族" :value="formData.nation || '-'" />
        <wd-cell title="证件类型" :value="formatEmployeeIdType(formData.idType)" />
        <wd-cell title="证件号码" :value="formData.idNumber || '-'" />
        <wd-cell title="邮箱" :value="formData.email || '-'" />
        <wd-cell title="籍贯" :value="formData.nativePlace || '-'" />
        <wd-cell title="出生时间" :value="formatDateTime(formData.birthday) || '-'" />
        <wd-cell title="最高学历">
          <dict-tag
            v-if="formData.highestEducation != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="formData.highestEducation"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="户籍地址" :value="formData.address || '-'" />
      </wd-cell-group>
      <wd-cell-group border title="系统信息">
        <wd-cell title="后台账号" :value="formData.userNickname || '-'" />
        <wd-cell title="账号编号" :value="formData.userId != null ? String(formData.userId) : '-'" />
        <wd-cell title="候选人编号" :value="formData.candidateId != null ? String(formData.candidateId) : '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
      </wd-cell-group>
      <EducationExperienceList :employee-id="Number(props.id)" />
      <WorkExperienceList :employee-id="Number(props.id)" />
      <CertificateList :employee-id="Number(props.id)" />
      <TrainingExperienceList :employee-id="Number(props.id)" />
      <ContactList :employee-id="Number(props.id)" />
    </view>

    <!-- 员工合同 -->
    <ContractList
      v-else-if="activeTab === 'contract'"
      ref="contractListRef"
      :employee-id="Number(props.id)"
    />

    <!-- 工资社保 -->
    <SalaryCardInfo
      v-else-if="activeTab === 'salary'"
      ref="salaryCardRef"
      :employee-id="Number(props.id)"
      :social-security-number="formData.socialSecurityNumber"
      :accumulation-fund-number="formData.accumulationFundNumber"
    />

    <!-- 材料附件 -->
    <MaterialFiles v-else-if="activeTab === 'file'" :employee-id="Number(props.id)" />

    <!-- 操作日志 -->
    <OperateLogList
      v-else-if="activeTab === 'log' && props.id"
      class="min-h-0 flex-1"
      :biz-id="Number(props.id)"
      :biz-type="HrmBizType.EMPLOYEE"
    />

    <!-- 底部操作（岗位/基本信息放生命周期；合同/工资卡放附属操作） -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'post' || activeTab === 'basic'">
          <wd-button
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            class="flex-1"
            type="warning"
            @click="handleEdit"
          >
            编辑
          </wd-button>
          <wd-button
            v-if="canConfirmEntry"
            class="flex-1"
            type="success"
            @click="handleConfirmEntry"
          >
            确认入职
          </wd-button>
          <wd-button
            v-if="canRehire"
            class="flex-1"
            type="warning"
            @click="handleRehire"
          >
            再入职
          </wd-button>
          <wd-button
            v-if="changeActions.length"
            class="flex-1"
            type="primary"
            @click="changeActionVisible = true"
          >
            办理异动
          </wd-button>
          <wd-button
            v-if="moreActions.length"
            class="flex-1"
            type="info"
            @click="moreActionVisible = true"
          >
            更多
          </wd-button>
        </template>
        <wd-button
          v-else-if="activeTab === 'contract' && hasAccessByCodes(['hrm:employee:update'])"
          class="flex-1"
          type="primary"
          @click="contractListRef?.openAdd()"
        >
          新增合同
        </wd-button>
        <wd-button
          v-else-if="activeTab === 'salary' && hasAccessByCodes(['hrm:employee:update'])"
          class="flex-1"
          type="primary"
          @click="salaryCardRef?.openForm()"
        >
          编辑工资卡
        </wd-button>
      </view>
    </view>

    <!-- 异动操作菜单 -->
    <wd-action-sheet
      v-model="changeActionVisible"
      :actions="changeActions"
      @select="handleChangeAction"
    />

    <!-- 更多操作菜单 -->
    <wd-action-sheet
      v-model="moreActionVisible"
      :actions="moreActions"
      @select="handleMoreAction"
    />

    <!-- 生命周期表单 -->
    <QuitForm ref="quitFormRef" @success="handleLifecycleSuccess" />
    <ChangeForm ref="changeFormRef" @success="handleLifecycleSuccess" />
  </view>
</template>

<script lang="ts" setup>
import type { Employee } from '@/api/hrm/employee'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { cancelEmployeeQuit, deleteEmployee, getEmployee } from '@/api/hrm/employee'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import {
  HrmBizType,
  HrmEmployeeChangeType,
  HrmEmployeeEntryStatus,
  HrmEmployeeStatus,
} from '@/pages-hrm/utils/constants'
import { formatEmployeeIdType } from '@/pages-hrm/utils/format'
import CertificateList from '../components/certificate-list.vue'
import ChangeForm from '../components/change-form.vue'
import ChangeRecordList from '../components/change-record-list.vue'
import ContactList from '../components/contact-list.vue'
import ContractList from '../components/contract-list.vue'
import EducationExperienceList from '../components/education-experience-list.vue'
import MaterialFiles from '../components/material-files.vue'
import OperateLogList from '../components/operate-log-list.vue'
import QuitForm from '../components/quit-form.vue'
import QuitInfoCard from '../components/quit-info-card.vue'
import SalaryCardInfo from '../components/salary-card-info.vue'
import TrainingExperienceList from '../components/training-experience-list.vue'
import WorkExperienceList from '../components/work-experience-list.vue'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs = [ // tab 配置
  { key: 'post', title: '岗位信息' },
  { key: 'basic', title: '基本信息' },
  { key: 'contract', title: '员工合同' },
  { key: 'salary', title: '工资社保' },
  { key: 'file', title: '材料附件' },
  { key: 'log', title: '操作记录' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Employee>({ name: '' }) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const changeActionVisible = ref(false) // 异动菜单
const moreActionVisible = ref(false) // 更多菜单
const quitFormRef = ref<InstanceType<typeof QuitForm>>() // 离职表单
const changeFormRef = ref<InstanceType<typeof ChangeForm>>() // 异动表单
const changeRecordListRef = ref<InstanceType<typeof ChangeRecordList>>() // 异动记录
const quitInfoRef = ref<InstanceType<typeof QuitInfoCard>>() // 离职信息
const salaryCardRef = ref<InstanceType<typeof SalaryCardInfo>>() // 工资卡
const contractListRef = ref<InstanceType<typeof ContractList>>() // 合同列表

const activeTab = computed(() => tabs[tabIndex.value].key)
const isPagingTab = computed(() => activeTab.value === 'log')
const canConfirmEntry = computed(() => // 待入职可确认入职
  formData.value.entryStatus === HrmEmployeeEntryStatus.PENDING_ENTRY
  && hasAccessByCodes(['hrm:employee:update']))
const canRehire = computed(() => // 已离职可再入职
  formData.value.entryStatus === HrmEmployeeEntryStatus.LEFT
  && hasAccessByCodes(['hrm:employee:update']))
const changeableEntryStatuses: number[] = [
  HrmEmployeeEntryStatus.ACTIVE,
  HrmEmployeeEntryStatus.PENDING_LEAVE,
]

const changeActions = computed(() => {
  if (
    !hasAccessByCodes(['hrm:employee:update'])
    || !changeableEntryStatuses.includes(formData.value.entryStatus || 0)
  ) {
    return []
  }
  const actions: { name: string, value: number }[] = [
    { name: '调整部门/岗位', value: HrmEmployeeChangeType.TRANSFER },
    { name: '晋升', value: HrmEmployeeChangeType.PROMOTION },
    { name: '降级', value: HrmEmployeeChangeType.DEMOTION },
  ]
  if (formData.value.status === HrmEmployeeStatus.PROBATION) {
    actions.unshift({ name: '办理转正', value: HrmEmployeeChangeType.REGULAR })
  }
  if (
    formData.value.status === HrmEmployeeStatus.INTERN
    || formData.value.status === HrmEmployeeStatus.PART_TIME
  ) {
    actions.push({ name: '转为全职', value: HrmEmployeeChangeType.FULL_TIME })
  }
  return actions
})

const moreActions = computed(() => {
  const actions: { name: string, value: string }[] = []
  if (
    formData.value.entryStatus === HrmEmployeeEntryStatus.ACTIVE
    && hasAccessByCodes(['hrm:employee:update'])
  ) {
    actions.push({ name: '设置离职', value: 'quit' })
  }
  if (
    formData.value.entryStatus === HrmEmployeeEntryStatus.PENDING_LEAVE
    && hasAccessByCodes(['hrm:employee:update'])
  ) {
    actions.push({ name: '取消离职', value: 'cancelQuit' })
    actions.push({ name: '修改离职信息', value: 'quit' })
  }
  if (
    formData.value.entryStatus === HrmEmployeeEntryStatus.LEFT
    && hasAccessByCodes(['hrm:employee:update'])
  ) {
    actions.push({ name: '修改离职信息', value: 'quit' })
  }
  if (hasAccessByCodes(['hrm:employee:delete'])) {
    actions.push({ name: '删除', value: 'delete' })
  }
  return actions
})

const hasFooter = computed(() => {
  if (activeTab.value === 'log' || activeTab.value === 'file') {
    return false
  }
  if (activeTab.value === 'contract' || activeTab.value === 'salary') {
    return hasAccessByCodes(['hrm:employee:update'])
  }
  return hasAccessByCodes(['hrm:employee:update'])
    || canConfirmEntry.value
    || canRehire.value
    || changeActions.value.length > 0
    || moreActions.value.length > 0
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/employee/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getEmployee(Number(props.id))
  changeRecordListRef.value?.getList()
  quitInfoRef.value?.getQuitInfo()
}

/** 编辑员工 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/employee/form/index?id=${props.id}`,
  })
}

/** 确认入职 */
function handleConfirmEntry() {
  uni.navigateTo({
    url: `/pages-hrm/employee/form/index?id=${props.id}&mode=confirm`,
  })
}

/** 办理再入职 */
function handleRehire() {
  uni.navigateTo({
    url: `/pages-hrm/employee/form/index?id=${props.id}&mode=rehire`,
  })
}

/** 打开离职表单 */
function openQuit() {
  if (!formData.value.id) {
    return
  }
  quitFormRef.value?.open(formData.value)
}

/** 异动操作 */
function handleChangeAction({ item }: { item: { value: number } }) {
  if (!formData.value.id) {
    return
  }
  changeFormRef.value?.open(formData.value, item.value)
}

/** 更多操作 */
async function handleMoreAction({ item }: { item: { value: string } }) {
  if (item.value === 'quit') {
    openQuit()
    return
  }
  if (item.value === 'cancelQuit') {
    await handleCancelQuit()
    return
  }
  if (item.value === 'delete') {
    await handleDelete()
  }
}

/** 取消离职 */
async function handleCancelQuit() {
  if (!props.id) {
    return
  }
  let reason: string | undefined
  try {
    const result = await dialog.prompt({
      title: '取消离职',
      msg: `请输入取消员工“${formData.value.name}”离职安排的原因`,
      inputProps: { maxlength: 500, placeholder: '请输入取消原因' },
    })
    reason = String(result.value || '').trim()
  } catch {
    return
  }
  if (!reason) {
    toast.warning('取消原因不能为空')
    return
  }
  await cancelEmployeeQuit({
    employeeId: Number(props.id),
    reason,
  })
  toast.success('取消离职成功')
  await getDetail()
}

/** 删除员工 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除员工“${formData.value.name}”的档案吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteEmployee(Number(props.id))
    toast.success('删除成功')
    handleBack()
  } finally {
    deleting.value = false
  }
}

/** 生命周期操作成功 */
async function handleLifecycleSuccess() {
  await getDetail()
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
