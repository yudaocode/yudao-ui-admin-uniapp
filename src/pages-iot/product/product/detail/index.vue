<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="产品图标">
          <wd-img
            v-if="formData?.icon"
            :src="formData.icon"
            width="96rpx"
            height="96rpx"
            radius="12rpx"
            mode="aspectFill"
            enable-preview
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="产品图片">
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
        <wd-cell title="产品编号" :value="String(formData?.id || '-')" />
        <wd-cell title="产品名称" :value="formData?.name || '-'" />
        <wd-cell title="ProductKey">
          <view class="flex items-center justify-end gap-12rpx">
            <text class="min-w-0 flex-1 break-all text-right">{{ formData?.productKey || '-' }}</text>
            <wd-button
              v-if="formData?.productKey"
              size="small"
              type="primary"
              variant="plain"
              @click="handleCopy(formData?.productKey)"
            >
              复制
            </wd-button>
          </view>
        </wd-cell>
        <wd-cell title="产品密钥">
          <view class="flex items-center justify-end gap-12rpx">
            <text class="min-w-0 flex-1 break-all text-right">{{ productSecretText }}</text>
            <wd-button
              v-if="formData?.productSecret"
              size="small"
              type="primary"
              variant="plain"
              @click="secretVisible = !secretVisible"
            >
              {{ secretVisible ? '隐藏' : '显示' }}
            </wd-button>
            <wd-button
              v-if="secretVisible && formData?.productSecret"
              size="small"
              type="primary"
              variant="plain"
              @click="handleCopy(formData?.productSecret)"
            >
              复制
            </wd-button>
          </view>
        </wd-cell>
        <wd-cell title="产品分类" :value="formData?.categoryName || '-'" />
        <wd-cell title="设备类型">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE" :value="formData?.deviceType" />
        </wd-cell>
        <wd-cell v-if="showNetType" title="联网方式">
          <dict-tag v-if="formData?.netType != null" :type="DICT_TYPE.IOT_NET_TYPE" :value="formData?.netType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="协议类型">
          <dict-tag :type="DICT_TYPE.IOT_PROTOCOL_TYPE" :value="formData?.protocolType" />
        </wd-cell>
        <wd-cell title="序列化类型">
          <dict-tag :type="DICT_TYPE.IOT_SERIALIZE_TYPE" :value="formData?.serializeType" />
        </wd-cell>
        <wd-cell title="产品状态">
          <dict-tag :type="DICT_TYPE.IOT_PRODUCT_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="设备数量">
          <view class="flex items-center justify-end gap-12rpx">
            <text>{{ formData?.deviceCount ?? 0 }}</text>
            <wd-button size="small" type="primary" variant="plain" @click="handleDeviceList">
              前往管理
            </wd-button>
          </view>
        </wd-cell>
        <wd-cell title="动态注册" :value="formData?.registerEnabled ? '开启' : '关闭'" />
        <wd-cell title="产品描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="info" @click="handleThingModel">
          物模型
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:product:update'])"
          class="flex-1"
          :type="isPublished ? 'warning' : 'success'"
          :loading="statusLoading"
          :disabled="deleting"
          @click="handleToggleStatus"
        >
          {{ isPublished ? '撤销发布' : '发布' }}
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:product:update'])"
          class="flex-1"
          type="warning"
          :disabled="isPublished || deleting || statusLoading"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['iot:product:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          :disabled="isPublished || statusLoading"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getDeviceCount } from '@/api/iot/device/device'
import { deleteProduct, DeviceTypeEnum, getProduct, updateProductStatus } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, ProductStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Product>() // 详情数据
const deleting = ref(false) // 删除状态
const statusLoading = ref(false) // 状态变更状态
const secretVisible = ref(false) // 产品密钥显示状态
const isPublished = computed(() => formData.value?.status === ProductStatusEnum.PUBLISHED) // 是否已发布
const showNetType = computed(() => {
  return [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(formData.value?.deviceType as number)
}) // 仅直连/网关展示联网方式
const productSecretText = computed(() => {
  if (!formData.value?.productSecret) {
    return '-'
  }
  return secretVisible.value ? formData.value.productSecret : '******'
}) // 产品密钥展示文案

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/product/product/index')
}

/** 加载产品详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const data = await getProduct(Number(props.id))
  if (data?.id) {
    try {
      data.deviceCount = await getDeviceCount(Number(data.id))
    } catch {
      data.deviceCount = 0 // 设备数量异常不影响产品详情展示
    }
  }
  formData.value = data
}

/** 编辑产品 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/product/product/form/index?id=${props.id}` })
}

/** 查看物模型 */
function handleThingModel() {
  uni.navigateTo({ url: `/pages-iot/thingmodel/index?productId=${props.id}` })
}

/** 查看设备列表 */
function handleDeviceList() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-iot/device/device/index?productId=${props.id}` })
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

/** 发布 / 撤销发布 */
async function handleToggleStatus() {
  if (!props.id || !formData.value || deleting.value || statusLoading.value) {
    return
  }
  const nextStatus = isPublished.value ? ProductStatusEnum.UNPUBLISHED : ProductStatusEnum.PUBLISHED
  const actionName = isPublished.value ? '撤销发布' : '发布'
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${actionName}该产品吗？` })
  } catch {
    return
  }
  statusLoading.value = true
  try {
    await updateProductStatus(Number(props.id), nextStatus)
    toast.success(`${actionName}成功`)
    uni.$emit('iot:product:reload')
    await getDetail()
  } finally {
    statusLoading.value = false
  }
}

/** 删除产品 */
async function handleDelete() {
  if (!props.id || deleting.value || statusLoading.value || isPublished.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该产品吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteProduct(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:product:reload')
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
