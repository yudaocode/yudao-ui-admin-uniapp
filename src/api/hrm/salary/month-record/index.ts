import type { PageParam, PageResult } from '@/http/types'
import type { SalaryOption, SalaryOptionValue } from '@/api/hrm/salary/config/option'
import { http } from '@/http/http'
import { useTokenStore, useUserStore } from '@/store'
import { getEnvBaseUrl } from '@/utils'
import { downloadApiFile } from '@/utils/download'

/** 月度工资表 */
export interface SalaryMonthRecord {
  id?: number // 月度工资表编号
  title?: string // 标题
  year?: number // 年份
  month?: number // 月份
  employeeCount?: number // 计薪人数
  startTime?: string // 计薪开始时间
  endTime?: string // 计薪结束时间
  expectedPaySalary?: number // 应发工资
  personalInsuranceAmount?: number // 个人社保
  personalProvidentFundAmount?: number // 个人公积金
  personalTax?: number // 个人所得税
  realPaySalary?: number // 实发工资
  corporateInsuranceAmount?: number // 公司社保
  corporateProvidentFundAmount?: number // 公司公积金
  status?: number // 工资表状态
  optionHeaders?: SalaryOption[] // 工资项表头
  createTime?: Date | string | number // 创建时间
}

/** 薪资核算就绪员工 */
export interface SalaryPayrollReadinessEmployee {
  employeeId?: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 职位名称
  entryStatus?: number // 入职状态
  status?: number // 员工状态
  entryTime?: Date | string | number // 入职时间
}

/** 薪资核算就绪状态 */
export interface SalaryPayrollReadiness {
  monthRecordId?: number // 月度工资表编号
  title?: string // 工资表标题
  year?: number // 年份
  month?: number // 月份
  startTime?: string // 计薪开始时间
  endTime?: string // 计薪结束时间
  socialSecurityYearMonth?: string // 社保年月
  payrollEmployeeCount?: number // 计薪人数
  salaryEmployeeCount?: number // 已定薪人数
  noSalaryEmployeeCount?: number // 未定薪人数
  noSalaryGroupEmployeeCount?: number // 未分配薪资组人数
  changeEmployeeCount?: number // 异动人数
  changeTypeCountMap?: Record<number, number> // 异动类型数量
  noSalaryEmployees?: SalaryPayrollReadinessEmployee[] // 未定薪员工
  noSalaryGroupEmployees?: SalaryPayrollReadinessEmployee[] // 未分配薪资组员工
}

/** 带导入文件核算请求 */
export interface SalaryMonthComputeImportReq {
  id: number // 工资表编号
  syncInsuranceData: boolean // 是否同步社保数据
  syncAttendanceData: boolean // 是否同步考勤数据
  attendanceFilePath?: string // 考勤数据本地路径
  cumulativeTaxFilePath?: string // 上月个税累计本地路径
  additionalDeductionFilePath?: string // 专项附加扣除本地路径
}

/** 创建下月工资表 */
export function createNextSalaryMonthRecord() {
  return http.post<number>('/hrm/salary/month-record/create-next')
}

/** 核算月度工资表 */
export function computeSalaryMonthRecord(id: number) {
  return http.post<boolean>(`/hrm/salary/month-record/compute?id=${id}`)
}

/** 删除月度工资表 */
export function deleteSalaryMonthRecord(id: number) {
  return http.delete<boolean>(`/hrm/salary/month-record/delete?id=${id}`)
}

/** 获得月度工资表分页 */
export function getSalaryMonthRecordPage(params: PageParam) {
  return http.get<PageResult<SalaryMonthRecord>>('/hrm/salary/month-record/page', params)
}

/** 获得月度工资表详情 */
export function getSalaryMonthRecord(id: number) {
  return http.get<SalaryMonthRecord>(`/hrm/salary/month-record/get?id=${id}`)
}

/** 获得最近月度工资表 */
export function getLastSalaryMonthRecord() {
  return http.get<SalaryMonthRecord>('/hrm/salary/month-record/last')
}

