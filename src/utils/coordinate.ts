/**
 * 地图坐标系转换工具
 *
 * WGS84：GPS 原始坐标；GCJ02：国测局坐标（微信、小程序原生地图）；BD09：百度地图坐标
 * 中国大陆范围外百度、微信均使用 WGS84，坐标保持不变
 * 参数统一先经度、后纬度
 */

/** 经纬度坐标 */
export interface MapCoordinate {
  latitude: number // 纬度
  longitude: number // 经度
}

/** 坐标系类型：GCJ02 国测局坐标；BD09 百度坐标 */
export type MapCoordType = 'bd09' | 'gcj02'

/** 原生 map 组件标记图标（iconPath 必填；水滴尖端位于底部中点，与默认 anchor 对齐） */
export const NATIVE_MAP_MARKER = {
  iconPath: '/static/images/map-marker.png',
  width: 24,
  height: 32,
}

const X_PI = (Math.PI * 3000) / 180
const KRASOVSKY_A = 6378245 // 克拉索夫斯基椭球长半轴
const KRASOVSKY_EE = 0.006693421622965943 // 克拉索夫斯基椭球第一偏心率平方

/** WGS84 转 GCJ02，中国范围外不偏移 */
export function wgs84ToGcj02(longitude: number, latitude: number): MapCoordinate {
  if (isOutsideChina(longitude, latitude)) {
    return { longitude, latitude }
  }
  const latitudeOffset = transformLatitude(longitude - 105, latitude - 35)
  const longitudeOffset = transformLongitude(longitude - 105, latitude - 35)
  const radianLatitude = (latitude / 180) * Math.PI
  const magic = 1 - KRASOVSKY_EE * Math.sin(radianLatitude) ** 2
  const sqrtMagic = Math.sqrt(magic)
  return {
    longitude:
      longitude
      + (longitudeOffset * 180)
      / ((KRASOVSKY_A / sqrtMagic) * Math.cos(radianLatitude) * Math.PI),
    latitude:
      latitude
      + (latitudeOffset * 180)
      / (((KRASOVSKY_A * (1 - KRASOVSKY_EE)) / (magic * sqrtMagic)) * Math.PI),
  }
}

/** GCJ02 转 BD09，中国大陆范围外不偏移 */
export function gcj02ToBd09(longitude: number, latitude: number): MapCoordinate {
  if (isOutsideChina(longitude, latitude)) {
    return { longitude, latitude }
  }
  const z = Math.hypot(longitude, latitude) + 2e-5 * Math.sin(latitude * X_PI)
  const theta = Math.atan2(latitude, longitude) + 3e-6 * Math.cos(longitude * X_PI)
  return {
    longitude: z * Math.cos(theta) + 0.0065,
    latitude: z * Math.sin(theta) + 0.006,
  }
}

/** BD09 转 GCJ02：先按公式近似反算，再用正算结果迭代校正；中国大陆范围外不偏移 */
export function bd09ToGcj02(longitude: number, latitude: number): MapCoordinate {
  if (isOutsideChina(longitude, latitude)) {
    return { longitude, latitude }
  }
  const x = longitude - 0.0065
  const y = latitude - 0.006
  const z = Math.hypot(x, y) - 2e-5 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 3e-6 * Math.cos(x * X_PI)
  let result: MapCoordinate = {
    longitude: z * Math.cos(theta),
    latitude: z * Math.sin(theta),
  }
  for (let i = 0; i < 3; i++) {
    const bd09 = gcj02ToBd09(result.longitude, result.latitude)
    result = {
      longitude: result.longitude + longitude - bd09.longitude,
      latitude: result.latitude + latitude - bd09.latitude,
    }
  }
  return result
}

/** 判断坐标是否位于中国大陆转换范围外 */
function isOutsideChina(longitude: number, latitude: number) {
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
