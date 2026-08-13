<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="auxiliaryType?.name || '辅助核算项目'"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 项目列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无辅助核算项目"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">编码：</text>{{ item.code }}
          </view>
          <template v-if="isInventory">
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">规格：</text>{{ item.specification || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">单位：</text>{{ item.unit || '-' }}
            </view>
          </template>
          <view v-if="item.remark" class="mb-12rpx truncate text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注：</text>{{ item.remark }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="canCreate"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AuxiliaryItem } from '@/api/fms/config/auxiliary/item'
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import { onUnload } from '@dcloudio/uni-app'
import { getAuxiliaryItemPage } from '@/api/fms/config/auxiliary/item'
import { getAuxiliaryTypeList } from '@/api/fms/config/auxiliary/type'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsAuxiliaryType } from '@/pages-fms/utils/constants'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  auxiliaryTypeId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const list = ref<AuxiliaryItem[]>([]) // 列表数据
const queryParams = ref<Record<string, any>>({}) // 查询参数
const pagingRef = ref<any>() // 分页组件引用
const auxiliaryType = ref<AuxiliaryType>() // 当前辅助核算类别

const isInventory = computed(() => auxiliaryType.value?.type === FmsAuxiliaryType.INVENTORY) // 是否存货类别
/** 当前账套可写且有新增权限时才允许新增 */
const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:auxiliary:create']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/auxiliary/index')
}

/** 加载当前类别信息（辅助核算类别无 /get 接口，从账套级列表中查找） */
async function loadAuxiliaryType() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !props.auxiliaryTypeId) {
    return
  }
  const typeList = await getAuxiliaryTypeList(accountSetId)
  auxiliaryType.value = typeList.find(item => item.id === Number(props.auxiliaryTypeId))
}

/** 查询项目列表 */
async function queryList(pageNo: number, pageSize: number) {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !props.auxiliaryTypeId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getAuxiliaryItemPage({
      accountSetId,
      auxiliaryTypeId: Number(props.auxiliaryTypeId),
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增项目 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-fms/config/auxiliary/item/form/index?auxiliaryTypeId=${props.auxiliaryTypeId}` })
}

/** 查看详情 */
function handleDetail(item: AuxiliaryItem) {
  uni.navigateTo({
    url: `/pages-fms/config/auxiliary/item/detail/index?id=${item.id}&auxiliaryTypeId=${props.auxiliaryTypeId}&code=${encodeURIComponent(item.code)}`,
  })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await loadAuxiliaryType()
  uni.$on('fms:config:auxiliary:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:auxiliary:reload', reload)
})
</script>
