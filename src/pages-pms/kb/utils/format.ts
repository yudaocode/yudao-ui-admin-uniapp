import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatFileSize } from '@/utils/download'
import { PmsKnowledgeDocumentStatus } from './constants'

/** 格式化知识对象类型名称 */
export function getKnowledgeObjectTypeName(type: number) {
  return getDictLabel(DICT_TYPE.PMS_KNOWLEDGE_OBJECT_TYPE, type)
}

/** 格式化知识库文档状态名称 */
export function getKnowledgeDocumentStatusName(status: number) {
  return {
    [PmsKnowledgeDocumentStatus.DRAFT]: '草稿',
    [PmsKnowledgeDocumentStatus.NORMAL]: '正常',
    [PmsKnowledgeDocumentStatus.TEMPLATE]: '模板',
  }[status]
}

/** 格式化知识库文件大小 */
export function formatKnowledgeFileSize(size?: number) {
  if (size === undefined || size === null || size < 0) {
    return ''
  }
  return formatFileSize(size)
}
