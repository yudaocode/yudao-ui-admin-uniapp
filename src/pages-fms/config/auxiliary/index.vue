<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="辅助核算"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="reload" />
      </view>

      <!-- 类别列表 -->
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        class="min-h-0 flex-1"
        :refresher-enabled="true"
        empty-view-text="暂无辅助核算类别"
        @query="queryList"
      >
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-24rpx flex items-center justify-between gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            @click="handleItems(item)"
          >
            <view class="min-w-0 flex flex-1 items-center gap-12rpx">
              <text class="truncate text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </text>
              <wd-tag v-if="!item.systemPreset" type="warning" plain>
                自定义
              </wd-tag>
            </view>
            <view
              class="flex shrink-0 items-center gap-4rpx text-26rpx text-[#999]"
              @click.stop="handleDetail(item)"
            >
              <text>详情</text>
              <wd-icon name="arrow-right" size="24rpx" color="#999" />
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
    <AccountSetGuide />
  </view>
</template>

<script lang="ts" setup>
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import { onUnload } from '@dcloudio/uni-app'
import { getAuxiliaryTypeList } from '@/api/fms/config/auxiliary/type'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const list = ref<AuxiliaryType[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:auxiliary:create'])) // 当前账套可写且有新增权限时才允许新增

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询辅助核算类别列表（账套级全量列表，不分页） */
async function queryList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getAuxiliaryTypeList(accountSetId)
    pagingRef.value?.complete(data)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增类别 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-fms/config/auxiliary/form/index' })
}

/** 查看类别详情 */
function handleDetail(item: AuxiliaryType) {
  uni.navigateTo({ url: `/pages-fms/config/auxiliary/detail/index?id=${item.id}` })
}

/** 进入该类别的项目列表 */
function handleItems(item: AuxiliaryType) {
  uni.navigateTo({ url: `/pages-fms/config/auxiliary/item/index?auxiliaryTypeId=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  uni.$on('fms:config:auxiliary:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:auxiliary:reload', reload)
})
</script>