/** 获得薪资核算就绪状态 */
export function getSalaryPayrollReadiness(monthRecordId?: number) {
  return http.get<SalaryPayrollReadiness>('/hrm/salary/month-record/payroll-readiness', {
    monthRecordId,
  })
}

/** 获得月度工资薪资项汇总 */
export function getSalaryMonthOptionSummary(params: Record<string, any>) {
  return http.get<SalaryOptionValue[]>('/hrm/salary/month-record/option-summary', params)
}

/** 下载考勤导入模板 */
export function downloadSalaryAttendanceImportTemplate(monthRecordId?: number) {
  return downloadApiFile(
    '/hrm/salary/month-record/get-attendance-import-template',
    { monthRecordId },
    '月度工资考勤导入模板.xls',
  )
}

/** 下载上月个税累计导入模板 */
export function downloadSalaryCumulativeTaxImportTemplate(monthRecordId?: number) {
  return downloadApiFile(
    '/hrm/salary/month-record/get-cumulative-tax-import-template',
    { monthRecordId },
    '月度工资上月个税累计导入模板.xls',
  )
}

/** 下载专项附加扣除导入模板 */
export function downloadSalaryAdditionalDeductionImportTemplate(monthRecordId?: number) {
  return downloadApiFile(
    '/hrm/salary/month-record/get-additional-deduction-import-template',
    { monthRecordId },
    '月度工资专项附加扣除导入模板.xls',
  )
}

/** 构造核算导入接口地址 */
function buildSalaryComputeImportUrl() {
  const path = '/hrm/salary/month-record/compute-import'
  // #ifdef H5
  if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
    return `${import.meta.env.VITE_APP_PROXY_PREFIX}${path}`
  }
  // #endif
  return `${getEnvBaseUrl()}${path}`
}

/** 带导入文件核算月度工资表 */
export function computeSalaryMonthRecordWithImport(data: SalaryMonthComputeImportReq) {
  const token = useTokenStore().updateNowTime().validToken
  const tenantId = useUserStore().tenantId
  const header = {
    'Accept': '*/*',
    'tenant-id': String(tenantId ?? ''),
    'Authorization': token ? `Bearer ${token}` : '',
  }
  const url = buildSalaryComputeImportUrl()
  const filePath = data.attendanceFilePath
    || data.cumulativeTaxFilePath
    || data.additionalDeductionFilePath

  // 有本地文件时走 uni.uploadFile；仅同步开关时走 FormData
  if (filePath) {
    return new Promise<boolean>((resolve, reject) => {
      uni.uploadFile({
        url,
        filePath,
        name: data.attendanceFilePath
          ? 'attendanceFile'
          : data.cumulativeTaxFilePath
            ? 'cumulativeTaxFile'
            : 'additionalDeductionFile',
        header,
        formData: {
          id: String(data.id),
          syncInsuranceData: String(data.syncInsuranceData),
          syncAttendanceData: String(data.syncAttendanceData),
        },
        success: (res) => {
          try {
            const result = JSON.parse(res.data)
            if (result.code === 0 || result.code === 200) {
              resolve(true)
              return
            }
            uni.showToast({ icon: 'none', title: result.msg || result.message || '核算失败' })
            reject(result)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject,
      })
    })
  }

  return new Promise<boolean>((resolve, reject) => {
    const formData = new FormData()
    formData.append('id', String(data.id))
    formData.append('syncInsuranceData', String(data.syncInsuranceData))
    formData.append('syncAttendanceData', String(data.syncAttendanceData))
    fetch(url, {
      method: 'POST',
      headers: header as HeadersInit,
      body: formData,
    })
      .then(async (response) => {
        const result = await response.json()
        if (result.code === 0 || result.code === 200) {
          resolve(true)
          return
        }
        uni.showToast({ icon: 'none', title: result.msg || result.message || '核算失败' })
        reject(result)
      })
      .catch(reject)
  })
}
