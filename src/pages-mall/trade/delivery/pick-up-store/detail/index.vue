<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="自提门店详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="门店名称" :value="formData.name || '-'" />
      <wd-cell title="联系电话" :value="formData.phone || '-'" />
      <wd-cell title="门店 Logo">
        <wd-img v-if="formData.logo" :src="formData.logo" width="112rpx" height="112rpx" radius="8rpx" mode="aspectFill" enable-preview />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="所在地区" :value="formData.areaName || '-'" />
      <wd-cell title="详细地址" :value="formData.detailAddress || '-'" />
      <wd-cell title="营业开始" :value="formData.openingTime || '-'" />
      <wd-cell title="营业结束" :value="formData.closingTime || '-'" />
      <wd-cell title="纬度" :value="formData.latitude != null ? String(formData.latitude) : '-'" />
      <wd-cell title="经度" :value="formData.longitude != null ? String(formData.longitude) : '-'" />
      <wd-cell title="开启状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="简介" :value="formData.introduction || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['trade:delivery:pick-up-store:update', 'trade:delivery:pick-up-store:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['trade:delivery:pick-up-store:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['trade:delivery:pick-up-store:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
        <!-- 绑定核销员 -->
        <view v-if="hasAccessByCodes(['trade:delivery:pick-up-store:update'])" class="flex-1">
          <wd-button class="w-full" type="primary" :loading="binding" @click="staffPickerRef?.open()">
            绑定核销员
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 核销员选择 -->
    <UserPicker
      ref="staffPickerRef"
      v-model="bindStaffIds"
      title="选择核销员"
      type="checkbox"
      @confirm="handleBindStaff"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DeliveryPickUpStore } from '@/api/mall/trade/delivery/pick-up-store'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  bindDeliveryPickUpStoreStaff,
  deleteDeliveryPickUpStore,
  getDeliveryPickUpStore,
} from '@/api/mall/trade/delivery/pick-up-store'
import { UserPicker } from '@/components/system-select'
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
const dialog = useDialog()
const toast = useToast()
const formData = ref<DeliveryPickUpStore>({} as DeliveryPickUpStore) // 详情数据
const deleting = ref(false) // 删除状态
const bindStaffIds = ref<number[]>([]) // 绑定的核销员用户编号（与已绑定保持同步，打开选择器即回显）
const binding = ref(false) // 绑定提交状态
const staffPickerRef = ref<InstanceType<typeof UserPicker>>() // 核销员选择器

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/pick-up-store/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDeliveryPickUpStore(Number(props.id))
    // 详情 get 返回 verifyUsers（用户对象），取 id 回显已绑定核销员
    bindStaffIds.value = (formData.value.verifyUsers || []).map(u => Number(u.id)).filter(Boolean)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/trade/delivery/pick-up-store/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该自提门店吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDeliveryPickUpStore(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mall:delivery-pick-up-store:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交绑定核销员（用户选择器确定后触发） */
async function handleBindStaff() {
  binding.value = true
  try {
    await bindDeliveryPickUpStoreStaff({ id: formData.value.id, verifyUserIds: bindStaffIds.value })
    toast.success('绑定成功')
    uni.$emit('mall:delivery-pick-up-store:reload')
    await getDetail()
  } finally {
    binding.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:delivery-pick-up-store:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:delivery-pick-up-store:reload', getDetail)
})
</script>
