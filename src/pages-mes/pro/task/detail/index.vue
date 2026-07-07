<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="pageTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="工单编码" :value="formData?.code || '-'" />
        <wd-cell title="工单名称" :value="formData?.name || '-'" />
        <wd-cell title="工单状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="工单来源">
          <dict-tag v-if="formData?.orderSourceType != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE" :value="formData.orderSourceType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="来源单据" :value="formData?.orderSourceCode || '-'" />
        <wd-cell title="产品编码" :value="formData?.productCode || '-'" />
        <wd-cell title="产品名称" :value="formData?.productName || '-'" />
        <wd-cell title="规格型号" :value="formData?.productSpecification || '-'" />
        <wd-cell title="单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="工单数量" :value="formData?.quantity ?? '-'" />
        <wd-cell title="已排产数量" :value="formData?.quantityScheduled ?? 0" />
        <wd-cell title="已生产数量" :value="formData?.quantityProduced ?? 0" />
        <wd-cell title="客户" :value="clientText" />
        <wd-cell title="需求日期" :value="formatDate(formData?.requestDate) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>

      <view v-if="routeProcessList.length === 0 && !loading" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#8a5a00]">
        当前产品未配置工艺路线，需先在工艺路线中维护产品工序后才能排产。
      </view>

      <ProcessTaskList
        v-for="process in routeProcessList"
        :key="process.processId"
        :work-order-id="formData?.id || 0"
        :route-id="currentRouteId"
        :item-id="formData?.productId || 0"
        :process="process"
        :readonly="isReadonly"
        @reload="handleTaskReload"
      />
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="formData?.id && (canSchedule || canFinish)" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canSchedule" class="flex-1" type="primary" @click="handleSchedule">
          排产
        </wd-button>
        <wd-button v-if="canFinish" class="flex-1" type="success" :loading="finishing" @click="handleFinish">
          完成工单
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProRouteProcess } from '@/api/mes/pro/route/process'
import type { ProWorkOrder } from '@/api/mes/pro/workorder'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { getRouteProcessListByProduct } from '@/api/mes/pro/route/process'
import { finishWorkOrder, getWorkOrder } from '@/api/mes/pro/workorder'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesProWorkOrderStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import ProcessTaskList from '../components/process-task-list.vue'

const props = defineProps<{
  id?: number | string
  mode?: 'schedule' | 'detail' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 页面加载状态
const finishing = ref(false) // 完成工单状态
const formData = ref<ProWorkOrder>() // 工单详情
const routeProcessList = ref<ProRouteProcess[]>([]) // 工艺路线工序列表
const currentRouteId = ref(0) // 当前工艺路线编号
const routeMode = computed(() => props.mode)
const isReadonly = computed(() => routeMode.value !== 'schedule')
const pageTitle = computed(() => isReadonly.value ? '排产详情' : '生产排产')
const canSchedule = computed(() =>
  isReadonly.value
  && hasAccessByCodes(['mes:pro-task:create'])
  && formData.value?.status === MesProWorkOrderStatusEnum.CONFIRMED,
)
const canFinish = computed(() =>
  formData.value?.status === MesProWorkOrderStatusEnum.CONFIRMED
  && hasAccessByCodes(['mes:pro-work-order:update']),
)
const clientText = computed(() => {
  if (!formData.value?.clientName && !formData.value?.clientCode) {
    return '-'
  }
  return `${formData.value.clientCode || '-'} / ${formData.value.clientName || '-'}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/task/index')
}

/** 加载工单与工艺路线 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    loading.value = true
    try {
      formData.value = await getWorkOrder(Number(props.id))
      routeProcessList.value = []
      currentRouteId.value = 0
      // 如果工单有产品编号，则加载该产品的工艺路线工序列表
      if (formData.value.productId) {
        const processes = await getRouteProcessListByProduct(formData.value.productId)
        const sorted = [...processes].sort((a, b) => a.sort - b.sort)
        routeProcessList.value = sorted
        currentRouteId.value = sorted[0]?.routeId || 0
      }
    } finally {
      loading.value = false
    }
  } finally {
    toast.close()
  }
}

/** 任务变更后刷新工单 */
async function handleTaskReload() {
  uni.$emit('mes:pro:task:reload')
  await getDetail()
}

/** 进入排产 */
function handleSchedule() {
  if (!props.id) {
    return
  }
  uni.redirectTo({ url: `/pages-mes/pro/task/detail/index?id=${props.id}&mode=schedule` })
}

/** 完成工单 */
async function handleFinish() {
  if (!formData.value?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认要完成该工单吗？完成后工单下所有任务将标记为已完成。',
    })
  } catch {
    return
  }
  finishing.value = true
  try {
    await finishWorkOrder(formData.value.id)
    toast.success('工单已完成')
    uni.$emit('mes:pro:task:reload')
    delay(handleBack)
  } finally {
    finishing.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
