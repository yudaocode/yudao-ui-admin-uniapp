<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="物料产品分类"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 面包屑导航 -->
    <Breadcrumb ref="breadcrumbRef" v-model="currentParentId" />

    <!-- 分类列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in currentList"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="p-24rpx" @click="handleDetail(item)">
          <view class="flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="mb-12rpx flex items-center">
                <view
                  class="mr-16rpx h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#fa8c16]"
                >
                  <wd-icon name="folder" size="20px" color="#fff" />
                </view>
                <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                  {{ item.name || '-' }}
                </view>
              </view>
              <view class="text-26rpx text-[#666] space-y-8rpx">
                <view>分类编码：{{ item.code || '-' }}</view>
                <view class="flex items-center">
                  <text class="mr-8rpx">物料/产品：</text>
                  <dict-tag
                    v-if="item.itemOrProduct"
                    :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT"
                    :value="item.itemOrProduct"
                  />
                  <text v-else>-</text>
                </view>
                <view>排序：{{ item.sort ?? '-' }}</view>
                <view class="flex items-center">
                  <text class="mr-8rpx">状态：</text>
                  <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                </view>
              </view>
            </view>
            <view
              v-if="item.children && item.children.length > 0"
              class="mt-4rpx flex shrink-0 items-center"
              @click.stop="handleEnterChildren(item)"
            >
              <text class="text-24rpx text-[#fa8c16]">子分类({{ item.children.length }})</text>
              <wd-icon name="arrow-right" size="12px" color="#fa8c16" />
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
        <wd-empty icon="content" tip="暂无物料产品分类数据" />
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:md-item-type:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdItemType } from '@/api/mes/md/item/type'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { findChildren, handleTree } from '@/utils/tree'
import Breadcrumb from './components/breadcrumb.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 列表加载状态
const list = ref<MdItemType[]>([]) // 完整分类列表（树形结构）
const currentParentId = ref(0) // 当前层级的父节点编号
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>()
const queryParams = ref<Record<string, any>>({}) // 查询参数
const currentList = computed(() => {
  if (currentParentId.value === 0) {
    return list.value.filter(item => (item.parentId ?? 0) === 0)
  }
  return findChildren(list.value, currentParentId.value)
}) // 当前层级展示的分类列表

/** 返回上一页或上一层级 */
function handleBack() {
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus('/pages-statistics/mes/home/index')
  }
}

/** 进入子分类层级 */
function handleEnterChildren(item: MdItemType) {
  breadcrumbRef.value?.enter({ id: item.id!, name: item.name || '-' })
}

/** 查询分类列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getItemTypeList(queryParams.value)
    list.value = handleTree(data || [])
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  // 重置面包屑
  currentParentId.value = 0
  breadcrumbRef.value?.reset()
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 新增分类 */
function handleAdd() {
  uni.navigateTo({
    url: `/pages-mes/md/item/type/form/index?parentId=${currentParentId.value}`,
  })
}

/** 查看详情 */
function handleDetail(item: MdItemType) {
  uni.navigateTo({
    url: `/pages-mes/md/item/type/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('mes:md:item:type:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:type:reload', getList)
})
</script>
