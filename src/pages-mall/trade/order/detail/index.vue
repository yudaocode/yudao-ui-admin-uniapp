<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="订单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="formData" class="p-24rpx">
        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0">
              <view class="truncate text-32rpx text-[#333] font-semibold">
                {{ formData.no || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#999]">
                下单时间：{{ formatDateTime(formData.createTime) || '-' }}
              </view>
            </view>
            <dict-tag :type="DICT_TYPE.TRADE_ORDER_STATUS" :value="formData.status" />
          </view>
          <view class="grid grid-cols-2 gap-x-20rpx gap-y-12rpx text-26rpx">
            <view><text class="text-[#999]">买家：</text>{{ formData.user?.nickname || '-' }}</view>
            <view><text class="text-[#999]">来源：</text>{{ getDictLabel(DICT_TYPE.TERMINAL, formData.terminal) || '-' }}</view>
            <view><text class="text-[#999]">类型：</text>{{ getDictLabel(DICT_TYPE.TRADE_ORDER_TYPE, formData.type) || '-' }}</view>
            <view><text class="text-[#999]">支付：</text>{{ formData.payStatus ? '已支付' : '未支付' }}</view>
            <view v-if="formData.brokerageUser">
              <text class="text-[#999]">推广用户：</text>{{ formData.brokerageUser.nickname || '-' }}
            </view>
            <view v-if="formData.payOrderId">
              <text class="text-[#999]">支付单号：</text>{{ formData.payOrderId }}
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            金额信息
          </view>
          <view class="grid grid-cols-2 gap-x-20rpx gap-y-12rpx text-26rpx">
            <view><text class="text-[#999]">商品原价：</text>{{ formatDisplayMoney(formData.totalPrice) }}</view>
            <view><text class="text-[#999]">运费：</text>{{ formatDisplayMoney(formData.deliveryPrice) }}</view>
            <view><text class="text-[#999]">优惠金额：</text>{{ formatDisplayMoney(formData.discountPrice) }}</view>
            <view><text class="text-[#999]">优惠券：</text>{{ formatDisplayMoney(formData.couponPrice) }}</view>
            <view><text class="text-[#999]">积分抵扣：</text>{{ formatDisplayMoney(formData.pointPrice) }}</view>
            <view><text class="text-[#999]">VIP 优惠：</text>{{ formatDisplayMoney(formData.vipPrice) }}</view>
            <view><text class="text-[#999]">订单调价：</text>{{ formatDisplayMoney(formData.adjustPrice) }}</view>
            <view class="text-[#fa4350] font-semibold">
              <text>实付：</text>{{ formatDisplayMoney(formData.payPrice) }}
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            收货与配送
          </view>
          <view class="text-26rpx text-[#333] space-y-10rpx">
            <view><text class="text-[#999]">配送方式：</text>{{ getDictLabel(DICT_TYPE.TRADE_DELIVERY_TYPE, formData.deliveryType) || '-' }}</view>
            <view v-if="formData.deliveryType === DeliveryTypeEnum.PICK_UP">
              <text class="text-[#999]">自提门店：</text>{{ pickUpStoreName || '-' }}
            </view>
            <view v-if="formData.deliveryTime">
              <text class="text-[#999]">发货时间：</text>{{ formatDateTime(formData.deliveryTime) }}
            </view>
            <view><text class="text-[#999]">收件人：</text>{{ formData.receiverName || '-' }}</view>
            <view><text class="text-[#999]">联系电话：</text>{{ formData.receiverMobile || '-' }}</view>
            <view><text class="text-[#999]">收货地址：</text>{{ formData.receiverAreaName || '' }} {{ formData.receiverDetailAddress || '' }}</view>
            <view v-if="formData.pickUpVerifyCode">
              <text class="text-[#999]">核销码：</text>{{ formData.pickUpVerifyCode }}
            </view>
            <view v-if="formData.logisticsNo">
              <text class="text-[#999]">物流单号：</text>{{ formData.logisticsNo }}
            </view>
            <view v-if="expressTracks.length">
              <text class="text-[#999]">物流轨迹：</text>
              <view class="mt-8rpx rounded-8rpx bg-[#f8f8f8] p-16rpx">
                <view v-for="(item, index) in expressTracks" :key="index" class="mb-8rpx last:mb-0">
                  {{ item.time || item.createTime || '' }} {{ item.content || item.context || '' }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            商品明细
          </view>
          <view
            v-for="item in formData.items || []"
            :key="item.id"
            class="mb-16rpx flex gap-20rpx rounded-8rpx bg-[#f8f8f8] p-16rpx last:mb-0"
          >
            <wd-img
              v-if="item.picUrl"
              :src="item.picUrl"
              width="112rpx" height="112rpx" radius="8rpx" mode="aspectFill"
              enable-preview
            />
            <view class="min-w-0 flex-1">
              <view class="line-clamp-2 text-28rpx text-[#333] font-semibold">
                {{ item.spuName || '-' }}
              </view>
              <view class="mt-8rpx text-24rpx text-[#777]">
                x{{ item.count || 0 }} / {{ formatDisplayMoney(item.payPrice) }}
              </view>
              <view v-if="item.properties?.length" class="mt-8rpx text-22rpx text-[#999]">
                {{ item.properties.map(prop => `${prop.propertyName}:${prop.valueName}`).join('；') }}
              </view>
            </view>
          </view>
        </view>

        <view class="mb-160rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
            备注与日志
          </view>
          <view class="mb-16rpx rounded-8rpx bg-[#f8f8f8] p-16rpx text-26rpx">
            <view><text class="text-[#999]">买家留言：</text>{{ formData.userRemark || '-' }}</view>
            <view class="mt-8rpx">
              <text class="text-[#999]">商家备注：</text>{{ formData.remark || '-' }}
            </view>
          </view>
          <view v-for="(log, index) in formData.logs || []" :key="index" class="mb-12rpx text-24rpx text-[#666] last:mb-0">
            <text class="text-[#999]">{{ formatDateTime(log.createTime) || '-' }}</text>
            <text class="ml-12rpx">{{ log.content || '-' }}</text>
          </view>
        </view>
      </view>

      <wd-empty v-else icon="content" tip="订单不存在" />
    </scroll-view>

    <!-- 底部操作按钮：按状态/权限显式展示，每个动作各自的按钮 + 处理函数 -->
    <view v-if="formData && (canRemark || canPrice || canDelivery || canAddress || canPickUp)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canRemark" class="flex-1" type="warning" @click="openRemark">
          备注
        </wd-button>
        <wd-button v-if="canPrice" class="flex-1" type="primary" @click="openPrice">
          改价
        </wd-button>
        <wd-button v-if="canDelivery" class="flex-1" type="primary" @click="openDelivery">
          发货
        </wd-button>
        <wd-button v-if="canAddress" class="flex-1" @click="openAddress">
          改地址
        </wd-button>
        <wd-button v-if="canPickUp" class="flex-1" type="success" :loading="submitting" @click="handlePickUp">
          核销
        </wd-button>
      </view>
    </view>

    <!-- 修改备注 -->
    <wd-popup v-model="remarkVisible" position="bottom" closable custom-style="border-radius: 24rpx 24rpx 0 0;" @close="remarkVisible = false">
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          修改备注
        </view>
        <wd-textarea v-model="remarkForm.remark" clearable :maxlength="2000" placeholder="请输入商家备注" />
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="remarkVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleRemark">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 订单改价 -->
    <wd-popup v-model="priceVisible" position="bottom" closable custom-style="border-radius: 24rpx 24rpx 0 0;" @close="priceVisible = false">
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          订单改价
        </view>
        <view class="mb-12rpx flex items-center gap-16rpx">
          <text class="shrink-0 text-28rpx text-[#666]">订单调价</text>
          <wd-input-number v-model="priceForm.adjustPrice" :min="-999999" :step="0.01" :precision="2" />
        </view>
        <view class="text-24rpx text-[#999]">
          正数加价，负数减价（单位：元）
        </view>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="priceVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handlePrice">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 订单发货 -->
    <wd-popup v-model="deliveryVisible" position="bottom" closable custom-style="border-radius: 24rpx 24rpx 0 0;" @close="deliveryVisible = false">
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          订单发货
        </view>
        <view class="mb-16rpx flex items-center gap-16rpx">
          <text class="w-160rpx shrink-0 text-28rpx text-[#666]">快递公司</text>
          <view class="min-w-0 flex-1" @click="expressPickerVisible = true">
            <wd-input :model-value="expressName" readonly placeholder="请选择快递公司" />
          </view>
        </view>
        <view class="flex items-center gap-16rpx">
          <text class="w-160rpx shrink-0 text-28rpx text-[#666]">快递单号</text>
          <wd-input v-model="deliveryForm.logisticsNo" class="min-w-0 flex-1" clearable placeholder="请输入快递单号" />
        </view>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="deliveryVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleDelivery">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 快递公司选择器 -->
    <wd-picker
      v-model:visible="expressPickerVisible"
      :model-value="deliveryForm.logisticsId"
      :columns="expressList"
      label-key="name"
      value-key="id"
      @confirm="({ value }) => deliveryForm.logisticsId = Number(value[0])"
    />

    <!-- 修改地址 -->
    <wd-popup v-model="addressVisible" position="bottom" closable custom-style="border-radius: 24rpx 24rpx 0 0;" @close="addressVisible = false">
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          修改地址
        </view>
        <wd-form :model="addressForm">
          <wd-cell-group border>
            <wd-form-item title="收件人" title-width="180rpx">
              <wd-input v-model="addressForm.receiverName" clearable placeholder="请输入收件人" />
            </wd-form-item>
            <wd-form-item title="手机号" title-width="180rpx">
              <wd-input v-model="addressForm.receiverMobile" clearable placeholder="请输入手机号" />
            </wd-form-item>
            <yd-tree-select
              v-model="addressForm.receiverAreaId"
              label="所在地区"
              label-width="180rpx"
              :data="areaTree"
              placeholder="请选择所在地区"
            />
            <wd-form-item title="详细地址" title-width="180rpx">
              <wd-textarea v-model="addressForm.receiverDetailAddress" clearable :maxlength="2000" placeholder="请输入详细地址" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="addressVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleAddress">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { TradeOrder } from '@/api/mall/trade/order'
import type { DeliveryExpress } from '@/api/mall/trade/delivery/express'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  deliveryTradeOrder,
  getTradeOrder,
  getTradeOrderExpressTrackList,
  pickUpTradeOrder,
  updateTradeOrderAddress,
  updateTradeOrderPrice,
  updateTradeOrderRemark,
} from '@/api/mall/trade/order'
import { getSimpleDeliveryExpressList } from '@/api/mall/trade/delivery/express'
import { getSimpleDeliveryPickUpStoreList } from '@/api/mall/trade/delivery/pick-up-store'
import { getAreaTree } from '@/api/system/area'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney, yuanToFen } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { DeliveryTypeEnum, DICT_TYPE, TradeOrderStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const detailId = computed(() => props.id != null && props.id !== '' ? Number(props.id) : undefined) // 订单编号（路由透传）
const formData = ref<TradeOrder>() // 订单详情
const expressTracks = ref<Record<string, any>[]>([]) // 物流轨迹
const areaTree = ref<any[]>([]) // 地区树（修改地址用）
const submitting = ref(false) // 动作提交状态

const remarkVisible = ref(false) // 备注弹窗
const priceVisible = ref(false) // 改价弹窗
const deliveryVisible = ref(false) // 发货弹窗
const addressVisible = ref(false) // 改地址弹窗
const remarkForm = reactive({ remark: '' }) // 备注表单
const priceForm = reactive({ adjustPrice: 0 }) // 改价表单（元）
const deliveryForm = reactive<{ logisticsId?: number, logisticsNo: string }>({ logisticsId: undefined, logisticsNo: '' }) // 发货表单
const addressForm = reactive<Record<string, any>>({ receiverName: '', receiverMobile: '', receiverAreaId: undefined, receiverDetailAddress: '' }) // 地址表单
const expressPickerVisible = ref(false) // 快递公司选择器
const expressList = ref<DeliveryExpress[]>([]) // 快递公司列表
const expressName = computed(() => expressList.value.find(item => item.id === deliveryForm.logisticsId)?.name || '') // 当前选中快递公司名
const pickUpStoreList = ref<Record<string, any>[]>([]) // 自提门店列表（解析门店名）
const pickUpStoreName = computed(() => pickUpStoreList.value.find(item => item.id === formData.value?.pickUpStoreId)?.name || '') // 自提门店名

// 各动作可见性：按权限 + 订单状态 + 配送方式判断
const canRemark = computed(() => !!formData.value && hasAccessByCodes(['trade:order:update'])) // 备注任意状态可改
const canPrice = computed(() => canRemark.value && formData.value?.status === TradeOrderStatusEnum.UNPAID) // 待付款可改价
const canDelivery = computed(() => canRemark.value && formData.value?.status === TradeOrderStatusEnum.UNDELIVERED && formData.value?.deliveryType === DeliveryTypeEnum.EXPRESS) // 待发货 + 快递
const canAddress = computed(() => canDelivery.value) // 与发货同条件
const canPickUp = computed(() => !!formData.value && hasAccessByCodes(['trade:order:pick-up']) && formData.value?.status === TradeOrderStatusEnum.UNDELIVERED && formData.value?.deliveryType === DeliveryTypeEnum.PICK_UP) // 待发货 + 自提

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/order/index')
}

/** 加载详情 */
async function loadDetail() {
  if (!detailId.value) {
    return
  }
  formData.value = await getTradeOrder(detailId.value)
  expressTracks.value = formData.value.logisticsId ? await getTradeOrderExpressTrackList(detailId.value) : []
}

/** 提交后统一处理：成功提示 + 通知列表刷新 + 重载详情 */
async function afterSubmit() {
  toast.success('操作成功')
  uni.$emit('mall:trade-order:reload')
  await loadDetail()
}

/** 打开备注弹窗 */
function openRemark() {
  remarkForm.remark = formData.value?.remark || ''
  remarkVisible.value = true
}

/** 修改备注 */
async function handleRemark() {
  if (!remarkForm.remark?.trim()) {
    toast.warning('请输入商家备注')
    return
  }
  submitting.value = true
  try {
    await updateTradeOrderRemark({ id: detailId.value, remark: remarkForm.remark })
    remarkVisible.value = false
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 打开改价弹窗 */
function openPrice() {
  priceForm.adjustPrice = 0
  priceVisible.value = true
}

/** 订单改价 */
async function handlePrice() {
  if (submitting.value) {
    return
  }
  const adjustPrice = yuanToFen(priceForm.adjustPrice)
  if (adjustPrice === 0) {
    toast.warning('请输入本次调价金额')
    return
  }
  submitting.value = true
  try {
    await updateTradeOrderPrice({ id: detailId.value, adjustPrice })
    priceVisible.value = false
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 打开发货弹窗 */
function openDelivery() {
  deliveryForm.logisticsId = formData.value?.logisticsId
  deliveryForm.logisticsNo = formData.value?.logisticsNo || ''
  deliveryVisible.value = true
}

/** 订单发货 */
async function handleDelivery() {
  if (!deliveryForm.logisticsId) {
    toast.warning('请选择快递公司')
    return
  }
  if (!deliveryForm.logisticsNo?.trim()) {
    toast.warning('请输入快递单号')
    return
  }
  submitting.value = true
  try {
    await deliveryTradeOrder({ id: detailId.value, logisticsId: deliveryForm.logisticsId ?? null, logisticsNo: deliveryForm.logisticsNo })
    deliveryVisible.value = false
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 打开改地址弹窗 */
function openAddress() {
  addressForm.receiverName = formData.value?.receiverName || ''
  addressForm.receiverMobile = formData.value?.receiverMobile || ''
  addressForm.receiverAreaId = formData.value?.receiverAreaId
  addressForm.receiverDetailAddress = formData.value?.receiverDetailAddress || ''
  addressVisible.value = true
}

/** 修改地址 */
async function handleAddress() {
  if (!addressForm.receiverName?.trim() || !addressForm.receiverMobile?.trim() || addressForm.receiverAreaId == null || !addressForm.receiverDetailAddress?.trim()) {
    toast.warning('请完善收货信息')
    return
  }
  submitting.value = true
  try {
    await updateTradeOrderAddress({ id: detailId.value, ...addressForm })
    addressVisible.value = false
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 订单核销（自提） */
async function handlePickUp() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要核销该订单吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await pickUpTradeOrder(Number(detailId.value))
    await afterSubmit()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    loadDetail(),
    getAreaTree().then((list) => {
      areaTree.value = list
    }),
    getSimpleDeliveryExpressList().then((list) => {
      expressList.value = list
    }),
    getSimpleDeliveryPickUpStoreList().then((list) => {
      pickUpStoreList.value = list
    }),
  ])
})
</script>
