/** Android 通话权限申请结果 */
interface AndroidPermissionResult {
  granted: string[]
  deniedPresent: string[]
  deniedAlways: string[]
}

/** 申请单个小程序授权；已拒绝过时微信不再弹窗，直接失败 */
function authorizeScope(scope: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.authorize({
      scope,
      success: () => resolve(true),
      fail: () => resolve(false),
    })
  })
}

/**
 * 在用户发起 / 接听通话后申请系统权限
 *
 * Android 系统 WebView 采集前需宿主已获授权；iOS 由 WKWebView 首次采集时弹出系统授权；
 * 微信小程序 live-pusher 需提前获得录音（及摄像头）授权
 */
export function requestRtcPermissions(camera: boolean): Promise<boolean> {
  // #ifdef APP-PLUS
  if (plus.os.name !== 'Android') {
    return Promise.resolve(true)
  }
  const permissions = camera
    ? ['android.permission.RECORD_AUDIO', 'android.permission.CAMERA']
    : ['android.permission.RECORD_AUDIO']
  return new Promise((resolve) => {
    plus.android.requestPermissions(
      permissions,
      (result: AndroidPermissionResult) => resolve(result.deniedPresent.length === 0 && result.deniedAlways.length === 0),
      () => resolve(false),
    )
  })
  // #endif
  // #ifdef MP-WEIXIN
  return authorizeScope('scope.record').then(granted => granted && (!camera || authorizeScope('scope.camera')))
  // #endif
  // #ifndef APP-PLUS || MP-WEIXIN
  return Promise.resolve(true)
  // #endif
}
