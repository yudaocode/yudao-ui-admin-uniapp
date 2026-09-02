<template>
  <view>
    <view
      class="flex items-center gap-12rpx py-16rpx"
      :style="{ paddingLeft: `${level * 32}rpx` }"
      @click="handleTap"
    >
      <wd-icon
        v-if="node.kind === 'folder' || node.children.length > 0"
        :name="expanded ? 'arrow-down' : 'arrow-right'"
        size="28rpx" color="#999"
        class="shrink-0"
        @click.stop="emit('toggle', node.key)"
      />
      <view v-else class="w-28rpx shrink-0" />
      <wd-icon
        :name="node.kind === 'folder' ? 'folder' : node.type === PmsKnowledgeDocumentType.FILE ? 'file' : 'textarea'"
        size="32rpx"
        :color="node.kind === 'folder' ? '#fa8c16' : '#1677ff'"
        class="shrink-0"
      />
      <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ node.label }}</text>
      <wd-icon
        v-if="showMore"
        name="more-vertical" size="32rpx" color="#999"
        class="shrink-0"
        @click.stop="emit('more', node)"
      />
    </view>
    <template v-if="expanded">
      <TreeNode
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :level="level + 1"
        :expanded-keys="expandedKeys"
        :manageable="manageable"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
        @more="emit('more', $event)"
      />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeTreeNode } from '@/pages-pms/kb/utils/tree'
import { computed } from 'vue'
import { PmsKnowledgeDocumentType } from '@/pages-pms/kb/utils/constants'
import TreeNode from './tree-node.vue'

const props = defineProps<{
  node: KnowledgeTreeNode
  level: number // 缩进层级
  expandedKeys: Set<string> // 已展开节点标识
  manageable: boolean // 当前用户是否可操作目录
}>()

const emit = defineEmits<{
  select: [node: KnowledgeTreeNode]
  toggle: [key: string]
  more: [node: KnowledgeTreeNode]
}>()

const expanded = computed(() => props.expandedKeys.has(props.node.key)) // 是否展开
const showMore = computed(() => props.manageable || props.node.currentUserLevel !== undefined) // 是否展示更多操作

/** 点击节点：文件夹展开/折叠并进入，文档直接进入；事件名用 select，避开 uni 原生 tap 保留名 */
function handleTap() {
  if (props.node.kind === 'folder') {
    emit('toggle', props.node.key)
  }
  emit('select', props.node)
}
</script>
