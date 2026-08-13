<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="凭证"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <!-- TODO @AI：在下面有搜搜框的情况下，界面有点丑。因为搜索框是占满 1 行的；而 AccountSetSwitch 和周边有间隙 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="handleAccountSetChange" />
      </view>

      <!-- 搜索组件 -->
      <SearchForm @search="handleQuery" @reset="handleReset" />

      <!-- 整理/移动凭证 -->
      <!-- TODO @AI：和上面的间隙不一致（貌似没生效） -->
      <!-- TODO @AI：目前的这个按钮样式，和别的模块是对齐的么？ -->
      <view v-if="canTidy || canMove" class="mx-24rpx mb-8rpx flex justify-end gap-24rpx">
        <wd-button v-if="canTidy" size="small" variant="plain" @click="tidyFormRef?.open()">
          整理凭证
        </wd-button>
        <wd-button v-if="canMove" size="small" variant="plain" @click="moveFormRef?.open()">
          移动凭证
        </wd-button>
      </view>
      <TidyForm ref="tidyFormRef" @success="reload" />
      <MoveForm ref="moveFormRef" @success="reload" />

      <!-- 凭证列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :refresher-enabled="true"
        :inside-more="true"
        :loading-more-default-as-loading="true"
        empty-view-text="暂无凭证数据"
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
                {{ item.voucherWordName || '-' }}-{{ item.voucherNumber }}
              </view>
              <wd-tag v-if="item.closingGenerated" type="info" plain>
                结账生成
              </wd-tag>
              <wd-tag v-else-if="item.status === FmsVoucherStatus.APPROVED" type="success" plain>
                已审核
              </wd-tag>
              <wd-tag v-else type="warning" plain>
                待审核
              </wd-tag>
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">凭证日期：</text>{{ formatDate(item.voucherTime) || '-' }}
            </view>
            <view class="mb-12rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">合计金额：</text>{{ formatFmsAmount(item.total) }}
            </view>
            <view
              v-for="entry in (item.entries || []).slice(0, 2)"
              :key="entry.id"
              class="mb-12rpx truncate text-28rpx text-[#666]"
            >
              <text class="mr-8rpx text-[#999]">摘要：</text>{{ entry.digest || '-' }}
            </view>
            <view v-if="(item.entries || []).length > 2" class="mb-12rpx text-24rpx text-[#999]">
              共 {{ (item.entries || []).length }} 条分录
            </view>
            <view class="text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">制单人：</text>{{ item.creatorUserName || '-' }}
              <text class="mx-16rpx text-[#999]">附件：</text>{{ item.attachmentUrls?.length || 0 }}
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
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
  </view>
</template>

<script lang="ts" setup>
import type { Voucher } from '@/api/fms/voucher'
import { onUnload } from '@dcloudio/uni-app'
import { getVoucherPage } from '@/api/fms/voucher'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set-guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set-switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsVoucherStatus } from '@/pages-fms/utils/constants'
import { formatFmsAmount } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import MoveForm from './components/move-form.vue'
import SearchForm from './components/search-form.vue'
import TidyForm from './components/tidy-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const list = ref<Voucher[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 当前账套可写且有新增权限时才允许新增 */
const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:voucher:create']))
/** 可写且有整理权限时显示整理凭证 */
const canTidy = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:voucher:tidy']))
/** 可写且有移动权限时显示移动凭证 */
const canMove = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:voucher:move']))
const tidyFormRef = ref<InstanceType<typeof TidyForm>>() // 整理凭证弹窗
const moveFormRef = ref<InstanceType<typeof MoveForm>>() // 移动凭证弹窗

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询凭证列表 */
async function queryList(pageNo: number, pageSize: number) {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getVoucherPage({
      ...queryParams.value,
      accountSetId,
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

/** 切换账套：凭证字等筛选条件随账套失效，清空后重新加载 */
function handleAccountSetChange() {
  queryParams.value = {}
  reload()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增凭证 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-fms/voucher/create/index' })
}

/** 查看详情 */
function handleDetail(item: Voucher) {
  uni.navigateTo({ url: `/pages-fms/voucher/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  uni.$on('fms:voucher:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:voucher:reload', reload)
})
</script>
