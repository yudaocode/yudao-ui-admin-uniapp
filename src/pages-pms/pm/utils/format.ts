import type { Project } from '@/api/pms/pm/project'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import dayjs from 'dayjs'
import {
  PmsIterationStatus,
  PmsProjectGroupType,
  PmsProjectMemberLevelOptions,
  PmsProjectType,
  PmsWorkItemDefectTypeOptions,
  PmsWorkItemPriority,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from './constants'

/** 获得工作项类型名称 */
export function getWorkItemTypeName(type: number) {
  return (
    {
      [PmsWorkItemType.REQUIREMENT]: '需求',
      [PmsWorkItemType.TASK]: '任务',
      [PmsWorkItemType.DEFECT]: '缺陷',
    }[type] || '-'
  )
}

/** 获得工作项类型编码 */
export function getWorkItemTypeCode(type: number) {
  return (
    {
      [PmsWorkItemType.REQUIREMENT]: 'requirement',
      [PmsWorkItemType.TASK]: 'task',
      [PmsWorkItemType.DEFECT]: 'defect',
    }[type] || 'task'
  )
}

/** 获得工作项优先级名称 */
export function getPriorityName(priority?: number) {
  return (
    {
      [PmsWorkItemPriority.NONE]: '无',
      [PmsWorkItemPriority.LOW]: '低',
      [PmsWorkItemPriority.MEDIUM]: '中',
      [PmsWorkItemPriority.HIGH]: '高',
    }[priority ?? -1] || '-'
  )
}

/** 获得工作项缺陷类型名称 */
export function getWorkItemDefectTypeName(defectType?: number) {
  return PmsWorkItemDefectTypeOptions.find(item => item.value === defectType)?.label || '-'
}

/** 获得工作项优先级颜色 */
export function getPriorityColor(priority?: number) {
  return (
    {
      [PmsWorkItemPriority.NONE]: '#8c8c8c',
      [PmsWorkItemPriority.LOW]: '#52c41a',
      [PmsWorkItemPriority.MEDIUM]: '#fa8c16',
      [PmsWorkItemPriority.HIGH]: '#f5222d',
    }[priority ?? -1] || '#8c8c8c'
  )
}

/** 获得工作项状态名称 */
export function getWorkItemStatusTypeName(status?: number) {
  return (
    {
      [PmsWorkItemStatusType.PENDING]: '未开始',
      [PmsWorkItemStatusType.PROCESSING]: '进行中',
      [PmsWorkItemStatusType.COMPLETED]: '已完成',
    }[status ?? -1] || '-'
  )
}

/** 获得迭代状态名称 */
export function getIterationStatusName(status?: number) {
  if (status === undefined) {
    return '-'
  }
  return (
    {
      [PmsIterationStatus.PLANNED]: '未开始',
      [PmsIterationStatus.ACTIVE]: '进行中',
      [PmsIterationStatus.COMPLETED]: '已完成',
    }[status] || '-'
  )
}

/** 获得项目分组类型名称 */
export function getProjectGroupTypeName(type?: number) {
  return type === PmsProjectGroupType.CUSTOM ? '自定义分组' : '默认分组'
}

/** 格式化包含中文星期的日期 */
export function formatDateWithWeekday(date: string) {
  return `${dayjs(date).format('MM-DD')}/周${'日一二三四五六'[dayjs(date).day()]}`
}

/** 格式化项目类型 */
export function formatProjectType(type: number) {
  return (
    getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, type)
    || (type === PmsProjectType.AGILE ? '敏捷开发项目' : '通用项目')
  )
}

/** 格式化项目类型简称 */
export function formatProjectTypeShort(type: number) {
  return type === PmsProjectType.AGILE ? '敏捷' : '普通'
}

/** 格式化项目可见范围 */
export function formatProjectOpenStatus(openStatus: boolean) {
  return openStatus ? '公开项目' : '私有项目'
}

/** 格式化项目成员级别 */
export function formatProjectMemberLevel(level: number) {
  return PmsProjectMemberLevelOptions.find(item => item.value === level)?.label || '-'
}

/** 计算项目工作项完成率 */
export function formatProjectCompletionRate(project: Project) {
  const total
    = project.pendingWorkItemCount + project.processingWorkItemCount + project.completedWorkItemCount
  return total > 0 ? Math.round((project.completedWorkItemCount * 100) / total) : 0
}

/** 格式化工时 */
export function formatWorkHours(hours?: number) {
  return hours === undefined ? '--' : `${hours} 小时`
}
