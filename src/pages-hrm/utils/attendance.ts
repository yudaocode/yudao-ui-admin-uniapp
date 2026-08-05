import type {
  AttendancePoint,
  AttendanceWifi,
} from '@/api/hrm/attendance/group'
import type { AttendanceDailyDetail } from '@/api/hrm/attendance/statistics'
import { computed, ref } from 'vue'
import { isRecord } from '@/utils/is'

export type AttendanceClockDeviceState
  = | 'disabled'
    | 'loading'
    | 'ready'
    | 'unsupported'
    | 'failed'

export type HrmAttendanceDayState = 'normal' | 'abnormal' | 'rest'

type AttendanceClockLocation = Pick<AttendancePoint, 'address'>
  & Required<Pick<AttendancePoint, 'latitude' | 'longitude'>>

/** 获得每日考勤状态 */
export function getHrmAttendanceDayState(
  detail?: Pick<
    AttendanceDailyDetail,
    | 'scheduled'
    | 'lateCount'
    | 'earlyCount'
    | 'misscardCount'
    | 'absenteeism'
    | 'clockList'
  >,
): HrmAttendanceDayState | undefined {
  if (!detail) {
    return undefined
  }
  if (detail.scheduled === false) {
    return 'rest'
  }
  if (
    (detail.lateCount || 0) > 0
    || (detail.earlyCount || 0) > 0
    || (detail.misscardCount || 0) > 0
    || detail.absenteeism === true
  ) {
    return 'abnormal'
  }
  return detail.clockList?.length ? 'normal' : undefined
}

/** 员工端考勤打卡设备能力 */
export function useAttendanceClockDevice() {
  const locationState = ref<AttendanceClockDeviceState>('disabled') // 定位状态
  const location = ref<AttendanceClockLocation>() // 当前定位
  const locationError = ref('') // 定位失败原因
  const wifiState = ref<AttendanceClockDeviceState>('disabled') // WiFi 状态
  const wifi = ref<AttendanceWifi>() // 当前 WiFi
  const wifiError = ref('') // WiFi 失败原因

  const locating = computed(() => locationState.value === 'loading') // 是否正在定位
  const wifiLoading = computed(() => wifiState.value === 'loading') // 是否正在读取 WiFi
  const locationText = computed(() => {
    if (locationState.value === 'loading') {
      return '正在获取位置…'
    }
    if (locationState.value === 'failed') {
      return locationError.value || '定位失败，请检查定位权限后重试'
    }
    if (locationState.value !== 'ready' || !location.value) {
      return '尚未获取位置'
    }
    return (
      location.value.address
      || `${location.value.latitude.toFixed(5)}, ${location.value.longitude.toFixed(5)}`
    )
  })
  const wifiText = computed(() => {
    if (wifiState.value === 'loading') {
      return '正在读取当前 WiFi…'
    }
    if (wifiState.value === 'unsupported') {
      return '当前端不支持读取 WiFi 信息'
    }
    if (wifiState.value === 'failed') {
      return wifiError.value || 'WiFi 信息读取失败，请检查系统 WiFi 与定位权限'
    }
    if (wifiState.value !== 'ready' || !wifi.value) {
      return '尚未读取当前 WiFi'
    }
    return `当前 WiFi：${wifi.value.ssid}`
  })

  /** 重置定位状态 */
  function resetLocation() {
    locationState.value = 'disabled'
    location.value = undefined
    locationError.value = ''
  }

  /** 重置 WiFi 状态 */
  function resetWifi() {
    wifiState.value = 'disabled'
    wifi.value = undefined
    wifiError.value = ''
  }

  /** 刷新定位 */
  async function refreshLocation(): Promise<boolean> {
    locationState.value = 'loading'
    locationError.value = ''
    try {
      const result = await new Promise<UniApp.GetLocationSuccess>(
        (resolve, reject) => {
          uni.getLocation({
            type: 'wgs84',
            isHighAccuracy: true,
            highAccuracyExpireTime: 5000,
            success: resolve,
            fail: reject,
          })
        },
      )
      const coordinates = convertWgs84ToGcj02(
        result.latitude,
        result.longitude,
      )
      location.value = {
        address: getLocationAddress(result.address),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }
      locationState.value = 'ready'
      return true
    } catch (error) {
      location.value = undefined
      locationError.value = getLocationErrorMessage(error)
      locationState.value = 'failed'
      return false
    }
  }

  /** 刷新当前 WiFi */
  async function refreshWifi(): Promise<boolean> {
    if (
      typeof uni.startWifi !== 'function'
      || typeof uni.getConnectedWifi !== 'function'
    ) {
      wifiState.value = 'unsupported'
      wifi.value = undefined
      wifiError.value = ''
      return false
    }

    wifiState.value = 'loading'
    wifiError.value = ''
    try {
      await new Promise<void>((resolve, reject) => {
        uni.startWifi({ success: () => resolve(), fail: reject })
      })
      const result
        = await new Promise<UniNamespace.GetConnectedWifiSuccessCallbackResult>(
          (resolve, reject) => {
            uni.getConnectedWifi({
              partialInfo: false,
              success: resolve,
              fail: reject,
            })
          },
        )
      if (!result.wifi?.SSID) {
        throw new Error('当前设备未连接 WiFi')
      }
      wifi.value = {
        ssid: result.wifi.SSID,
        mac: result.wifi.BSSID || undefined,
      }
      wifiState.value = 'ready'
      return true
    } catch (error) {
      wifi.value = undefined
      wifiError.value = getWifiErrorMessage(error)
      wifiState.value = isWifiUnsupportedError(error)
        ? 'unsupported'
        : 'failed'
      return false
    }
  }

  /** 停止 WiFi 模块 */
  function stopWifi() {
    if (typeof uni.stopWifi === 'function') {
      uni.stopWifi({ fail: () => {} })
    }
  }

  return {
    locationState,
    location,
    locationText,
    locating,
    wifiState,
    wifi,
    wifiText,
    wifiLoading,
    resetLocation,
    resetWifi,
    refreshLocation,
    refreshWifi,
    stopWifi,
  }
}

