<template>
  <view>
    <wd-cell-group border title="岗位信息">
      <wd-cell title="工号" :value="employee.jobNumber || '-'" />
      <wd-cell title="部门" :value="employee.deptName || '-'" />
      <wd-cell title="岗位" :value="employee.postName || '-'" />
      <wd-cell title="岗位职级" :value="employee.postLevel || '-'" />
      <wd-cell title="直属上级" :value="employee.leaderEmployeeName || '-'" />
      <wd-cell title="入职状态">
        <dict-tag
          v-if="employee.entryStatus != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
          :value="employee.entryStatus"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="员工状态">
        <dict-tag
          v-if="employee.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="employee.status"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="聘用形式">
        <dict-tag
          v-if="employee.type != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
          :value="employee.type"
        />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="入职时间" :value="formatDateTime(employee.entryTime) || '-'" />
      <wd-cell title="转正时间" :value="formatDateTime(employee.regularTime) || '-'" />
      <wd-cell
        title="试用期"
        :value="employee.probation != null ? `${employee.probation} 个月` : '-'"
      />
      <wd-cell
        title="司龄"
        :value="employee.companyAge != null ? `${employee.companyAge} 年` : '-'"
      />
      <wd-cell title="工作城市" :value="employee.workCity || '-'" />
      <wd-cell title="工作地点" :value="employee.workAddress || '-'" />
      <wd-cell title="详细地址" :value="employee.workDetailAddress || '-'" />
    </wd-cell-group>

    <wd-cell-group v-if="quitInfo?.id" border title="离职信息">
      <wd-cell title="计划离职时间" :value="formatDateTime(quitInfo.planQuitTime) || '-'" />
      <wd-cell title="申请离职日期" :value="formatHrmDate(quitInfo.applyQuitTime)" />
      <wd-cell title="薪资结算日期" :value="formatHrmDate(quitInfo.salarySettlementTime)" />
      <wd-cell title="离职类型" :value="formatEmployeeQuitType(quitInfo.type)" />
      <wd-cell title="离职原因" :value="formatEmployeeQuitReason(quitInfo.reason)" />
      <wd-cell title="备注" :value="quitInfo.remark || '-'" />
    </wd-cell-group>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeQuitInfo } from '@/api/hrm/employee/quit-info'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import { onMounted, ref } from 'vue'
import { getPortalEmployeeQuitInfo } from '@/api/hrm/portal/employee/quit-info'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import {
  formatEmployeeQuitReason,
  formatEmployeeQuitType,
  formatHrmDate,
} from '@/pages-hrm/utils/format'

defineProps<{
  employee: PortalEmployee
}>()

const quitInfo = ref<EmployeeQuitInfo>() // 离职信息

/** 获得当前员工离职信息 */
async function getQuitInfo() {
  quitInfo.value = await getPortalEmployeeQuitInfo()
}

defineExpose({ getQuitInfo })

/** 初始化 */
onMounted(() => {
  getQuitInfo()
})
</script>
