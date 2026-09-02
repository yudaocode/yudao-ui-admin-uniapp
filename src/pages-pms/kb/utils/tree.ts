import type { KnowledgeDocumentTreeNode } from '@/api/pms/kb/content/document'
import type { KnowledgeFolderTreeNode } from '@/api/pms/kb/content/folder'
import { PmsKnowledgeDocumentType } from './constants'

/** 知识库目录树节点 */
export interface KnowledgeTreeNode {
  key: string // 节点标识，folder-{id} 或 document-{id}
  entityId: number // 对象编号
  kind: 'folder' | 'document' // 节点类型
  label: string // 节点标题
  currentUserLevel?: number // 当前用户协作等级
  type?: number // 文档类型
  children: KnowledgeTreeNode[] // 子节点列表
}

/** 构建文件夹树节点 */
export function buildFolderNode(folder: KnowledgeFolderTreeNode): KnowledgeTreeNode {
  return {
    key: `folder-${folder.id}`,
    entityId: folder.id,
    kind: 'folder',
    label: folder.title,
    currentUserLevel: folder.currentUserLevel,
    children: [...folder.children.map(buildFolderNode), ...folder.documents.map(buildDocumentNode)],
  }
}

/** 构建文档树节点 */
export function buildDocumentNode(document: KnowledgeDocumentTreeNode): KnowledgeTreeNode {
  return {
    key: `document-${document.id}`,
    entityId: document.id,
    kind: 'document',
    label: document.title,
    currentUserLevel: document.currentUserLevel,
    type: document.type,
    children: document.children.map(buildDocumentNode),
  }
}

/** 获得目录节点类型名称 */
export function getKnowledgeTreeNodeTypeName(node: KnowledgeTreeNode) {
  if (node.kind === 'folder') {
    return '文件夹'
  }
  return node.type === PmsKnowledgeDocumentType.FILE ? '文件' : '文档'
}

/** 按节点标识查找目录树节点 */
export function findTreeNode(nodes: KnowledgeTreeNode[], key: string): KnowledgeTreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) {
      return node
    }
    const child = findTreeNode(node.children, key)
    if (child) {
      return child
    }
  }
  return undefined
}