/** 格式化定位地址 */
function getLocationAddress(address: unknown): string | undefined {
  if (typeof address === 'string') {
    return address || undefined
  }
  if (!isRecord(address)) {
    return undefined
  }
  const parts = ['poiName', 'street', 'streetNum']
    .map(key => address[key])
    .filter(
      (value): value is string => typeof value === 'string' && Boolean(value),
    )
  return parts.join('') || undefined
}

/** 获得定位错误文案 */
function getLocationErrorMessage(error: unknown) {
  const message = getRawDeviceErrorMessage(error)
  if (/denied|auth deny|permission/i.test(message)) {
    return '定位权限未开启，请在系统设置中授权后重试'
  }
  if (/timeout/i.test(message)) {
    return '定位超时，请到网络和定位信号良好的位置后重试'
  }
  return '定位失败，请检查系统定位服务后重试'
}

/** 获得 WiFi 错误文案 */
function getWifiErrorMessage(error: unknown) {
  const message = getRawDeviceErrorMessage(error)
  if (/12005|not turned on/i.test(message)) {
    return '系统 WiFi 未开启，请开启后重试'
  }
  if (/12000|not init/i.test(message)) {
    return 'WiFi 模块初始化失败，请重试'
  }
  if (/denied|auth deny|permission|12010/i.test(message)) {
    return '无法读取当前 WiFi，请检查定位权限后重试'
  }
  return 'WiFi 信息读取失败，请检查系统 WiFi 与定位权限'
}

/** 判断 WiFi 能力是否不受支持 */
function isWifiUnsupportedError(error: unknown) {
  return /12001|not support/i.test(getRawDeviceErrorMessage(error))
}

/** 获得设备接口原始错误 */
function getRawDeviceErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (isRecord(error) && typeof error.errMsg === 'string' && error.errMsg) {
    return error.errMsg
  }
  return ''
}

/** 将系统 WGS84 坐标转换为考勤配置使用的 GCJ02 坐标 */
function convertWgs84ToGcj02(latitude: number, longitude: number) {
  if (isOutsideChina(latitude, longitude)) {
    return { latitude, longitude }
  }
  const latitudeOffset = transformLatitude(longitude - 105, latitude - 35)
  const longitudeOffset = transformLongitude(longitude - 105, latitude - 35)
  const radianLatitude = (latitude / 180) * Math.PI
  const magic = 1 - 0.006693421622965943 * Math.sin(radianLatitude) ** 2
  const sqrtMagic = Math.sqrt(magic)
  return {
    latitude:
      latitude
      + (latitudeOffset * 180)
      / ((6335552.717000426 / (magic * sqrtMagic)) * Math.PI),
    longitude:
      longitude
      + (longitudeOffset * 180)
      / ((6378245 / sqrtMagic) * Math.cos(radianLatitude) * Math.PI),
  }
}

/** 判断坐标是否位于中国大陆转换范围外 */
function isOutsideChina(latitude: number, longitude: number) {
  return (
    longitude < 72.004
    || longitude > 137.8347
    || latitude < 0.8293
    || latitude > 55.8271
  )
}

/** 计算 GCJ02 纬度偏移 */
function transformLatitude(longitude: number, latitude: number) {
  let result
    = -100
      + 2 * longitude
      + 3 * latitude
      + 0.2 * latitude ** 2
      + 0.1 * longitude * latitude
      + 0.2 * Math.sqrt(Math.abs(longitude))
  result
    += ((20 * Math.sin(6 * longitude * Math.PI)
      + 20 * Math.sin(2 * longitude * Math.PI))
    * 2)
  / 3
  result
    += ((20 * Math.sin(latitude * Math.PI)
      + 40 * Math.sin((latitude / 3) * Math.PI))
    * 2)
  / 3
  result
    += ((160 * Math.sin((latitude / 12) * Math.PI)
      + 320 * Math.sin((latitude * Math.PI) / 30))
    * 2)
  / 3
  return result
}

/** 计算 GCJ02 经度偏移 */
function transformLongitude(longitude: number, latitude: number) {
  let result
    = 300
      + longitude
      + 2 * latitude
      + 0.1 * longitude ** 2
      + 0.1 * longitude * latitude
      + 0.1 * Math.sqrt(Math.abs(longitude))
  result
    += ((20 * Math.sin(6 * longitude * Math.PI)
      + 20 * Math.sin(2 * longitude * Math.PI))
    * 2)
  / 3
  result
    += ((20 * Math.sin(longitude * Math.PI)
      + 40 * Math.sin((longitude / 3) * Math.PI))
    * 2)
  / 3
  result
    += ((150 * Math.sin((longitude / 12) * Math.PI)
      + 300 * Math.sin((longitude / 30) * Math.PI))
    * 2)
  / 3
  return result
}
