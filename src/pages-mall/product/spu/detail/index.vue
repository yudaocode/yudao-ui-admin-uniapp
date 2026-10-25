<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="商品详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 分组 tab：基础设置/价格库存/物流设置/商品详情/其它设置 -->
    <view class="bg-white">
      <wd-tabs v-model="activeTab" slidable="always">
        <wd-tab v-for="(tab, index) in SPU_DETAIL_TABS" :key="index" :title="tab" />
      </wd-tabs>
    </view>

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y>
      <view class="p-24rpx">
        <!-- 基础设置 -->
        <view v-show="activeTab === 0" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="商品名称" :value="formData.name || '-'" />
            <wd-cell title="商品分类" :value="categoryName || '-'" />
            <wd-cell title="商品品牌" :value="brandName || '-'" />
            <wd-cell title="关键字" :value="formData.keyword || '-'" />
            <wd-cell title="商品简介" :value="formData.introduction || '-'" />
          </wd-cell-group>
          <view class="p-24rpx">
            <view class="mb-12rpx text-26rpx text-[#999]">
              商品封面
            </view>
            <wd-img
              v-if="formData.picUrl"
              :src="formData.picUrl"
              width="160rpx" height="160rpx" radius="8rpx" mode="aspectFill"
              enable-preview
            />
            <text v-else class="block text-26rpx text-[#666]">-</text>
            <view class="mb-12rpx mt-20rpx text-26rpx text-[#999]">
              轮播图
            </view>
            <view v-if="formData.sliderPicUrls?.length" class="flex flex-wrap gap-12rpx">
              <wd-img
                v-for="(pic, index) in formData.sliderPicUrls"
                :key="index"
                :src="pic"
                width="140rpx" height="140rpx" radius="8rpx" mode="aspectFill"
                enable-preview
              />
            </view>
            <text v-else class="text-26rpx text-[#666]">-</text>
          </view>
        </view>

        <!-- 价格库存 -->
        <view v-show="activeTab === 1" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="商品规格" :value="formData.specType == null ? '-' : (formData.specType ? '多规格' : '单规格')" />
            <!-- 单规格：直接展示 SPU 价格 -->
            <template v-if="!formData.specType">
              <wd-cell title="销售价" :value="formatDisplayMoney(formData.price)" />
              <wd-cell title="市场价" :value="formatDisplayMoney(formData.marketPrice)" />
              <wd-cell title="成本价" :value="formatDisplayMoney(formData.costPrice)" />
            </template>
            <wd-cell title="库存" :value="formData.stock != null ? String(formData.stock) : '-'" />
            <wd-cell title="销量" :value="formData.salesCount != null ? String(formData.salesCount) : '-'" />
          </wd-cell-group>
          <!-- 多规格：各 SKU 规格明细 -->
          <view v-if="formData.specType && formData.skus?.length" class="p-24rpx">
            <view class="mb-16rpx text-28rpx text-[#333] font-medium">
              规格明细
            </view>
            <view
              v-for="(sku, index) in formData.skus"
              :key="index"
              class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-20rpx last:mb-0"
            >
              <view class="mb-12rpx flex items-center gap-16rpx">
                <wd-img
                  v-if="sku.picUrl"
                  :src="sku.picUrl"
                  width="80rpx" height="80rpx" radius="6rpx" mode="aspectFill"
                  enable-preview
                />
                <view class="min-w-0 flex-1 text-28rpx text-[#333] font-medium">
                  {{ sku.properties?.map(item => item.valueName).join(' / ') || '默认规格' }}
                </view>
              </view>
              <view class="flex flex-wrap gap-x-32rpx gap-y-8rpx text-26rpx text-[#666]">
                <text>销售价：{{ formatDisplayMoney(sku.price) }}</text>
                <text>市场价：{{ formatDisplayMoney(sku.marketPrice) }}</text>
                <text>成本价：{{ formatDisplayMoney(sku.costPrice) }}</text>
                <text>库存：{{ sku.stock ?? '-' }}</text>
                <text>销量：{{ sku.salesCount ?? '-' }}</text>
                <text v-if="sku.barCode">条码：{{ sku.barCode }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 物流设置 -->
        <view v-show="activeTab === 2" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="配送方式">
              <view v-if="formData.deliveryTypes?.length" class="flex flex-wrap justify-end gap-8rpx">
                <dict-tag
                  v-for="type in formData.deliveryTypes"
                  :key="type"
                  :type="DICT_TYPE.TRADE_DELIVERY_TYPE"
                  :value="type"
                />
              </view>
              <text v-else>-</text>
            </wd-cell>
            <wd-cell
              v-if="formData.deliveryTypes?.includes(DeliveryTypeEnum.EXPRESS)"
              title="运费模板"
              :value="templateName || '-'"
            />
          </wd-cell-group>
        </view>

        <!-- 商品详情 -->
        <view v-show="activeTab === 3" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx text-28rpx text-[#666] leading-relaxed">
            {{ formData.description || '-' }}
          </view>
        </view>

        <!-- 其它设置 -->
        <view v-show="activeTab === 4" class="overflow-hidden rounded-12rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
            <wd-cell title="赠送积分" :value="formData.giveIntegral != null ? String(formData.giveIntegral) : '-'" />
            <wd-cell title="虚拟销量" :value="formData.virtualSalesCount != null ? String(formData.virtualSalesCount) : '-'" />
            <wd-cell title="商品状态">
              <dict-tag v-if="formData.status != null" :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="formData.status" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
          </wd-cell-group>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['product:spu:update', 'product:spu:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['product:spu:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['product:spu:update']) && formData.status === ProductSpuStatusEnum.RECYCLE"
          class="flex-1"
          type="primary"
          :loading="statusChanging"
          @click="handleStatusChange(ProductSpuStatusEnum.DISABLE)"
        >
          恢复
        </wd-button>
        <wd-button
          v-else-if="hasAccessByCodes(['product:spu:update'])"
          class="flex-1"
          :loading="statusChanging"
          @click="handleStatusChange(ProductSpuStatusEnum.RECYCLE)"
        >
          回收
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['product:spu:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { ProductSpu } from '@/api/mall/product/spu'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSimpleProductBrandList } from '@/api/mall/product/brand'
import { getProductCategoryList } from '@/api/mall/product/category'
import { deleteProductSpu, getProductSpu, updateProductSpuStatus } from '@/api/mall/product/spu'
import { getSimpleDeliveryExpressTemplateList } from '@/api/mall/trade/delivery/express-template'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DeliveryTypeEnum, DICT_TYPE, ProductSpuStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const activeTab = ref(0) // 当前分组 tab 下标
const SPU_DETAIL_TABS = ['基础设置', '价格库存', '物流设置', '商品详情', '其它设置'] // 分组 tab
const formData = ref<ProductSpu>({}) // 详情数据
const deleting = ref(false) // 删除状态
const statusChanging = ref(false) // 回收/恢复切换中
const categoryNameMap = ref<Record<number, string>>({}) // 分类 id→名称（详情仅返回 categoryId，按 id 映射）
const brandNameMap = ref<Record<number, string>>({}) // 品牌 id→名称
const templateNameMap = ref<Record<number, string>>({}) // 运费模板 id→名称
const categoryName = computed(() => formData.value.categoryId != null ? categoryNameMap.value[formData.value.categoryId] : '')
const brandName = computed(() => formData.value.brandId != null ? brandNameMap.value[formData.value.brandId] : '')
const templateName = computed(() => formData.value.deliveryTemplateId != null ? templateNameMap.value[formData.value.deliveryTemplateId] : '')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/product/spu/index')
}

/** 加载分类/品牌/运费模板名称映射 */
async function loadOptions() {
  const [categories, brands, templates] = await Promise.all([
    getProductCategoryList({}),
    getSimpleProductBrandList(),
    getSimpleDeliveryExpressTemplateList(),
  ])
  categoryNameMap.value = Object.fromEntries(categories.map(item => [parseId(item.id) as number, item.name || String(item.id)]))
  brandNameMap.value = Object.fromEntries(brands.map(item => [parseId(item.id) as number, item.name || String(item.id)]))
  templateNameMap.value = Object.fromEntries(templates.map(item => [parseId(item.id) as number, item.name || String(item.id)]))
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getProductSpu(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/product/spu/form/index?id=${props.id}` })
}

/** 加入回收站 / 恢复到仓库 */
async function handleStatusChange(status: number) {
  if (!props.id) {
    return
  }
  const text = status === ProductSpuStatusEnum.RECYCLE ? '加入到回收站' : '恢复到仓库'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要将该商品${text}吗？` })
  } catch {
    return
  }
  statusChanging.value = true
  try {
    await updateProductSpuStatus({ id: props.id, status })
    toast.success(`${text}成功`)
    uni.$emit('mall:product-spu:reload')
    await getDetail()
  } finally {
    statusChanging.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该商品吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProductSpu(props.id)
    toast.success('删除成功')
    uni.$emit('mall:product-spu:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadOptions()
  getDetail()
  uni.$on('mall:product-spu:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:product-spu:reload', getDetail)
})
</script>
