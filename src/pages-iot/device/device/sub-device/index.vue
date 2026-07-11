<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="子设备管理" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 操作栏 -->
    <view v-if="hasAccessByCodes(['iot:device:update'])" class="flex gap-16rpx p-24rpx">
      <wd-button class="flex-1" type="primary" @click="openBindPopup">
        添加子设备
      </wd-button>
      <wd-button
        class="flex-1"
        type="danger"
        variant="plain"
        :disabled="selectedIds.length === 0 || unbindingBatch"
        :loading="unbindingBatch"
        @click="handleUnbindBatch"
      >
        批量解绑
      </wd-button>
    </view>

    <!-- 子设备列表 -->
    <view class="min-h-0 flex-1 overflow-y-auto px-24rpx pb-24rpx">
      <wd-loading v-if="loading" />
      <view v-else-if="list.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无子设备
      </view>
      <wd-checkbox-group v-else v-model="selectedIds">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <wd-checkbox
              v-if="hasAccessByCodes(['iot:device:update']) && item.id"
              :name="item.id"
              @click.stop
            />
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ item.deviceName || '-' }}
            </view>
            <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="item.state" />
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">备注名称：</text>{{ item.nickname || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">所属产品：</text>{{ item.productName || item.productId || '-' }}
          </view>
          <view class="flex items-center justify-between">
            <text class="text-24rpx text-[#999]">{{ formatDateTime(item.onlineTime) || '-' }}</text>
            <wd-button
              v-if="hasAccessByCodes(['iot:device:update'])"
              size="small"
              type="danger"
              variant="plain"
              :loading="unbindingId === item.id"
              @click.stop="handleUnbind(item)"
            >
              解绑
            </wd-button>
          </view>
        </view>
      </wd-checkbox-group>
    </view>

    <!-- 绑定子设备弹窗 -->
    <wd-popup v-model="bindVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[80vh] p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          添加子设备（{{ bindTotal }}）
        </view>
        <view class="mb-24rpx">
          <ProductFormPicker
            v-model="bindQueryParams.productId"
            label="产品"
            placeholder="请选择产品"
            :device-type="DeviceTypeEnum.GATEWAY_SUB"
          />
        </view>
        <view class="mb-24rpx flex gap-16rpx">
          <wd-input v-model="bindQueryParams.deviceName" class="flex-1" placeholder="请输入 DeviceName" clearable />
          <wd-button type="primary" @click="handleQuery">
            搜索
          </wd-button>
          <wd-button variant="plain" @click="handleReset">
            重置
          </wd-button>
        </view>
        <view class="h-[48vh]">
          <z-paging
            ref="bindPagingRef"
            v-model="bindList"
            :fixed="false"
            class="h-full"
            :default-page-size="10"
            :refresher-enabled="true"
            :inside-more="true"
            :loading-more-default-as-loading="true"
            empty-view-text="暂无可绑定子设备"
            @query="queryBindableList"
          >
            <view class="pb-12rpx">
              <wd-checkbox-group v-model="bindSelectedIds">
                <view v-for="item in bindList" :key="item.id" class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx">
                  <view class="mb-8rpx flex items-center gap-12rpx">
                    <wd-checkbox v-if="item.id" :name="item.id" />
                    <view class="min-w-0 flex-1 text-28rpx text-[#333] font-medium">
                      {{ item.deviceName || '-' }}
                    </view>
                  </view>
                  <view class="mb-12rpx text-24rpx text-[#666]">
                    所属产品：{{ item.productName || item.productId || '-' }}
                  </view>
                  <wd-button size="small" type="primary" :loading="bindingId === item.id" @click="handleBind(item)">
                    绑定
                  </wd-button>
                </view>
              </wd-checkbox-group>
            </view>
          </z-paging>
        </view>
        <view class="mt-24rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="bindVisible = false">
            关闭
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="bindingBatch" @click="handleBindBatch">
            确定（已选 {{ bindSelectedIds.length }} 个）
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Device } from '@/api/iot/device/device'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { nextTick, onMounted, ref } from 'vue'
import { bindDeviceGateway, getSubDeviceList, getUnboundSubDevicePage, unbindDeviceGateway } from '@/api/iot/device/device'
import { DeviceTypeEnum } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import ProductFormPicker from '@/pages-iot/product/product/components/product-form-picker.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ gatewayId?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const loading = ref(false) // 列表加载状态
const list = ref<Device[]>([]) // 子设备列表
const selectedIds = ref<number[]>([]) // 选中的子设备编号
const unbindingId = ref<number>() // 解绑中的设备编号
const unbindingBatch = ref(false) // 批量解绑状态
const bindVisible = ref(false) // 绑定弹窗显示状态
const bindQueryParams = ref<Record<string, any>>({ // 绑定查询参数
  productId: undefined,
  deviceName: '',
})
const bindPagingRef = ref<any>() // 绑定分页组件引用
const bindList = ref<Device[]>([]) // 可绑定子设备
const bindSelectedIds = ref<number[]>([]) // 绑定选中的设备编号
const bindTotal = ref(0) // 可绑定总数
const bindingId = ref<number>() // 绑定中的设备编号
const bindingBatch = ref(false) // 批量绑定状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.gatewayId}`)
}

