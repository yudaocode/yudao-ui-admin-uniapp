/**
 * 百度地图 GL SDK 工具（仅 H5 使用，调用方须在 #ifdef H5 中引入）
 */

import type { MapCoordinate } from '@/utils/coordinate'

declare global {
  interface Window {
    BMapGL?: any
  }
}

const CALLBACK_NAME = '__BAIDU_MAP_LOAD_CALLBACK__' // SDK 加载完成的全局回调名
let loadPromise: Promise<void> | null = null // 加载中的 SDK Promise，失败后置空以便重试

/** 加载百度地图 GL SDK */
export function loadBaiduMapSdk(timeout = 10000): Promise<void> {
  if (window.BMapGL) {
    return Promise.resolve()
  }
  if (loadPromise) {
    return loadPromise
  }
  const mapKey = import.meta.env.VITE_BAIDU_MAP_KEY
  if (!mapKey) {
    return Promise.reject(new Error('百度地图 Key 未配置'))
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    let timeoutId: ReturnType<typeof setTimeout> | undefined // 加载超时定时器

    /** 只清理本次加载的监听和回调，避免旧 script 的回调或错误干扰后续重试 */
    function cleanup() {
      clearTimeout(timeoutId)
      script.removeEventListener('error', handleError)
      if (Reflect.get(window, CALLBACK_NAME) === handleLoad) {
        Reflect.deleteProperty(window, CALLBACK_NAME)
      }
    }

    /** 加载失败：移除 script 并允许重试 */
    function fail(message: string) {
      cleanup()
      script.remove()
      loadPromise = null
      reject(new Error(message))
    }

    /** SDK 加载完成回调 */
    function handleLoad() {
      cleanup()
      resolve()
    }

    /** script 加载错误 */
    function handleError() {
      fail('百度地图 SDK 加载失败')
    }

    timeoutId = setTimeout(() => fail('百度地图 SDK 加载超时'), timeout)
    Reflect.set(window, CALLBACK_NAME, handleLoad)
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${mapKey}&callback=${CALLBACK_NAME}`
    script.addEventListener('error', handleError)
    document.body.appendChild(script)
  })
  return loadPromise
}

/** 地图预览页面加载失败时发给父页面的消息类型 */
export const BAIDU_MAP_PREVIEW_ERROR = 'baidu-map-preview-error'

/**
 * 生成单点地图只读预览页面，作为 iframe 的 srcdoc 使用
 *
 * 页面独立加载 SDK 且从不调用 destroy；iframe 移除或重新导航时，由浏览器回收其中的脚本、定时器、Worker 与 WebGL 上下文
 * @returns 页面 HTML；Key 未配置或参数无效时返回空字符串
 */
export function buildBaiduMapPreviewHtml(point: MapCoordinate, zoom: number, timeout = 10000) {
  const mapKey = import.meta.env.VITE_BAIDU_MAP_KEY
  if (!mapKey || ![point.longitude, point.latitude, zoom].every(value => Number.isFinite(value))) {
    return ''
  }
  const sdkUrl = `https://api.map.baidu.com/api?v=1.0&amp;type=webgl&amp;ak=${encodeURIComponent(mapKey)}&amp;callback=initMap`
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<style>html,body,#map{width:100%;height:100%;margin:0;overflow:hidden}</style>',
    '</head><body><div id="map"></div><script>',
    'var loaded = false;',
    `function fail() { if (!loaded) parent.postMessage({ type: '${BAIDU_MAP_PREVIEW_ERROR}' }, '*'); }`,
    'function initMap() {',
    '  var map = new BMapGL.Map(\'map\');',
    '  map.disableDragging();',
    '  map.disableDoubleClickZoom();',
    '  map.disablePinchToZoom();',
    `  var point = new BMapGL.Point(${point.longitude}, ${point.latitude});`,
    '  map.addOverlay(new BMapGL.Marker(point));',
    `  map.centerAndZoom(point, ${zoom});`,
    '  loaded = true;',
    '}',
    `setTimeout(fail, ${timeout});`,
    `</script><script src="${sdkUrl}" onerror="fail()"></script>`,
    '</body></html>',
  ].join('\n')
}

/** 生成百度地图标注页外链（BD09 坐标，无需 Key） */
export function getBaiduMarkerUrl(point: MapCoordinate, title?: string) {
  const params = new URLSearchParams({
    location: `${point.latitude},${point.longitude}`,
    title: title || '位置',
    content: title || '',
    output: 'html',
    coord_type: 'bd09ll',
    src: 'webapp.yudao.admin',
  })
  return `https://api.map.baidu.com/marker?${params.toString()}`
}
