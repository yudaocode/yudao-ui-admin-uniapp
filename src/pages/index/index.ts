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
        key: 'notice',
        name: '通知公告',
        icon: 'spool',
        url: '/pages-system/notice/index',
        iconColor: '#faad14',
        permission: 'system:notice:query',
      },
      {
        key: 'operateLog',
        name: '操作日志',
        icon: 'rootlist',
        url: '/pages-system/operate-log/index',
        iconColor: '#722ed1',
        permission: 'system:operate-log:query',
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
        url: '/pages-infra/apiAccessLog/index',
        iconColor: '#2f54eb',
        permission: 'infra:api-access-log:query',
      },
      {
        key: 'errorLog',
        name: '错误日志',
        icon: 'error-circle',
        url: '/pages-infra/apiErrorLog/index',
        iconColor: '#f5222d',
        permission: 'infra:api-error-log:query',
      },
      {
        key: 'websocket',
        name: 'WebSocket',
        icon: 'chat',
        url: '/pages-infra/webSocket/index',
        iconColor: '#36cfc9',
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
