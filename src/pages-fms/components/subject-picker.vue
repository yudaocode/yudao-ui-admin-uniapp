<!-- TODO @AI：应该放到对应的模块里呀 -->
<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          选择科目
        </view>
        <view class="w-96rpx" />
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="keyword" placeholder="搜索科目编码 / 名称" clearable />
      </view>

      <!-- 科目类型 -->
      <view v-if="!isSearching" class="bg-white">
        <scroll-view scroll-x class="whitespace-nowrap">
          <wd-radio-group v-model="type" type="button" class="px-24rpx py-16rpx" @change="handleTypeChange">
            <wd-radio
              v-for="option in FmsSubjectTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </wd-radio>
          </wd-radio-group>
        </scroll-view>
      </view>

      <!-- 面包屑导航 -->
      <view
        v-if="!isSearching && parentStack.length > 0"
        class="flex items-center border-t border-[#eee] border-t-solid bg-white px-24rpx py-16rpx"
        @click="handleBackParent"
      >
        <wd-icon name="arrow-left" size="14px" color="#1890ff" />
        <text class="ml-8rpx text-26rpx text-[#1890ff]">返回上级（{{ parentStack[parentStack.length - 1].name }}）</text>
      </view>

      <!-- 科目列表 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx">
          <view
            v-for="item in displayList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleSelect(item)"
          >
            <view class="flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-30rpx text-[#333] font-semibold">
                  {{ item.code }} {{ item.name }}
                </view>
                <view v-if="item.auxiliaryTypeNames?.length" class="mt-8rpx truncate text-24rpx text-[#999]">
                  辅助核算：{{ item.auxiliaryTypeNames.join('、') }}
                </view>
              </view>
              <wd-tag v-if="isLeaf(item) && item.status !== FmsSubjectStatus.ENABLED" type="danger" plain>
                停用
              </wd-tag>
              <wd-tag v-else-if="!isLeaf(item) && isSearching" type="warning" plain>
                非末级
              </wd-tag>
              <view
                v-else-if="!isLeaf(item)"
                class="flex flex-shrink-0 items-center"
                @click.stop="handleEnterChildren(item)"
              >
                <text class="text-24rpx text-[#1890ff]">子科目 ({{ getChildCount(item) }})</text>
                <wd-icon name="arrow-right" size="12px" color="#1890ff" />
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="!loading && displayList.length === 0" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选科目" />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Subject } from '@/api/fms/config/subject'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getSubjectList } from '@/api/fms/config/subject'
import {
  FMS_SUBJECT_PARENT_ID_ROOT,
  FmsSubjectStatus,
  FmsSubjectType,
  FmsSubjectTypeOptions,
} from '@/pages-fms/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'

const props = defineProps<{
  accountSetId?: number
  subjects?: Subject[] // 外部已加载的平铺科目列表，传入后选择器不再自行请求
}>()

const emit = defineEmits<{
  confirm: [subject: Subject]
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 科目加载状态
const keyword = ref('') // 搜索关键词
const type = ref<number>(FmsSubjectType.ASSET) // 当前科目类型
const currentParentId = ref(FMS_SUBJECT_PARENT_ID_ROOT) // 当前层级的父节点编号
const parentStack = ref<{ id: number, name: string }[]>([]) // 下钻层级栈
const typeTreeCache = reactive(new Map<number, Subject[]>()) // 各类型科目树缓存（未传入 subjects 时使用）

const isSearching = computed(() => Boolean(keyword.value.trim())) // 是否处于搜索态
/** 当前类型的科目树 */
const currentTree = computed(() => {
  if (props.subjects) {
    return handleTree(props.subjects.filter(item => item.type === type.value))
  }
  return typeTreeCache.get(type.value) || []
})
/** 搜索范围：外部传入全量科目时跨类型搜索，否则在当前类型树内搜索 */
const searchSource = computed(() => props.subjects || flattenTree(currentTree.value))
const parentIdSet = computed(() => new Set(searchSource.value.map(item => item.parentId))) // 存在子级的科目编号集合
const displayList = computed(() => { // 当前展示的科目列表
  if (isSearching.value) {
    const searchKeyword = keyword.value.trim().toLowerCase()
    return searchSource.value.filter(item =>
      item.code.toLowerCase().includes(searchKeyword) || item.name.toLowerCase().includes(searchKeyword),
    )
  }
  if (currentParentId.value === FMS_SUBJECT_PARENT_ID_ROOT) {
    return currentTree.value.filter(item => item.parentId === FMS_SUBJECT_PARENT_ID_ROOT)
  }
  return findChildren(currentTree.value, currentParentId.value)
})

/** 平铺科目树 */
function flattenTree(tree: Subject[]): Subject[] {
  return tree.reduce<Subject[]>((result, item) => {
    result.push(item, ...flattenTree(item.children || []))
    return result
  }, [])
}

/** 是否末级科目 */
function isLeaf(item: Subject) {
  return !parentIdSet.value.has(item.id!)
}

/** 获取子科目数量 */
function getChildCount(item: Subject) {
  return findChildren(currentTree.value, item.id!).length
}

/** 加载当前类型科目树 */
async function loadTypeTree() {
  if (props.subjects || typeTreeCache.has(type.value) || !props.accountSetId) {
    return
  }
  loading.value = true
  try {
    typeTreeCache.set(type.value, handleTree(await getSubjectList(props.accountSetId, type.value)))
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open() {
  keyword.value = ''
  currentParentId.value = FMS_SUBJECT_PARENT_ID_ROOT
  parentStack.value = []
  visible.value = true
  loadTypeTree()
}

/** 切换科目类型 */
function handleTypeChange() {
  currentParentId.value = FMS_SUBJECT_PARENT_ID_ROOT
  parentStack.value = []
  loadTypeTree()
}

/** 进入子科目层级 */
function handleEnterChildren(item: Subject) {
  parentStack.value.push({ id: currentParentId.value, name: `${item.code} ${item.name}` })
  currentParentId.value = item.id!
}

/** 返回上一层级 */
function handleBackParent() {
  const parent = parentStack.value.pop()
  currentParentId.value = parent?.id ?? FMS_SUBJECT_PARENT_ID_ROOT
}

/** 选择科目 */
function handleSelect(item: Subject) {
  if (!isLeaf(item)) {
    if (isSearching.value) {
      toast.warning('请选择末级科目')
      return
    }
    handleEnterChildren(item)
    return
  }
  if (item.status !== FmsSubjectStatus.ENABLED) {
    toast.warning('该科目已停用，不能选择')
    return
  }
  emit('confirm', item)
  visible.value = false
}

defineExpose({ open })
</script>
