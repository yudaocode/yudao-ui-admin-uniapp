<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 装箱单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabType" shrink>
        <wd-tab title="基本信息" name="basic" />
        <wd-tab title="子箱" name="children" />
        <wd-tab title="装箱清单" name="lines" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group border>
          <wd-cell title="装箱单编号" :value="formData?.code || '-'" />
          <wd-cell title="装箱日期" :value="formatDateTime(formData?.packageDate) || '-'" />
          <wd-cell title="单据状态">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="箱体类型" :value="formData?.parentId && formData.parentId !== 0 ? `子箱 #${formData.parentId}` : '主箱'" />
          <wd-cell title="销售订单编号" :value="formData?.salesOrderCode || '-'" />
          <wd-cell title="发票编号" :value="formData?.invoiceCode || '-'" />
          <wd-cell title="客户编码" :value="formData?.clientCode || '-'" />
          <wd-cell title="客户名称" :value="formData?.clientName || '-'" />
          <wd-cell title="客户简称" :value="formData?.clientNickname || '-'" />
          <wd-cell title="箱长度" :value="formatMeasure(formData?.length, formData?.sizeUnitName)" />
          <wd-cell title="箱宽度" :value="formatMeasure(formData?.width, formData?.sizeUnitName)" />
          <wd-cell title="箱高度" :value="formatMeasure(formData?.height, formData?.sizeUnitName)" />
          <wd-cell title="净重" :value="formatMeasure(formData?.netWeight, formData?.weightUnitName)" />
          <wd-cell title="毛重" :value="formatMeasure(formData?.grossWeight, formData?.weightUnitName)" />
          <wd-cell title="检查员" :value="formData?.inspectorName || '-'" />
          <wd-cell title="备注" :value="formData?.remark || '-'" />
          <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        </wd-cell-group>

        <view class="h-180rpx" />
      </view>
    </scroll-view>

    <!-- 子箱 -->
    <scroll-view v-if="tabType === 'children' && packageId" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="px-24rpx">
        <SubPackageList :package-id="packageId" :show-title="false" />
      </view>
      <view class="h-48rpx" />
    </scroll-view>

    <!-- 装箱清单 -->
    <scroll-view v-if="tabType === 'lines' && packageId" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="px-24rpx">
        <PackageLineList :package-id="packageId" :show-title="false" />
      </view>
      <view class="h-48rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="tabType === 'basic' && canOperate" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdate"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canUpdate"
          class="flex-1" type="success" :loading="finishLoading" @click="handleFinish"
        >
          完成
        </wd-button>
        <wd-button
          v-if="canDelete"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmPackage } from '@/api/mes/wm/packages'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deletePackage, finishPackage, getPackage } from '@/api/mes/wm/packages'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesWmPackageStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PackageLineList from '../components/package-line-list.vue'
import SubPackageList from '../components/sub-package-list.vue'

const props = defineProps<{
  id?: number | string
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
const formData = ref<WmPackage>() // 详情数据
const deleting = ref(false) // 删除状态
const finishLoading = ref(false) // 完成状态
const packageId = computed(() => props.id ? Number(props.id) : undefined)
const tabType = ref('basic') // 当前 tab 类型
const canUpdate = computed(() => {
  return formData.value?.status === MesWmPackageStatusEnum.PREPARE && hasAccessByCodes(['mes:wm-package:update'])
})
const canDelete = computed(() => {
  return formData.value?.status === MesWmPackageStatusEnum.PREPARE && hasAccessByCodes(['mes:wm-package:delete'])
})
const canOperate = computed(() => canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/packages/index')
}

/** 格式化数值和单位 */
function formatMeasure(value?: number, unitName?: string) {
  if (value === undefined || value === null) {
    return '-'
  }
  return `${value} ${unitName || ''}`.trim()
}

/** 加载详情 */
async function getDetail() {
  if (!packageId.value || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPackage(packageId.value)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!packageId.value) {
    return
  }
  uni.navigateTo({
    url: `/pages-mes/wm/packages/form/index?id=${packageId.value}`,
  })
}

/** 完成 */
async function handleFinish() {
  if (!packageId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认完成装箱单「${formData.value.code}」？完成后将不可编辑。`,
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishPackage(packageId.value)
    toast.success('完成成功')
    uni.$emit('mes:wm:packages:reload')
    await getDetail()
  } finally {
    finishLoading.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!packageId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除装箱单「${formData.value.code}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePackage(packageId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:packages:reload')
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