/** 查询子设备列表 */
async function getList() {
  if (!props.gatewayId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getSubDeviceList(Number(props.gatewayId))
  } finally {
    loading.value = false
  }
}

/** 查看子设备详情 */
function handleDetail(item: Device) {
  if (!item.id) {
    return
  }
  uni.navigateTo({ url: `/pages-iot/device/device/detail/index?id=${item.id}` })
}

/** 打开绑定弹窗 */
function openBindPopup() {
  bindSelectedIds.value = []
  bindQueryParams.value = {
    productId: undefined,
    deviceName: '',
  }
  bindVisible.value = true
  nextTick(() => bindPagingRef.value?.reload())
}

/** 查询可绑定子设备 */
async function queryBindableList(pageNo: number, pageSize: number) {
  try {
    const data = await getUnboundSubDevicePage({
      pageNo,
      pageSize,
      productId: bindQueryParams.value.productId,
      deviceName: bindQueryParams.value.deviceName || undefined,
    })
    bindTotal.value = data.total
    bindPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    bindPagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  bindSelectedIds.value = []
  bindPagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  bindQueryParams.value = {
    productId: undefined,
    deviceName: '',
  }
  handleQuery()
}

/** 绑定子设备 */
async function handleBind(item: Device) {
  if (!props.gatewayId || !item.id) {
    return
  }
  bindingId.value = item.id
  try {
    await bindDeviceGateway({ gatewayId: Number(props.gatewayId), subIds: [item.id] })
    toast.success('绑定成功')
    bindSelectedIds.value = bindSelectedIds.value.filter(id => id !== item.id)
    await getList()
    bindPagingRef.value?.reload()
  } finally {
    bindingId.value = undefined
  }
}

/** 批量绑定子设备 */
async function handleBindBatch() {
  if (!props.gatewayId || bindSelectedIds.value.length === 0) {
    toast.warning('请选择要绑定的子设备')
    return
  }
  bindingBatch.value = true
  try {
    await bindDeviceGateway({ gatewayId: Number(props.gatewayId), subIds: bindSelectedIds.value })
    toast.success('绑定成功')
    bindSelectedIds.value = []
    bindVisible.value = false
    await getList()
  } finally {
    bindingBatch.value = false
  }
}

/** 解绑子设备 */
async function handleUnbind(item: Device) {
  if (!props.gatewayId || !item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要解绑该子设备吗？' })
  } catch {
    return
  }
  unbindingId.value = item.id
  try {
    await unbindDeviceGateway({ gatewayId: Number(props.gatewayId), subIds: [item.id] })
    toast.success('解绑成功')
    selectedIds.value = selectedIds.value.filter(id => id !== item.id)
    await getList()
  } finally {
    unbindingId.value = undefined
  }
}

/** 批量解绑子设备 */
async function handleUnbindBatch() {
  if (!props.gatewayId || selectedIds.value.length === 0 || unbindingBatch.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要解绑选中的 ${selectedIds.value.length} 个子设备吗？` })
  } catch {
    return
  }
  unbindingBatch.value = true
  try {
    await unbindDeviceGateway({ gatewayId: Number(props.gatewayId), subIds: [...selectedIds.value] })
    toast.success('批量解绑成功')
    selectedIds.value = []
    await getList()
  } finally {
    unbindingBatch.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
