<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <!-- #ifndef MP-WEIXIN -->
    <wd-navbar
      title="产品物模型"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      :right-text="showTsl ? 'TSL' : ''"
      @click-left="handleBack"
      @click-right="handleTsl"
    />
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <wd-navbar title="产品物模型" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <text v-if="showTsl" class="text-28rpx text-[#333]" @click="handleTsl">TSL</text>
        </view>
      </template>
    </wd-navbar>
    <!-- #endif -->

    <!-- 搜索组件 -->
    <SearchForm :default-product-id="defaultProductId" @search="handleQuery" @reset="handleReset" />

    <!-- 物模型列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无物模型数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="shrink-0">
              <dict-tag :type="DICT_TYPE.IOT_THING_MODEL_TYPE" :value="item.type" />
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.identifier || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">数据类型：</text>{{ getThingModelDataTypeLabel(item) }}
          </view>
          <view class="text-24rpx text-[#999]">
            {{ item.description || '暂无描述' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="canCreate && hasAccessByCodes(['iot:thing-model:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 物模型 TSL 弹窗 -->
    <wd-popup v-model="tslVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          物模型 TSL
        </view>
        <scroll-view scroll-y class="max-h-[60vh]">
          <text class="break-all text-24rpx text-[#666]">{{ tslJson }}</text>
        </scroll-view>
        <wd-button class="mt-24rpx" block @click="tslVisible = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { ThingModelData } from '@/api/iot/thingmodel'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getThingModelPage, getThingModelTSLByProductId } from '@/api/iot/thingmodel'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, getDataTypeOptionsLabel } from '@/utils/constants'
import { formatJson } from '@/utils/format'
import SearchForm from './components/search-form.vue'

const props = defineProps<{ productId?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ThingModelData[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const defaultProductId = props.productId ? Number(props.productId) : undefined // 入口预置产品
const queryParams = ref<Record<string, any>>({ productId: defaultProductId || -1 }) // 查询参数
const canCreate = computed(() => Number(queryParams.value.productId) > 0) // 是否允许新增功能
const showTsl = computed(() => Number(queryParams.value.productId) > 0 && hasAccessByCodes(['iot:thing-model:query'])) // 是否展示 TSL 入口
const tslVisible = ref(false) // TSL 弹窗显示状态
const tslJson = ref('') // TSL JSON 文本

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询物模型列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getThingModelPage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    productId: data?.productId ?? defaultProductId ?? -1,
  }
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

/** 新增物模型 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-iot/thingmodel/form/index${queryParams.value.productId ? `?productId=${queryParams.value.productId}` : ''}` })
}

/** 查看详情 */
function handleDetail(item: ThingModelData) {
  uni.navigateTo({ url: `/pages-iot/thingmodel/detail/index?id=${item.id}` })
}

/** 获取数据类型展示 */
function getThingModelDataTypeLabel(item: ThingModelData) {
  return getDataTypeOptionsLabel(item.property?.dataType || item.dataType) || '-'
}

/** 查看物模型 TSL */
async function handleTsl() {
  const productId = Number(queryParams.value.productId)
  if (!(productId > 0)) {
    return
  }
  const tsl = await getThingModelTSLByProductId(productId)
  tslJson.value = formatJson(tsl, '{}')
  tslVisible.value = true
}

/** 初始化 */
onMounted(() => {
  uni.$on('iot:thingmodel:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('iot:thingmodel:reload', reload)
})
</script>
