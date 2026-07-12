<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="模型配置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 模型列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无模型"
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
            <view class="min-w-0 flex-1">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.name || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                {{ item.model || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.AI_MODEL_TYPE" :value="item.type" />
          </view>
          <view class="text-26rpx text-[#666]">
            <view class="mb-8rpx">
              平台：<dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="item.platform" />
            </view>
            <view class="mb-8rpx">
              状态：<dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view v-if="item.type === AiModelTypeEnum.CHAT" class="text-24rpx text-[#999]">
              温度 {{ item.temperature ?? '-' }} / Token {{ item.maxTokens ?? '-' }} / 上下文 {{ item.maxContexts ?? '-' }}
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['ai:model:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ModelVO } from '@/api/ai/model/model'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getModelPage } from '@/api/ai/model/model'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { AiModelTypeEnum, DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ModelVO[]>([]) // 列表数据
const queryParams = ref<Record<string, any>>({}) // 查询参数
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询模型列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getModelPage(params)
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

/** 新增模型 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-ai/model/model/form/index',
  })
}

/** 查看模型详情 */
function handleDetail(item: ModelVO) {
  uni.navigateTo({
    url: `/pages-ai/model/model/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:model:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:model:reload', reload)
})
</script>
