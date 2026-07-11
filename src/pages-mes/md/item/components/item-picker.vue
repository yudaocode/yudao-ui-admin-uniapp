<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="tempSelected.length === 0" @click="handleConfirm">
          确定{{ tempSelected.length ? `(${tempSelected.length})` : '' }}
        </wd-button>
      </view>

      <!-- 搜索区域 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="queryParams.code" placeholder="物料编码" clearable />
        <wd-input v-model="queryParams.name" placeholder="物料名称" clearable class="mt-12rpx" />
        <view class="mt-12rpx">
          <yd-tree-select
            v-model="queryParams.itemTypeId"
            :data="itemTypeTree"
            placeholder="物料分类"
            :props="{ value: 'id', label: 'name', children: 'children' }"
          />
        </view>
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 物料列表 -->
      <z-paging
        ref="pagingRef"
        v-model="itemList"
        :fixed="false"
        class="min-h-0 flex-1"
        :default-page-size="20"
        :refresher-enabled="true"
        :inside-more="!props.itemOrProduct"
        :hide-empty-view="canLoadNextPage"
        :loading-more-default-as-loading="true"
        :show-default-loading-more-text="!canLoadNextPage"
        :to-bottom-loading-more-enabled="!canLoadNextPage"
        empty-view-text="暂无可选物料"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in itemList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isTempSelected(item.id) ? 'ring-2 ring-[#1677ff]' : isDisabled(item) ? 'opacity-40' : ''"
            @click="toggleItem(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
              <text v-if="isDisabled(item)" class="text-22rpx text-[#999]">
                不可选
              </text>
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">名称：</text>{{ item.name || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">规格：</text>{{ item.specification || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">单位：</text>{{ item.unitMeasureName || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">分类：</text>{{ item.itemTypeName || '-' }}
            </view>
          </view>
          <view v-if="canLoadNextPage" class="py-32rpx text-center">
            <wd-button size="small" variant="plain" @click="handleLoadNextPage">
              加载下一页
            </wd-button>
          </view>
        </view>
      </z-paging>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import type { MdItemType } from '@/api/mes/md/item/type'
import { ref } from 'vue'
import { getItemPage } from '@/api/mes/md/item'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'

const props = withDefaults(defineProps<{
  /** 当前物料 ID（用于排除自身） */
  itemId?: number
  /** 已存在的 BOM 物料 ID 列表（用于排除已选） */
  existingIds?: number[]
  /** 物料/产品标识筛选 */
  itemOrProduct?: string
  /** 弹层标题 */
  title?: string
  /** 是否允许多选 */
  multiple?: boolean
}>(), {
  itemId: undefined,
  existingIds: () => [],
  itemOrProduct: undefined,
  title: '选择物料',
  multiple: true,
})

const emit = defineEmits<{
  confirm: [items: MdItem[]]
}>()

const visible = ref(false) // 弹窗显示状态
const itemList = ref<MdItem[]>([]) // 物料列表
const tempSelected = ref<MdItem[]>([]) // 临时选中物料
const pagingRef = ref<ZPagingRef<MdItem>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  code: '',
  name: '',
  itemTypeId: undefined,
})
const canLoadNextPage = ref(false) // 当前过滤模式仍有后续页
const itemTypeTree = ref<MdItemType[]>([]) // 分类树

/** 加载分类树 */
async function loadTree() {
  const data = await getItemTypeList()
  itemTypeTree.value = handleTree(data || [])
}

/** 判断物料是否禁用 */
function isDisabled(item: MdItem): boolean {
  if (props.itemId && item.id === props.itemId)
    return true
  if (props.existingIds.includes(item.id))
    return true
  return false
}

/** 判断是否临时选中 */
function isTempSelected(id: number): boolean {
  return tempSelected.value.some(i => i.id === id)
}

/** 切换选中 */
function toggleItem(item: MdItem) {
  if (isDisabled(item))
    return
  const idx = tempSelected.value.findIndex(i => i.id === item.id)
  if (idx >= 0) {
    tempSelected.value.splice(idx, 1)
  } else if (!props.multiple) {
    tempSelected.value = [item]
  } else {
    tempSelected.value.push(item)
  }
}

/** 查询物料列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (pageNo === 1) {
    canLoadNextPage.value = false
  }
  try {
    const data = await getItemPage({
      pageNo,
      pageSize,
      code: queryParams.value.code || undefined,
      name: queryParams.value.name || undefined,
      itemTypeId: queryParams.value.itemTypeId || undefined,
      status: CommonStatusEnum.ENABLE,
    })
    const rows = props.itemOrProduct
      ? data.list.filter(item => item.itemOrProduct === props.itemOrProduct)
      : data.list
    const noMore = pageNo * pageSize >= data.total
    canLoadNextPage.value = !!props.itemOrProduct && !noMore
    if (props.itemOrProduct) {
      pagingRef.value?.completeByNoMore(rows, noMore)
    } else {
      pagingRef.value?.completeByTotal(rows, data.total)
    }
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  tempSelected.value = []
  queryParams.value = {
    code: '',
    name: '',
    itemTypeId: undefined,
  }
  loadTree()
  reload()
}

/** 重新加载 */
function reload() {
  canLoadNextPage.value = false
  pagingRef.value?.reload()
}

/** 加载下一个后端分页 */
function handleLoadNextPage() {
  pagingRef.value?.doLoadMore()
}

/** 搜索按钮操作 */
function handleQuery() {
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryParams.value = {
    code: '',
    name: '',
    itemTypeId: undefined,
  }
  reload()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = []
  queryParams.value = {
    code: '',
    name: '',
    itemTypeId: undefined,
  }
}

/** 确认选择 */
function handleConfirm() {
  emit('confirm', [...tempSelected.value])
  visible.value = false
}

defineExpose({ open })
</script>
