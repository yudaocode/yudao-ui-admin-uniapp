/**
 * 树形结构工具函数
 */

interface TreeNode {
  id?: number
  parentId?: number
  children?: TreeNode[]
  [key: string]: any
}

/**
 * 构造树型结构数据
 * @param data 数据源
 * @param id id 字段，默认 'id'
 * @param parentId 父节点字段，默认 'parentId'
 * @param children 孩子节点字段，默认 'children'
 */
export function handleTree<T extends TreeNode>(
  data: T[],
  id = 'id',
  parentId = 'parentId',
  children = 'children',
): T[] {
  if (!Array.isArray(data)) {
    console.warn('data must be an array')
    return []
  }

  const nodeMap: Record<number, T> = {}
  const childrenListMap: Record<number, T[]> = {}
  const tree: T[] = []

  // 构建节点映射和子节点列表
  for (const node of data) {
    const nodeId = node[id] as number
    const nodeParentId = node[parentId] as number

    nodeMap[nodeId] = { ...node, [children]: [] } as T

    if (!childrenListMap[nodeParentId]) {
      childrenListMap[nodeParentId] = []
    }
    childrenListMap[nodeParentId].push(nodeMap[nodeId])
  }

  // 构建树形结构
  for (const node of data) {
    const nodeParentId = node[parentId] as number
    // 父节点不存在于 nodeMap 中，说明是根节点
    if (!nodeMap[nodeParentId]) {
      tree.push(nodeMap[node[id] as number])
    }
  }

  // 递归设置子节点
  function setChildren(node: T) {
    const nodeId = node[id] as number
    const nodeChildren = childrenListMap[nodeId]
    if (nodeChildren && nodeChildren.length > 0) {
      ;(node as any)[children] = nodeChildren
      for (const child of nodeChildren) {
        setChildren(child)
      }
    }
  }

  for (const node of tree) {
    setChildren(node)
  }

  return tree
}

/**
 * 在树中查找节点的子节点列表
 * @param tree 树形数据
 * @param parentId 父节点 ID
 * @param id id 字段，默认 'id'
 * @param children 孩子节点字段，默认 'children'
 */
export function findChildren<T extends TreeNode>(
  tree: T[],
  parentId: number,
  id = 'id',
  children = 'children',
): T[] {
  for (const node of tree) {
    if (node[id] === parentId) {
      return (node[children] as T[]) || []
    }
    const nodeChildren = node[children] as T[] | undefined
    if (nodeChildren && nodeChildren.length > 0) {
      const found = findChildren(nodeChildren, parentId, id, children)
      if (found.length > 0) {
        return found
      }
    }
  }
  return []
}
