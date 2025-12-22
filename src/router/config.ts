// import { getAllPages } from '@/utils'

export const LOGIN_STRATEGY_MAP = {
  DEFAULT_NO_NEED_LOGIN: 0, // 黑名单策略，默认可以进入APP
  DEFAULT_NEED_LOGIN: 1, // 白名单策略，默认不可以进入APP，需要强制登录
}
// TODO: 1/3 登录策略，默认使用`无需登录策略`，即默认不需要登录就可以访问
export const LOGIN_STRATEGY = LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN // edit by 芋艿：管理后台，默认需要登录
export const isNeedLoginMode
  = LOGIN_STRATEGY === LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN

export const LOGIN_PAGE = '/pages-core/auth/login' // edit by 芋艿：自定义了登录页路径
export const REGISTER_PAGE = '/pages-core/auth/register' // edit by 芋艿：自定义了注册页路径
export const CODE_LOGIN_PAGE = '/pages-core/auth/code-login' // edit by 芋艿：自定义了短信登录页路径
export const FORGET_PASSWORD_PAGE = '/pages-core/auth/forget-password' // edit by 芋艿：自定义了忘记密码页路径
export const NOT_FOUND_PAGE = '/pages-core/error/404' // edit by 芋艿：调整 404 页面路径

// TODO @芋艿：【优化】貌似 unibest 这个变量没用？！
export const LOGIN_PAGE_LIST = [
  LOGIN_PAGE,
  REGISTER_PAGE,
  CODE_LOGIN_PAGE,
  FORGET_PASSWORD_PAGE,
]

// 注释 by 芋艿：在 mp 环境下，getAllPages 函数还没初始化好，所以不能直接调用。统一优化到 judgeIsExcludePath 函数里面去获取
// 在 definePage 里面配置了 excludeLoginPath 的页面，功能与 EXCLUDE_LOGIN_PATH_LIST 相同
// export const excludeLoginPathList = getAllPages('excludeLoginPath').map(
//   page => page.path,
// )

// 排除在外的列表，白名单策略指白名单列表，黑名单策略指黑名单列表
// TODO: 2/3 在 definePage 配置 excludeLoginPath，或者在下面配置 EXCLUDE_LOGIN_PATH_LIST
export const EXCLUDE_LOGIN_PATH_LIST = [
  '/pages/xxx/index', // 示例值
  '/pages-sub/xxx/index', // 示例值
  // 注释 by 芋艿：在 mp 环境下，getAllPages 函数还没初始化好，所以不能直接调用。统一优化到 judgeIsExcludePath 函数里面去获取
  // ...excludeLoginPathList, // 都是以 / 开头的 path
]

// 在小程序里面是否使用H5的登录页，默认为 false
// 如果为 true 则复用 h5 的登录逻辑
// TODO: 3/3 确定自己的登录页是否需要在小程序里面使用
export const LOGIN_PAGE_ENABLE_IN_MP = true // edit by 芋艿：管理后台，小程序也使用自定义登录页
