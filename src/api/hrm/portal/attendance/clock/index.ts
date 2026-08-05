import type { AttendanceClock } from '@/api/hrm/attendance/clock'
import { http } from '@/http/http'

/** 员工端打卡地点 */
export interface PortalAttendanceClockPoint {
  name?: string // 地点名称
  address?: string // 定位地址
  latitude?: number // 纬度
  longitude?: number // 经度
  radius?: number // 有效半径（米）
}

/** 员工端打卡 WiFi */
export interface PortalAttendanceClockWifi {
  ssid?: string // WiFi 名称
  mac?: string // MAC 地址
}

/** 下一次打卡动作 */
export interface PortalAttendanceNextClock {
  type?: number // 打卡类型
  stage?: number // 打卡阶段
  buttonStatus?: number // 按钮状态
  attendanceTime?: string // 应打卡时间
}

/** 当日打卡时间线 */
export interface PortalAttendanceClockTimelineItem {
  type?: number // 打卡类型
  attendanceTime?: string // 应打卡时间
  clockTime?: string // 实际打卡时间
  status?: number // 打卡状态
  missCard?: boolean // 是否缺卡
  address?: string // 打卡地址
}

/** 员工端打卡详情 */
export interface PortalAttendanceClockDetail {
  groupName?: string // 考勤组名称
  openPointCard?: boolean // 是否启用定位打卡
  openWifiCard?: boolean // 是否启用 WiFi 打卡
  attendanceDate?: string // 班次所属考勤日
  shiftTitle?: string // 班次标题
  restDay?: boolean // 是否休息日
  onDutyAttendanceTime?: string // 上班应打卡时间
  offDutyAttendanceTime?: string // 下班应打卡时间
  points?: PortalAttendanceClockPoint[] // 打卡地点列表
  wifis?: PortalAttendanceClockWifi[] // WiFi 列表
  nextClock?: PortalAttendanceNextClock // 下一次打卡动作
  timeline?: PortalAttendanceClockTimelineItem[] // 当日打卡时间线
}

/** 员工端手机打卡请求 */
export interface PortalAttendanceClockCreateReq {
  address?: string // 打卡地址
  longitude?: number // 经度
  latitude?: number // 纬度
  ssid?: string // WiFi 名称
  mac?: string // WiFi MAC 地址
}

/** 获得我的打卡详情 */
export function getMyAttendanceClockDetail() {
  return http.get<PortalAttendanceClockDetail>('/hrm/portal/attendance/clock/get-detail')
}

/** 手机端打卡 */
export function createMyAttendanceClock(data: PortalAttendanceClockCreateReq) {
  return http.post<number>('/hrm/portal/attendance/clock/create', data)
}

/** 获得我的考勤记录列表 */
export function getMyAttendanceClockList(params?: { year?: number, month?: number }) {
  return http.get<AttendanceClock[]>('/hrm/portal/attendance/clock/list', params)
}
