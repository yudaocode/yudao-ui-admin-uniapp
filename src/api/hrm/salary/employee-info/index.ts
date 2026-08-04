import type { PageParam, PageResult } from '@/http/types'
import type { SalaryOptionValue } from '@/api/hrm/salary/config/option'
import { http } from '@/http/http'

/** 员工薪资档案 */
export interface SalaryEmployeeInfo {
  id?: number // 员工薪资信息编号
  employeeId?: number // 员工编号
  employeeName?: string // 员工姓名
  jobNumber?: string // 工号
  mobile?: string // 手机号
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  postName?: string // 岗位名称
  entryStatus?: number // 入职状态
  status?: number // 员工状态
  entryTime?: Date | string | number // 入职时间
  regularTime?: Date | string | number // 转正时间
  changeReason?: number // 调薪原因
  effectTime?: number // 调薪生效时间
  changeType?: number // 调薪类型
  probationSalary?: number // 试用期工资
  regularSalary?: number // 转正工资
  remark?: string // 备注
  salaryOptions?: SalaryOptionValue[] // 转正工资项
  probationSalaryOptions?: SalaryOptionValue[] // 试用期工资项
  createTime?: Date | string | number // 创建时间
}

/** 员工薪资档案更新请求 */
export interface SalaryEmployeeInfoUpdateReq {
  id?: number // 调薪记录编号
  employeeId?: number // 员工编号
  recordType?: number // 记录类型
  changeReason?: number // 调薪原因
  effectTime?: number // 生效时间
  remark?: string // 备注
  salaryOptions?: SalaryOptionValue[] // 转正工资项
  probationSalaryOptions?: SalaryOptionValue[] // 试用期工资项
}

/** 员工薪资档案批量更新请求 */
export interface SalaryEmployeeInfoUpdateListReq {
  employeeIds: number[] // 员工编号数组
  deptIds: number[] // 部门编号数组
  type: number // 调整方式
  changeReason?: number // 调薪原因
  effectTime?: number // 生效时间
  remark?: string // 备注
  salaryOptions: SalaryOptionValue[] // 调整工资项
}

/** 员工薪资档案批量更新响应 */
export interface SalaryEmployeeInfoUpdateListResp {
  successEmployeeIds: number[] // 成功员工编号数组
  failureEmployeeReasons: Record<number, string> // 失败员工及原因
}

/** 员工状态数量 */
export interface SalaryEmployeeStatusCount {
  status: number // 状态页签
  count: number // 数量
}

/** 获得员工薪资档案分页 */
export function getSalaryEmployeeInfoPage(params: PageParam) {
  return http.get<PageResult<SalaryEmployeeInfo>>('/hrm/salary/employee-info/page', params)
}

/** 获得员工薪资档案状态数量 */
export function getSalaryEmployeeInfoStatusCount(params: Record<string, any>) {
  return http.get<SalaryEmployeeStatusCount[]>('/hrm/salary/employee-info/status-count', params)
}

/** 获得员工薪资档案 */
export function getSalaryEmployeeInfo(employeeId: number) {
  return http.get<SalaryEmployeeInfo>('/hrm/salary/employee-info/get', { employeeId })
}

/** 获得最早调薪生效日期 */
export function getSalaryAdjustmentMinEffectDate() {
  return http.get<string>('/hrm/salary/employee-info/get-adjustment-min-effect-date')
}

/** 修改员工薪资档案 */
export function updateSalaryEmployeeInfo(data: SalaryEmployeeInfoUpdateReq) {
  return http.put<number>('/hrm/salary/employee-info/update', data)
}

/** 批量更新员工薪资档案 */
export function updateSalaryEmployeeInfoList(data: SalaryEmployeeInfoUpdateListReq) {
  return http.put<SalaryEmployeeInfoUpdateListResp>('/hrm/salary/employee-info/update-list', data)
}
