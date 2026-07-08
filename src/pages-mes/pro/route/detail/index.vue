<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工艺路线详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="基本信息" />
        <wd-tab title="组成工序" />
        <wd-tab title="关联产品" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="路线编码" :value="formData?.code || '-'" />
        <wd-cell title="路线名称" :value="formData?.name || '-'" />
        <wd-cell title="路线说明" :value="formData?.description || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <view class="h-180rpx" />
    </scroll-view>

    <!-- 组成工序 -->
    <scroll-view v-if="tabType === 'process' && formData?.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <RouteProcessList
        :route-id="formData.id"
        :editable="canEditRouteChildren"
        :show-title="false"
      />
      <view class="h-48rpx" />
    </scroll-view>

    <!-- 关联产品 -->
    <scroll-view v-if="tabType === 'products' && formData?.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <RouteProductList
        :route-id="formData.id"
        :editable="canEditRouteChildren"
        :show-title="false"
      />
      <view class="h-48rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="tabType === 'basic' && (hasAccessByCodes(['mes:pro-route:update']) || hasAccessByCodes(['mes:pro-route:delete']))" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:pro-route:update'])" class="flex-1" type="primary" variant="plain" @click="handleStatusChange">
          {{ formData?.status === CommonStatusEnum.ENABLE ? '停用' : '启用' }}
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:pro-route:update'])" class="flex-1" type="warning" :disabled="!isDisabled" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:pro-route:delete'])" class="flex-1" type="danger" :loading="deleting" :disabled="!isDisabled" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProRoute } from '@/api/mes/pro/route'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteRoute, getRoute, updateRouteStatus } from '@/api/mes/pro/route'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import RouteProcessList from '../components/route-process-list.vue'
import RouteProductList from '../components/route-product-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<ProRoute>() // 详情数据
const deleting = ref(false) // 删除状态
const tabTypes = ['basic', 'process', 'products'] // tab 配置
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabTypes[tabIndex.value]) // 当前 tab 类型
const isDisabled = computed(() => formData.value?.status === CommonStatusEnum.DISABLE)
const canEditRouteChildren = computed(() => isDisabled.value && hasAccessByCodes(['mes:pro-route:update']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/route/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 加载工艺路线详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getRoute(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑工艺路线 */
function handleEdit() {
  if (!props.id || !isDisabled.value) {
    toast.warning('仅停用状态可以编辑')
    return
  }
  uni.navigateTo({ url: `/pages-mes/pro/route/form/index?id=${props.id}` })
}

/** 启用或停用工艺路线 */
async function handleStatusChange() {
  if (!props.id || !formData.value || formData.value.status == null) {
    return
  }
  const nextStatus = formData.value.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  const action = nextStatus === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${action}「${formData.value.name || formData.value.code}」工艺路线吗？${nextStatus === CommonStatusEnum.ENABLE ? '启用前请确认工序和产品 BOM 配置完整。' : ''}`,
    })
  } catch {
    return
  }
  await updateRouteStatus(Number(props.id), nextStatus)
  toast.success(`${action}成功`)
  uni.$emit('mes:pro:route:reload')
  await getDetail()
}

/** 删除工艺路线 */
async function handleDelete() {
  if (!props.id || !formData.value) {
    return
  }
  if (!isDisabled.value) {
    toast.warning('仅停用状态可以删除')
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${formData.value.name || formData.value.code}」工艺路线吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteRoute(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:pro:route:reload')
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
