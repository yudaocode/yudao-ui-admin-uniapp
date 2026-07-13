<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="表情包"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 表情包列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无表情包数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-center gap-20rpx p-24rpx">
            <wd-img
              v-if="item.icon"
              :src="item.icon"
              width="88rpx"
              height="88rpx"
              radius="12rpx"
              mode="aspectFill"
            />
            <view v-else class="h-88rpx w-88rpx flex items-center justify-center rounded-12rpx bg-[#f0f2f5] text-24rpx text-[#bbb]">
              无
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between">
                <text class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">{{ item.name || '-' }}</text>
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
              </view>
              <view class="mt-10rpx text-26rpx text-[#999]">
                排序 {{ item.sort ?? 0 }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['im:manager:face-pack:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getManagerFacePackPage } from '@/api/im/manager/face/pack'
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
const list = ref<ImManagerFacePackVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询表情包列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerFacePackPage({
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

/** 新增表情包 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-im/manager/face/pack/form/index',
  })
}

/** 查看表情包详情 */
function handleDetail(item: ImManagerFacePackVO) {
  uni.navigateTo({
    url: `/pages-im/manager/face/pack/detail/index?id=${item.id}`,
  })
}

/** 注册表情包变更监听 */
onMounted(() => {
  uni.$on('im:manager:face-pack:reload', reload)
})

/** 移除表情包变更监听 */
onUnload(() => {
  uni.$off('im:manager:face-pack:reload', reload)
})
</script>
