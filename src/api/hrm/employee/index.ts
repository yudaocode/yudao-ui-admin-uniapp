import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'

/** 员工档案 */
export interface Employee {
  id?: number // 员工编号
  name: string // 员工姓名
  jobNumber?: string // 工号
  userId?: number // 后台用户编号
  userNickname?: string // 后台用户昵称
  mobile?: string // 手机号
  country?: string // 国家或地区
  nation?: string // 民族
  idType?: number // 证件类型
  idNumber?: string // 证件号码
  sex?: number // 性别
  email?: string // 邮箱
  nativePlace?: string // 籍贯
  birthday?: Date | string | number // 出生时间
  age?: number // 年龄
  address?: string // 户籍地址
  highestEducation?: number // 最高学历
  deptId?: number // 部门编号
  deptName?: string // 部门名称
  leaderEmployeeId?: number // 直属上级员工编号
  leaderEmployeeName?: string // 直属上级员工姓名
  entryStatus?: number // 入职状态
  status?: number // 员工状态
  type?: number // 聘用形式
  entryTime?: Date | string | number // 入职时间
  probation?: number // 试用期，单位月
  regularTime?: Date | string | number // 转正时间
  leaveTime?: Date | string | number // 离职时间
  postName?: string // 职位名称
  postLevel?: string // 岗位职级
  workCity?: string // 工作城市
  workAddress?: string // 工作地点
  workDetailAddress?: string // 工作详细地址
  channelId?: number // 招聘渠道编号
  channelName?: string // 招聘渠道名称
  companyAgeStartTime?: Date | string | number // 司龄开始时间
  companyAge?: number // 司龄，单位年
  candidateId?: number // 招聘候选人编号
  salaryCardNumber?: string // 银行卡号
  salaryCardAreaId?: number // 开户地区编号
  salaryCardAreaName?: string // 开户地区名称
  salaryCardBankName?: string // 银行名称
  salaryCardBankBranchName?: string // 开户支行名称
  socialSecurityNumber?: string // 个人社保账号
  accumulationFundNumber?: string // 个人公积金账号
  remark?: string // 备注
  createTime?: Date | string | number // 创建时间
}

/** 员工状态数量 */
export interface EmployeeStatusCount {
  status: number // 状态页签
  count: number // 数量
}

/** 员工部门统计 */
export interface EmployeeDeptStatistics {
  deptId: number // 部门编号
  activeCount: number // 在职员工人数
  fullTimeCount: number // 全职员工人数
  nonFullTimeCount: number // 非全职员工人数
}

/** 员工再入职请求 */
export interface EmployeeRehireReq extends Employee {
  employeeId?: number // 员工编号
}

/** 员工转正请求 */
export interface EmployeeRegularReq {
  employeeId?: number // 员工编号
  reason?: number // 异动原因
  newDeptId?: number // 新部门编号
  newPostName?: string // 新岗位名称
  newPostLevel?: string // 新职级
  newWorkAddress?: string // 新工作地点
  newLeaderEmployeeId?: number // 新直属上级员工编号
  effectTime?: number // 生效时间
  remark?: string // 备注
}

/** 员工调岗 / 晋升 / 降级请求 */
export interface EmployeeTransferReq {
  employeeId?: number // 员工编号
  reason?: number // 异动原因
  newDeptId?: number // 新部门编号
  newPostName?: string // 新职位
  newPostLevel?: string // 新岗位职级
  newWorkAddress?: string // 新工作地点
  newLeaderEmployeeId?: number // 新直属上级员工编号
  effectTime?: number // 生效时间
  remark?: string // 备注
}

/** 员工转为全职请求 */
export interface EmployeeConvertToFullTimeReq {
  employeeId?: number // 员工编号
  reason?: number // 异动原因
  probation?: number // 试用期，单位月
  newDeptId?: number // 新部门编号
  newPostName?: string // 新岗位名称
  newPostLevel?: string // 新职级
  newWorkAddress?: string // 新工作地点
  newLeaderEmployeeId?: number // 新直属上级员工编号
  effectTime?: number // 生效时间
  remark?: string // 备注
}

/** 员工离职请求 */
export interface EmployeeQuitReq {
  employeeId?: number // 员工编号
  planQuitTime?: number // 计划离职时间
  applyQuitTime?: number // 申请离职时间
  salarySettlementTime?: number // 薪资结算时间
  type?: number // 离职类型
  reason?: number // 离职原因
  remark?: string // 备注
}

/** 员工取消离职请求 */
export interface EmployeeCancelQuitReq {
  employeeId: number // 员工编号
  reason: string // 取消原因
}

/** 查询员工分页 */
export function getEmployeePage(params: PageParam) {
  return http.get<PageResult<Employee>>('/hrm/employee/page', params)
}

/** 查询员工档案详情 */
export function getEmployee(id: number) {
  return http.get<Employee>(`/hrm/employee/get?id=${id}`)
}

/** 查询员工精简分页（选择器用） */
export function getEmployeeSimplePage(params: PageParam) {
  return http.get<PageResult<Employee>>('/hrm/employee/simple-page', params)
}

/** 查询指定员工精简列表（回显用） */
export function getEmployeeSimpleList(ids: number[]) {
  return http.get<Employee[]>('/hrm/employee/simple-list', { ids: ids.join(',') })
}

/** 查询员工状态数量 */
export function getEmployeeStatusCount(params: Record<string, any>) {
  return http.get<EmployeeStatusCount[]>('/hrm/employee/status-count', params)
}

/** 查询员工部门统计 */
export function getEmployeeDeptStatistics() {
  return http.get<EmployeeDeptStatistics[]>('/hrm/employee/dept-statistics')
}

/** 新增员工档案 */
export function createEmployee(data: Employee) {
  return http.post<number>('/hrm/employee/create', data)
}

/** 修改员工档案 */
export function updateEmployee(data: Employee) {
  return http.put<boolean>('/hrm/employee/update', data)
}

/** 确认员工入职 */
export function confirmEmployeeEntry(data: Employee) {
  return http.put<boolean>('/hrm/employee/confirm-entry', data)
}

/** 办理员工再入职 */
export function rehireEmployee(data: EmployeeRehireReq) {
  return http.post<boolean>('/hrm/employee/rehire', data)
}

/** 办理员工转正 */
export function regularEmployee(data: EmployeeRegularReq) {
  return http.post<boolean>('/hrm/employee/regular', data)
}

/** 办理员工调岗 */
export function transferEmployee(data: EmployeeTransferReq) {
  return http.post<boolean>('/hrm/employee/transfer', data)
}

/** 办理员工晋升 */
export function promoteEmployee(data: EmployeeTransferReq) {
  return http.post<boolean>('/hrm/employee/promote', data)
}

/** 办理员工降级 */
export function demoteEmployee(data: EmployeeTransferReq) {
  return http.post<boolean>('/hrm/employee/demote', data)
}

/** 办理员工转为全职 */
export function convertEmployeeToFullTime(data: EmployeeConvertToFullTimeReq) {
  return http.post<boolean>('/hrm/employee/convert-to-full-time', data)
}

/** 办理员工离职 */
export function quitEmployee(data: EmployeeQuitReq) {
  return http.post<boolean>('/hrm/employee/quit', data)
}

/** 取消员工离职 */
export function cancelEmployeeQuit(data: EmployeeCancelQuitReq) {
  return http.put<boolean>('/hrm/employee/cancel-quit', data)
}

/** 删除员工档案 */
export function deleteEmployee(id: number) {
  return http.delete<boolean>(`/hrm/employee/delete?id=${id}`)
}
