<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="敏感词"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 敏感词列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无敏感词数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between">
              <view class="line-clamp-1 flex-1 text-32rpx text-[#333] font-semibold">
                {{ item.word || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="flex items-center text-26rpx text-[#999]">
              <text class="mr-8rpx">{{ item.creatorName || '系统' }}</text>
              <text>{{ formatDateTime(item.createTime) || '-' }}</text>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['im:manager:sensitive-word:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerSensitiveWordVO } from '@/api/im/manager/sensitiveword'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getManagerSensitiveWordPage } from '@/api/im/manager/sensitiveword'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ImManagerSensitiveWordVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询敏感词列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerSensitiveWordPage({
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

/** 新增敏感词 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-im/manager/sensitive-word/form/index',
  })
}

/** 查看敏感词详情 */
function handleDetail(item: ImManagerSensitiveWordVO) {
  uni.navigateTo({
    url: `/pages-im/manager/sensitive-word/detail/index?id=${item.id}`,
  })
}

/** 注册敏感词变更监听 */
onMounted(() => {
  uni.$on('im:manager:sensitive-word:reload', reload)
})

/** 移除敏感词变更监听 */
onUnload(() => {
  uni.$off('im:manager:sensitive-word:reload', reload)
})
</script>
