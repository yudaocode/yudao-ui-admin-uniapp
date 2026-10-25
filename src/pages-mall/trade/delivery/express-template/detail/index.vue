<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="运费模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="模板名称" :value="formData.name || '-'" />
      <wd-cell title="计费方式" :value="formData.chargeMode != null ? getDictLabel(DICT_TYPE.EXPRESS_CHARGE_MODE, formData.chargeMode) : '-'" />
      <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
      <!-- 区域计费：展示条数，点击弹出明细 -->
      <wd-cell
        title="计费区域"
        :value="formData.charges?.length ? `${formData.charges.length} 个区域` : '-'"
        :is-link="!!formData.charges?.length"
        @click="formData.charges?.length && openRegionPopup('charge')"
      />
      <wd-cell
        title="包邮区域"
        :value="formData.frees?.length ? `${formData.frees.length} 个区域` : '-'"
        :is-link="!!formData.frees?.length"
        @click="formData.frees?.length && openRegionPopup('free')"
      />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['trade:delivery:express-template:update', 'trade:delivery:express-template:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['trade:delivery:express-template:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['trade:delivery:express-template:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>

    <!-- 区域计费明细弹窗 -->
    <wd-popup v-model="regionPopupVisible" position="bottom" round safe-area-inset-bottom>
      <view class="max-h-[70vh] overflow-y-auto p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ regionPopupTitle }}
        </view>
        <view v-if="regionPopupItems.length" class="flex flex-col gap-16rpx">
          <view v-for="(item, index) in regionPopupItems" :key="index" class="rounded-12rpx bg-[#f7f8fa] p-20rpx">
            <view class="mb-8rpx text-28rpx text-[#333]">
              {{ item.areaText }}
            </view>
            <view class="text-26rpx text-[#666]">
              {{ item.ruleText }}
            </view>
          </view>
        </view>
        <wd-empty v-else tip="暂无区域" />
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { DeliveryExpressTemplate } from '@/api/mall/trade/delivery/express-template'
import type { Area } from '@/api/system/area'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteDeliveryExpressTemplate, getDeliveryExpressTemplate } from '@/api/mall/trade/delivery/express-template'
import { getAreaTree } from '@/api/system/area'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { fenToYuan } from '@/utils/format'

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
const formData = ref<DeliveryExpressTemplate>({} as DeliveryExpressTemplate) // 详情数据
const deleting = ref(false) // 删除状态

const regionPopupVisible = ref(false) // 区域明细弹窗
const regionPopupType = ref<'charge' | 'free'>('charge') // 当前查看的区域类型
const areaNameMap = ref(new Map<number, string>()) // 地区 id→名称

const regionPopupTitle = computed(() => regionPopupType.value === 'charge' ? '计费区域' : '包邮区域') // 弹窗标题
const regionPopupItems = computed(() => { // 弹窗区域明细（地区名 + 规则，金额分→元）
  const list = (regionPopupType.value === 'charge' ? formData.value.charges : formData.value.frees) || []
  return (list as any[]).map((item) => {
    const areaText = (item.areaIds || []).map((id: number) => areaNameMap.value.get(id) || id).join('、') || '-'
    const ruleText = regionPopupType.value === 'charge'
      ? `首件 ${item.startCount ?? 0} 件 ${fenToYuan(item.startPrice).toFixed(2)} 元，续件 ${item.extraCount ?? 0} 件 ${fenToYuan(item.extraPrice).toFixed(2)} 元`
      : `满 ${item.freeCount ?? 0} 件 ${fenToYuan(item.freePrice).toFixed(2)} 元包邮`
    return { areaText, ruleText }
  })
})

/** 打开区域明细弹窗 */
function openRegionPopup(type: 'charge' | 'free') {
  regionPopupType.value = type
  regionPopupVisible.value = true
}

/** 递归展平地区树为 id→名称映射 */
function flattenArea(list: Area[]) {
  for (const area of list || []) {
    areaNameMap.value.set(area.id, area.name)
    if (area.children?.length) {
      flattenArea(area.children)
    }
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/express-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDeliveryExpressTemplate(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/trade/delivery/express-template/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该运费模板吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDeliveryExpressTemplate(props.id)
    toast.success('删除成功')
    uni.$emit('mall:delivery-express-template:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  flattenArea(await getAreaTree())
  await getDetail()
  uni.$on('mall:delivery-express-template:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:delivery-express-template:reload', getDetail)
})
</script>
