<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="车辆详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <!-- 车辆照片 -->
      <view v-if="formData?.picUrl" class="mb-20rpx rounded-12rpx bg-white p-24rpx">
        <image :src="formData.picUrl" class="h-320rpx w-full rounded-12rpx" mode="aspectFit" />
      </view>

      <wd-cell-group border>
        <wd-cell title="车牌号" :value="formData?.no ?? '-'" />
        <wd-cell title="车辆名称" :value="formData?.name || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_VEHICLE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="车型" :value="formData?.type || '-'" />
        <wd-cell title="车辆分类">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_VEHICLE_CATEGORY" :value="formData.category" />
        </wd-cell>
        <wd-cell title="品牌型号" :value="formData?.brandModel || '-'" />
        <wd-cell title="座位数" :value="formData?.seatCount != null ? `${formData.seatCount} 座` : '-'" />
        <wd-cell title="裸车价格" :value="formData?.barePrice != null ? `${formData.barePrice} 元` : '-'" />
        <wd-cell title="交强险到期" :value="formatDate(formData?.compulsoryInsuranceExpireTime) || '-'" />
        <wd-cell title="商业险到期" :value="formatDate(formData?.commercialInsuranceExpireTime) || '-'" />
        <wd-cell title="年检到期" :value="formatDate(formData?.inspectionExpireTime) || '-'" />
        <wd-cell title="所属部门" :value="formData?.deptName || '-'" />
        <wd-cell title="显示顺序" :value="formData?.sort != null ? String(formData.sort) : '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:vehicle:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:vehicle:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Vehicle } from '@/api/oa/vehicle'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteVehicle, getVehicle } from '@/api/oa/vehicle'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Vehicle>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载车辆详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getVehicle(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑车辆 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/vehicle/list/form/index?id=${props.id}`,
  })
}

/** 删除车辆 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该车辆吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVehicle(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:vehicle:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:vehicle:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:vehicle:reload', getDetail)
})
</script>
