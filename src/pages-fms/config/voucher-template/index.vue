<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="凭证模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="getList" />
      </view>

      <!-- 模板分类 -->
      <view class="mt-24rpx flex items-center bg-white">
        <scroll-view scroll-x class="min-w-0 flex-1 whitespace-nowrap">
          <view class="inline-flex items-center gap-16rpx px-24rpx py-16rpx">
            <view
              v-for="item in categories"
              :key="item.id"
              class="rounded-8rpx px-24rpx py-12rpx text-26rpx"
              :class="item.id === currentCategory?.id ? 'bg-[#1677ff] text-white' : 'bg-[#f5f5f5] text-[#666]'"
              @click="handleCategoryChange(item)"
            >
              {{ item.name }}（{{ getCategoryTemplateCount(item.id) }}）
            </view>
            <view v-if="!loading && categories.length === 0" class="py-12rpx text-26rpx text-[#999]">
              暂无模板分类
            </view>
          </view>
        </scroll-view>
        <view v-if="canManageCategory" class="flex-shrink-0 px-24rpx" @click="openCategoryManage">
          <text class="text-26rpx text-[#1677ff]">管理分类</text>
        </view>
      </view>

      <!-- 凭证模板列表 -->
      <view class="p-24rpx">
        <view
          v-for="item in currentTemplates"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <wd-tag type="primary" plain>
              {{ item.entries.length }} 条分录
            </wd-tag>
          </view>
          <view class="mt-12rpx text-24rpx text-[#999]">
            模板分类：{{ item.categoryName || '-' }}
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && currentTemplates.length === 0" class="py-100rpx text-center">
          <wd-empty
            icon="content"
            :tip="currentCategory ? '暂无凭证模板' : '暂无凭证模板分类，请先新增分类'"
          />
        </view>
      </view>

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

    <!-- 分类管理弹窗 -->
    <CategoryManage ref="categoryManageRef" :account-set-id="fmsStore.accountSet?.id" @change="getList" />
  </view>
</template>

<script lang="ts" setup>
import type { VoucherTemplate } from '@/api/fms/config/voucher-template'
import type { VoucherTemplateCategory } from '@/api/fms/config/voucher-template-category'
import { onUnload } from '@dcloudio/uni-app'
import { getVoucherTemplateList } from '@/api/fms/config/voucher-template'
import { getVoucherTemplateCategoryList } from '@/api/fms/config/voucher-template-category'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { navigateBackPlus } from '@/utils'
import CategoryManage from './components/category-manage.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const loading = ref(false) // 列表加载状态
const templates = ref<VoucherTemplate[]>([]) // 凭证模板列表
const categories = ref<VoucherTemplateCategory[]>([]) // 凭证模板分类列表
const currentCategory = ref<VoucherTemplateCategory>() // 当前凭证模板分类
const categoryManageRef = ref<InstanceType<typeof CategoryManage>>() // 分类管理弹窗

const currentTemplates = computed(() =>
  templates.value.filter(item => item.categoryId === currentCategory.value?.id),
) // 当前分类的凭证模板列表

/** 账套可写且有分类维护权限时才允许管理分类 */
const canManageCategory = computed(() =>
  fmsStore.isAccountSetWritable
  && hasAccessByCodes([
    'fms:config:voucher-template-category:create',
    'fms:config:voucher-template-category:update',
    'fms:config:voucher-template-category:delete',
  ]),
)
/** 当前账套可写且有新增权限时才允许新增模板 */
const canCreate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:voucher-template:create']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询凭证模板和分类列表（账套级全量列表，不分页） */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    templates.value = []
    categories.value = []
    currentCategory.value = undefined
    return
  }
  loading.value = true
  try {
    ;[templates.value, categories.value] = await Promise.all([
      getVoucherTemplateList(accountSetId),
      getVoucherTemplateCategoryList(accountSetId),
    ])
    currentCategory.value
      = categories.value.find(item => item.id === currentCategory.value?.id) || categories.value[0]
  } finally {
    loading.value = false
  }
}

/** 统计分类下的模板数 */
function getCategoryTemplateCount(categoryId?: number) {
  return templates.value.filter(item => item.categoryId === categoryId).length
}

/** 切换凭证模板分类 */
function handleCategoryChange(item: VoucherTemplateCategory) {
  currentCategory.value = item
}

/** 打开分类管理弹窗 */
function openCategoryManage() {
  categoryManageRef.value?.open()
}

/** 新增凭证模板 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-fms/config/voucher-template/form/index' })
}

/** 查看详情 */
function handleDetail(item: VoucherTemplate) {
  uni.navigateTo({ url: `/pages-fms/config/voucher-template/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getList()
  uni.$on('fms:config:voucher-template:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:voucher-template:reload', getList)
})
</script>
