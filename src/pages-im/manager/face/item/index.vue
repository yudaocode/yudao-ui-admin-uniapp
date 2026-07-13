<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="表情列表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm
      :pack-id="props.packId ? Number(props.packId) : undefined"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 表情列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无表情数据"
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
              v-if="item.url"
              :src="item.url"
              width="100rpx"
              height="100rpx"
              radius="12rpx"
              mode="aspectFit"
            />
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between">
                <text class="line-clamp-1 flex-1 text-30rpx text-[#333] font-semibold">{{ item.name || '未命名' }}</text>
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
              </view>
              <view class="mt-8rpx text-26rpx text-[#999]">
                {{ item.width }} × {{ item.height }} · 排序 {{ item.sort ?? 0 }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['im:manager:face-pack-item:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackItemVO } from '@/api/im/manager/face/item'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getManagerFacePackItemPage } from '@/api/im/manager/face/item'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  packId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ImManagerFacePackItemVO[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({ // 查询参数
  packId: props.packId ? Number(props.packId) : undefined,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/face/pack/index')
}

/** 查询表情列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getManagerFacePackItemPage({
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
  handleQuery({ packId: props.packId ? Number(props.packId) : undefined })
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增表情 */
function handleAdd() {
  const query = props.packId ? `?packId=${props.packId}` : ''
  uni.navigateTo({ url: `/pages-im/manager/face/item/form/index${query}` })
}

/** 查看表情详情 */
function handleDetail(item: ImManagerFacePackItemVO) {
  uni.navigateTo({
    url: `/pages-im/manager/face/item/detail/index?id=${item.id}`,
  })
}

/** 注册表情变更监听 */
onMounted(() => {
  uni.$on('im:manager:face-pack-item:reload', reload)
})

/** 移除表情变更监听 */
onUnload(() => {
  uni.$off('im:manager:face-pack-item:reload', reload)
})
</script>
