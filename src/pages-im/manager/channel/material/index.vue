<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="频道素材"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 素材列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无素材数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex gap-20rpx p-24rpx">
            <wd-img
              v-if="item.coverUrl"
              :src="item.coverUrl"
              width="120rpx"
              height="120rpx"
              radius="12rpx"
              mode="aspectFill"
            />
            <view v-else class="h-120rpx w-120rpx flex items-center justify-center rounded-12rpx bg-[#f0f2f5] text-24rpx text-[#bbb]">
              无封面
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between">
                <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">{{ item.title || '-' }}</text>
                <dict-tag :type="DICT_TYPE.IM_CHANNEL_MATERIAL_TYPE" :value="item.type" />
              </view>
              <view class="mt-10rpx text-26rpx text-[#999]">
                频道：{{ item.channelName || '-' }}
              </view>
              <view v-if="item.summary" class="line-clamp-2 mt-6rpx text-26rpx text-[#999]">
                {{ item.summary }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['im:manager:channel-material:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerChannelMaterialVO } from '@/api/im/manager/channel/material'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getManagerChannelMaterialPage } from '@/api/im/manager/channel/material'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ImManagerChannelMaterialVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询素材列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerChannelMaterialPage({
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

/** 新增素材 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-im/manager/channel/material/form/index',
  })
}

/** 查看频道素材详情 */
function handleDetail(item: ImManagerChannelMaterialVO) {
  uni.navigateTo({
    url: `/pages-im/manager/channel/material/detail/index?id=${item.id}`,
  })
}

/** 注册频道素材变更监听 */
onMounted(() => {
  uni.$on('im:manager:channel-material:reload', reload)
})

/** 移除频道素材变更监听 */
onUnload(() => {
  uni.$off('im:manager:channel-material:reload', reload)
})
</script>
