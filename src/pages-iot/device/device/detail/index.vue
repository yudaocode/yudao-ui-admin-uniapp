<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="设备图片">
          <wd-img
            v-if="formData?.picUrl"
            :src="formData.picUrl"
            width="160rpx"
            height="120rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="设备编号" :value="String(formData?.id || '-')" />
        <wd-cell title="DeviceName" :value="formData?.deviceName || '-'" />
        <wd-cell title="备注名称" :value="formData?.nickname || '-'" />
        <wd-cell title="所属产品" :value="productLabel" />
        <wd-cell title="ProductKey" :value="productKeyLabel" />
        <wd-cell title="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="formData?.deviceType" />
        </wd-cell>
        <wd-cell title="设备状态">
          <dict-tag :type="DICT_TYPE.IOT_DEVICE_STATE" :value="formData?.state" />
        </wd-cell>
        <wd-cell title="设备 IP" :value="formData?.ip || '-'" />
        <wd-cell title="固件版本" :value="formData?.firmwareVersion || '-'" />
        <wd-cell title="设备序列号" :value="formData?.serialNumber || '-'" />
        <wd-cell title="设备位置" :value="locationText" />
        <wd-cell title="激活时间" :value="formatDateTime(formData?.activeTime) || '-'" />
        <wd-cell title="上线时间" :value="formatDateTime(formData?.onlineTime) || '-'" />
        <wd-cell title="离线时间" :value="formatDateTime(formData?.offlineTime) || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['iot:device:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['iot:device:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <wd-button v-if="moreActions.length > 0" class="flex-1" type="info" :disabled="deleting || authLoading" @click="moreActionVisible = true">
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 认证信息弹窗 -->
    <wd-popup v-model="authVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          设备认证信息
        </view>
        <wd-cell-group border>
          <wd-cell title="ClientId">
            <view class="flex items-center justify-end gap-12rpx">
              <text class="min-w-0 flex-1 break-all text-right">{{ authInfo?.clientId || '-' }}</text>
              <wd-button
                v-if="authInfo?.clientId"
                size="small"
                type="primary"
                variant="plain"
                @click="handleCopy(authInfo?.clientId)"
              >
                复制
              </wd-button>
            </view>
          </wd-cell>
          <wd-cell title="Username">
            <view class="flex items-center justify-end gap-12rpx">
              <text class="min-w-0 flex-1 break-all text-right">{{ authInfo?.username || '-' }}</text>
              <wd-button
                v-if="authInfo?.username"
                size="small"
                type="primary"
                variant="plain"
                @click="handleCopy(authInfo?.username)"
              >
                复制
              </wd-button>
            </view>
          </wd-cell>
          <wd-cell title="Password">
            <view class="flex items-center justify-end gap-12rpx">
              <text class="min-w-0 flex-1 break-all text-right">{{ authPasswordText }}</text>
              <wd-button
                v-if="authInfo?.password"
                size="small"
                type="primary"
                variant="plain"
                @click="authPasswordVisible = !authPasswordVisible"
              >
                {{ authPasswordVisible ? '隐藏' : '显示' }}
              </wd-button>
              <wd-button
                v-if="authPasswordVisible && authInfo?.password"
                size="small"
                type="primary"
                variant="plain"
                @click="handleCopy(authInfo?.password)"
              >
                复制
              </wd-button>
            </view>
          </wd-cell>
        </wd-cell-group>
        <wd-button class="mt-24rpx" block @click="authVisible = false">
          关闭
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Device, IotDeviceAuthInfo } from '@/api/iot/device/device'
import type { Product } from '@/api/iot/product/product'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteDevice, getDevice, getDeviceAuthInfo } from '@/api/iot/device/device'
import { DeviceTypeEnum, getProduct, ProtocolTypeEnum } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<Device>() // 详情数据
const productData = ref<Product>() // 产品数据
const deleting = ref(false) // 删除状态
const authVisible = ref(false) // 认证信息弹窗
const authLoading = ref(false) // 认证信息加载状态
const authInfo = ref<IotDeviceAuthInfo>() // 认证信息
const authPasswordVisible = ref(false) // 认证密码显示状态
const moreActionVisible = ref(false) // 更多操作菜单
const isGateway = computed(() => formData.value?.deviceType === DeviceTypeEnum.GATEWAY) // 是否网关设备
const isModbusProduct = computed(() => { // 是否 Modbus 产品
  return [ProtocolTypeEnum.MODBUS_TCP_CLIENT, ProtocolTypeEnum.MODBUS_TCP_SERVER].includes(productData.value?.protocolType as ProtocolTypeEnum)
})
const locationText = computed(() => {
  if (formData.value?.longitude == null || formData.value?.latitude == null) {
    return '-'
  }
  return `${formData.value.longitude}, ${formData.value.latitude}`
}) // 设备位置
const productLabel = computed(() => productData.value?.name || formData.value?.productName || String(formData.value?.productId || '-')) // 产品名称
const productKeyLabel = computed(() => productData.value?.productKey || formData.value?.productKey || '-') // 产品标识
const authPasswordText = computed(() => {
  if (!authInfo.value?.password) {
    return '-'
  }
  return authPasswordVisible.value ? authInfo.value.password : '******'
}) // 认证密码展示文案
const moreActions = computed(() => { // 更多操作
  const actions: Array<{ name: string, value: string }> = [
    { name: '认证信息', value: 'auth' },
    { name: '物模型数据', value: 'thing-model' },
    { name: '设备消息', value: 'message' },
    { name: '模拟设备', value: 'simulator' },
    { name: '设备配置', value: 'config' },
  ]
  if (isGateway.value) {
    actions.push({ name: '子设备管理', value: 'sub-device' })
  }
  if (isModbusProduct.value) {
    actions.push({ name: 'Modbus 配置', value: 'modbus' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/device/device/index')
}

/** 加载设备详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getDevice(Number(props.id))
  if (formData.value.productId) {
    productData.value = await getProduct(Number(formData.value.productId))
  }
}

/** 编辑设备 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/device/device/form/index?id=${props.id}` })
}

/** 查看认证信息 */
async function handleAuthInfo() {
  if (!props.id) {
    return
  }
  authLoading.value = true
  try {
    authInfo.value = await getDeviceAuthInfo(Number(props.id))
    authPasswordVisible.value = false
    authVisible.value = true
  } finally {
    authLoading.value = false
  }
}

/** 查看物模型数据 */
function handleThingModel() {
  uni.navigateTo({ url: `/pages-iot/device/device/property/index?deviceId=${props.id}` })
}

/** 查看设备消息 */
function handleMessage() {
  uni.navigateTo({ url: `/pages-iot/device/device/message/index?deviceId=${props.id}` })
}

/** 模拟设备 */
function handleSimulator() {
  uni.navigateTo({ url: `/pages-iot/device/device/simulator/index?deviceId=${props.id}` })
}

/** 查看设备配置 */
function handleConfig() {
  uni.navigateTo({ url: `/pages-iot/device/device/config/index?deviceId=${props.id}` })
}

/** 查看子设备 */
function handleSubDevice() {
  uni.navigateTo({ url: `/pages-iot/device/device/sub-device/index?gatewayId=${props.id}` })
}

/** 查看 Modbus 配置 */
function handleModbus() {
  uni.navigateTo({ url: `/pages-iot/device/device/modbus/index?deviceId=${props.id}` })
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (deleting.value || authLoading.value) {
    return
  }
  switch (item.value) {
    case 'auth':
      handleAuthInfo()
      break
    case 'thing-model':
      handleThingModel()
      break
    case 'message':
      handleMessage()
      break
    case 'simulator':
      handleSimulator()
      break
    case 'config':
      handleConfig()
      break
    case 'sub-device':
      handleSubDevice()
      break
    case 'modbus':
      handleModbus()
      break
  }
}

/** 复制文本 */
function handleCopy(text?: string) {
  if (!text) {
    return
  }
  uni.setClipboardData({
    data: text,
    success: () => toast.success('复制成功'),
  })
}

/** 删除设备 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该设备吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDevice(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:device:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
