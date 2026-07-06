<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备类型" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 面包屑导航 -->
    <Breadcrumb ref="breadcrumbRef" v-model="currentParentId" />

    <!-- 类型列表 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <view v-for="item in currentList" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="mb-12rpx flex items-center">
                  <view class="mr-16rpx h-48rpx w-48rpx flex shrink-0 items-center justify-center rounded-8rpx bg-[#722ed1]">
                    <wd-icon name="folder" size="20px" color="#fff" />
                  </view>
                  <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                    {{ item.name || '-' }}
                  </view>
                </view>
                <view class="text-26rpx text-[#666] space-y-8rpx">
                  <view>编码：{{ item.code || '-' }}</view>
                  <view>排序：{{ item.sort ?? '-' }}</view>
                  <view class="flex items-center">
                    <text class="mr-8rpx">状态：</text>
                    <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
                  </view>
                </view>
              </view>
              <view v-if="item.children && item.children.length > 0" class="mt-4rpx flex shrink-0 items-center" @click.stop="handleEnterChildren(item)">
                <text class="text-24rpx text-[#722ed1]">子类型({{ item.children.length }})</text>
                <wd-icon name="arrow-right" size="12px" color="#722ed1" />
              </view>
            </view>
          </view>
        </view>
        <view v-if="!loading && currentList.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无设备类型数据" />
        </view>
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:dv-machinery-type:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { DvMachineryType } from '@/api/mes/dv/machinery/type'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getMachineryTypeList } from '@/api/mes/dv/machinery/type'
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
const list = ref<DvMachineryType[]>([]) // 设备类型树
const currentParentId = ref(0) // 当前父级编号
const breadcrumbRef = ref<InstanceType<typeof Breadcrumb>>() // 面包屑组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const currentList = computed(() => {
  if (currentParentId.value === 0) {
    return list.value.filter(item => (item.parentId ?? 0) === 0)
  }
  return findChildren(list.value, currentParentId.value)
}) // 当前层级展示的类型列表

/** 返回上一页或上一层级 */
function handleBack() {
  if (!breadcrumbRef.value?.back()) {
    navigateBackPlus('/pages-statistics/mes/home/index')
  }
}

/** 进入子类型 */
function handleEnterChildren(item: DvMachineryType) {
  breadcrumbRef.value?.enter({ id: item.id!, name: item.name || '-' })
}

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await getMachineryTypeList(queryParams.value)
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/form/index?parentId=${currentParentId.value}` })
}

/** 查看详情 */
function handleDetail(item: DvMachineryType) {
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/detail/index?id=${item.id}` })
}

/** 刷新列表 */
function reload() {
  getList()
}

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('mes:dv:machinery-type:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:machinery-type:reload', reload)
})
</script>
