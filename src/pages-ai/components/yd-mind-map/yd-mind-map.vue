<template>
  <scroll-view v-if="rootNodes.length" scroll-x class="mind-map-scroll">
    <view class="mind-map-canvas" :style="canvasStyle">
      <view v-for="root in rootNodes" :key="root.id" class="mind-map-root">
        <view class="mind-map-node mind-map-node-root">
          {{ root.title }}
        </view>
        <view v-if="root.children.length" class="mind-map-branches">
          <view v-for="levelTwo in root.children" :key="levelTwo.id" class="mind-map-branch">
            <view class="mind-map-node mind-map-node-level-two">
              {{ levelTwo.title }}
            </view>
            <view v-if="levelTwo.children.length" class="mind-map-children">
              <view v-for="levelThree in levelTwo.children" :key="levelThree.id" class="mind-map-child">
                <view class="mind-map-node mind-map-node-level-three">
                  {{ levelThree.title }}
                </view>
                <view v-if="levelThree.children.length" class="mind-map-leaves">
                  <view
                    v-for="levelFour in levelThree.children"
                    :key="levelFour.id"
                    class="mind-map-node mind-map-node-level-four"
                  >
                    {{ levelFour.title }}
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
  <view v-else class="py-48rpx text-center text-26rpx text-[#999]">
    暂未识别到思维导图结构
  </view>
</template>

<script lang="ts" setup>
interface MindMapNode {
  id: number
  level: number
  title: string
  children: MindMapNode[]
}

const props = withDefaults(defineProps<{
  content?: string
}>(), {
  content: '',
})

const rootNodes = computed(() => parseMindMap(props.content))
const canvasStyle = computed(() => { // 根据二级分支数量扩展横向画布
  const branchCount = rootNodes.value.reduce((count, root) => Math.max(count, root.children.length), 0)
  return { width: `${Math.max(750, branchCount * 308 + 32)}rpx` }
})

/** 解析最多四级的 Markdown 标题 */
function parseMindMap(content: string) {
  const roots: MindMapNode[] = []
  const parents: Array<MindMapNode | undefined> = []
  let nodeId = 0
  let inCodeBlock = false
  for (const sourceLine of content.split('\n')) {
    const line = sourceLine.trim()
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) {
      continue
    }
    const level = countHeadingLevel(line)
    if (!level || !/[\t ]/.test(line[level])) {
      continue
    }
    const title = line.slice(level).trim().replace(/#+$/, '').trim()
    if (!title) {
      continue
    }
    const node: MindMapNode = {
      id: ++nodeId,
      level,
      title: normalizeTitle(title),
      children: [],
    }
    const parent = findParent(parents, level)
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
    parents[level] = node
    parents.length = level + 1
  }
  return roots
}

/** 计算 Markdown 标题级别 */
function countHeadingLevel(line: string) {
  let level = 0
  while (level < 4 && line[level] === '#') {
    level++
  }
  return level
}

/** 查找当前标题最近的上级节点 */
function findParent(parents: Array<MindMapNode | undefined>, level: number) {
  for (let parentLevel = level - 1; parentLevel >= 1; parentLevel--) {
    if (parents[parentLevel]) {
      return parents[parentLevel]
    }
  }
  return undefined
}

/** 清理标题中的行内 Markdown 标记 */
function normalizeTitle(title: string) {
  return title
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim()
}
</script>

<style lang="scss" scoped>
.mind-map-scroll {
  width: 100%;
}

.mind-map-canvas {
  min-width: 100%;
  padding: 24rpx 16rpx 40rpx;
}

.mind-map-root + .mind-map-root {
  margin-top: 36rpx;
}

.mind-map-node {
  box-sizing: border-box;
  border: 2rpx solid #d9e8d2;
  border-radius: 14rpx;
  background: #fff;
  padding: 14rpx 18rpx;
  color: #333;
  font-size: 24rpx;
  line-height: 36rpx;
  word-break: break-word;
}

.mind-map-node-root {
  display: inline-block;
  max-width: 520rpx;
  margin: 0 0 38rpx 16rpx;
  border-color: #52c41a;
  background: #52c41a;
  padding: 18rpx 30rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
}

.mind-map-branches {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 28rpx;
  border-top: 2rpx solid #b7dbaa;
  padding-top: 30rpx;
}

.mind-map-branch {
  width: 280rpx;
  flex: 0 0 280rpx;
}

.mind-map-node-level-two {
  border-color: #95de64;
  background: #f0f9eb;
  color: #317214;
  font-size: 26rpx;
  font-weight: 600;
}

.mind-map-children,
.mind-map-leaves {
  margin-left: 22rpx;
  border-left: 2rpx solid #cfe8c5;
  padding-left: 18rpx;
}

.mind-map-children {
  padding-top: 18rpx;
}

.mind-map-child + .mind-map-child,
.mind-map-node-level-four + .mind-map-node-level-four {
  margin-top: 14rpx;
}

.mind-map-node-level-three {
  border-color: #b7dfaa;
  background: #f8fcf6;
}

.mind-map-leaves {
  padding-top: 14rpx;
}

.mind-map-node-level-four {
  border-color: #e4efdf;
  color: #666;
  font-size: 22rpx;
}
</style>
