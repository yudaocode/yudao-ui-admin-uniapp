import { useAccess } from '@/hooks/useAccess'

/**
 * 工作台菜单数据
 * 定义菜单分组和菜单项的数据结构
 */

/** 菜单项类型 */
export interface MenuItem {
  key: string // 菜单唯一标识
  name: string // 菜单名称
  icon: string // 菜单图标（支持 wot-design-uni 图标名或图片路径）
  url?: string // 跳转路径
  iconColor?: string // 图标颜色（可选）
  enabled?: boolean // 是否启用（可选，默认 true）
  permission?: string // 权限标识（可选）
}

/** 菜单分组类型 */
export interface MenuGroup {
  key: string // 分组唯一标识
  name: string // 分组名称
  menus: MenuItem[] // 分组下的菜单列表
}

/** 菜单分组原始数据 */
const menuGroupsData: MenuGroup[] = [
  {
    key: 'system',
    name: '系统管理',
    menus: [
      {
        key: 'user',
        name: '用户管理',
        icon: 'user',
        url: '/pages-system/user/index',
        iconColor: '#1890ff',
        permission: 'system:user:list',
      },
      {
        key: 'role',
        name: '角色管理',
        icon: 'usergroup',
        url: '/pages-system/role/index',
        iconColor: '#52c41a',
        permission: 'system:role:query',
      },
      {
        key: 'menu',
        name: '菜单管理',
        icon: 'menu-fold',
        url: '/pages-system/menu/index',
        iconColor: '#fa8c16',
        permission: 'system:menu:query',
      },
      {
        key: 'dept',
        name: '部门管理',
        icon: 'attach',
        url: '/pages-system/dept/index',
        iconColor: '#13c2c2',
        permission: 'system:dept:query',
      },
      {
        key: 'post',
        name: '岗位管理',
        icon: 'flag',
        url: '/pages-system/post/index',
        iconColor: '#eb2f96',
        permission: 'system:post:query',
      },
      {
        key: 'operateLog',
        name: '操作日志',
        icon: 'format-horizontal-align-top',
        url: '/pages-system/operate-log/index',
        iconColor: '#722ed1',
        permission: 'system:operate-log:query',
      },
      {
        key: 'loginLog',
        name: '登录日志',
        icon: 'view-list',
        url: '/pages-system/login-log/index',
        iconColor: '#1677ff',
        permission: 'system:login-log:query',
      },
      {
        key: 'notice',
        name: '通知公告',
        icon: 'spool',
        url: '/pages-system/notice/index',
        iconColor: '#faad14',
        permission: 'system:notice:query',
      },
      {
        key: 'sms',
        name: '短信管理',
        icon: 'chat1',
        url: '/pages-system/sms/index',
        iconColor: '#36cfc9',
        permission: 'system:sms-channel:query',
      },
      {
        key: 'mail',
        name: '邮件管理',
        icon: 'mail',
        url: '/pages-system/mail/index',
        iconColor: '#40a9ff',
        permission: 'system:mail-account:query',
      },
      {
        key: 'notify',
        name: '站内信管理',
        icon: 'read',
        url: '/pages-system/notify/index',
        iconColor: '#ff85c0',
        permission: 'system:notify-template:query',
      },
      {
        key: 'tenant',
        name: '租户管理',
        icon: 'shop',
        url: '/pages-system/tenant/index',
        iconColor: '#9254de',
        permission: 'system:tenant:query',
      },
      {
        key: 'social',
        name: '三方用户',
        icon: 'share',
        url: '/pages-system/social/index',
        iconColor: '#08979c',
        permission: 'system:social-client:query',
      },
      {
        key: 'oauth2',
        name: 'OAuth2.0',
        icon: 'transfer',
        url: '/pages-system/oauth2/index',
        iconColor: '#d48806',
        permission: 'system:oauth2-client:query',
      },
    ],
  },
  {
    key: 'infra',
    name: '基础设施',
    menus: [
      {
        key: 'accessLog',
        name: '访问日志',
        icon: 'laptop',
        url: '/pages-infra/api-access-log/index',
        iconColor: '#2f54eb',
        permission: 'infra:api-access-log:query',
      },
      {
        key: 'errorLog',
        name: '错误日志',
        icon: 'error-circle',
        url: '/pages-infra/api-error-log/index',
        iconColor: '#f5222d',
        permission: 'infra:api-error-log:query',
      },
      {
        key: 'config',
        name: '参数配置',
        icon: 'setting',
        url: '/pages-infra/config/index',
        iconColor: '#597ef7',
        permission: 'infra:config:query',
      },
      {
        key: 'dataSourceConfig',
        name: '数据源配置',
        icon: 'setting',
        url: '/pages-infra/data-source-config/index',
        iconColor: '#13c2c2',
        permission: 'infra:data-source-config:query',
      },
      {
        key: 'websocket',
        name: 'WebSocket',
        icon: 'chat',
        url: '/pages-infra/web-socket/index',
        iconColor: '#36cfc9',
      },
      {
        key: 'codegen',
        name: '代码生成',
        icon: 'chevron-up-rectangle',
        url: '/pages/error/pc-only',
        iconColor: '#1677ff',
      },
      {
        key: 'build',
        name: '表单构建',
        icon: 'edit-outline',
        url: '/pages/error/pc-only',
        iconColor: '#722ed1',
      },
      {
        key: 'swagger',
        name: 'API 接口',
        icon: 'link',
        url: '/pages/error/pc-only',
        iconColor: '#52c41a',
      },
      {
        key: 'druid',
        name: '监控中心',
        icon: 'computer',
        url: '/pages/error/pc-only',
        iconColor: '#fa8c16',
      },
    ],
  },
  {
    key: 'bpm',
    name: '工作流程',
    menus: [
      {
        key: 'bpmMy',
        name: '我的流程',
        icon: 'list',
        url: '/pages/bpm/index?tab=my',
        iconColor: '#597ef7',
        permission: 'bpm:process-instance:query',
      },
      {
        key: 'bpmTodo',
        name: '待办任务',
        icon: 'clock',
        url: '/pages/bpm/index?tab=todo',
        iconColor: '#ff7a45',
        permission: 'bpm:task:query',
      },
      {
        key: 'bpmDone',
        name: '已办任务',
        icon: 'check-circle',
        url: '/pages/bpm/index?tab=done',
        iconColor: '#73d13d',
        permission: 'bpm:task:query',
      },
      {
        key: 'bpmCopy',
        name: '抄送我的',
        icon: 'mail',
        url: '/pages/bpm/index?tab=copy',
        iconColor: '#5cdbd3',
        permission: 'bpm:process-instance-cc:query',
      },
    ],
  },
]

/**
 * 获取所有菜单分组数据（带权限过滤）：过滤掉没有权限的菜单项，如果整个分组都没有权限则不展示该分组
 */
export function getMenuGroups(): MenuGroup[] {
  const { hasAccessByCodes } = useAccess()
  return menuGroupsData
    .map(group => ({
      ...group,
      // 过滤掉没有权限的菜单项
      menus: group.menus.filter((menu) => {
        // 没有配置权限的菜单项默认展示
        if (!menu.permission) {
          return true
        }
        return hasAccessByCodes([menu.permission])
      }),
    }))
    // 过滤掉没有菜单项的分组
    .filter(group => group.menus.length > 0)
}

/** 获取所有菜单项（扁平化） */
export function getAllMenuItems(): MenuItem[] {
  const groups = getMenuGroups()
  return groups.flatMap(group => group.menus)
}

/** 根据 key 获取菜单项 */
export function getMenuItemByKey(key: string): MenuItem | undefined {
  return getAllMenuItems().find(item => item.key === key)
}
