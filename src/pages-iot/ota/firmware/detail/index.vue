<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="固件详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- 基本信息 -->
      <wd-cell-group border>
        <wd-cell title="固件编号" :value="String(formData?.id || '-')" />
        <wd-cell title="固件名称" :value="formData?.name || '-'" />
        <wd-cell title="所属产品" :value="formData?.productName || String(formData?.productId || '-')" />
        <wd-cell title="版本号" :value="formData?.version || '-'" />
        <wd-cell title="文件地址">
          <view class="break-all text-right text-26rpx text-[#666]">
            {{ formData?.fileUrl || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="文件大小" :value="formatFileSize(formData?.fileSize)" />
        <wd-cell title="签名算法" :value="formData?.fileDigestAlgorithm || '-'" />
        <wd-cell title="签名结果">
          <view class="break-all text-right text-26rpx text-[#666]">
            {{ formData?.fileDigestValue || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="固件描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 升级概览 -->
      <view class="p-24rpx">
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="flex items-start justify-between gap-16rpx">
            <view>
              <view class="text-26rpx text-[#999]">
                升级设备总数
              </view>
              <view class="mt-8rpx text-52rpx text-[#1677ff] font-semibold leading-none">
                {{ statisticsTotal }}
              </view>
            </view>
            <wd-button size="small" type="primary" variant="plain" @click="handleTaskList">
              升级任务
            </wd-button>
          </view>

          <view
            v-if="statisticsTotal === 0"
            class="mt-24rpx rounded-8rpx bg-[#f7f8fa] px-20rpx py-18rpx text-26rpx text-[#999]"
          >
            暂无升级设备
          </view>
          <view v-if="statisticsTotal > 0" class="grid grid-cols-3 mt-24rpx gap-16rpx">
            <view
              v-for="item in mainStatisticsCards"
              :key="item.key"
              class="rounded-8rpx bg-[#f7f8fa] px-16rpx py-18rpx"
            >
              <view class="text-34rpx font-semibold" :class="item.color">
                {{ item.count }}
              </view>
              <view class="mt-6rpx text-22rpx text-[#999]">
                {{ item.label }}
              </view>
            </view>
          </view>

          <view
            v-if="statisticsTotal > 0"
            class="grid grid-cols-3 mt-20rpx gap-12rpx border-t border-[#f0f0f0] pt-20rpx"
          >
            <view v-for="item in minorStatisticsCards" :key="item.key" class="min-w-0 text-center">
              <view class="text-28rpx font-semibold" :class="item.color">
                {{ item.count }}
              </view>
              <view class="mt-4rpx truncate text-22rpx text-[#999]">
                {{ item.label }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作 -->
    <view v-if="hasAccessByCodes(['iot:ota-task:create']) || moreActions.length > 0" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['iot:ota-task:create'])"
          class="flex-1"
          type="primary"
          :disabled="deleting"
          @click="handleCreateTask"
        >
          发起升级
        </wd-button>
        <wd-button
          v-if="moreActions.length > 0"
          class="flex-1"
          type="info"
          :disabled="deleting"
          @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
  </view>
</template>

<script lang="ts" setup>
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteOtaFirmware, getOtaFirmware } from '@/api/iot/ota/firmware'
import { getOtaTaskRecordStatusStatistics } from '@/api/iot/ota/task/record'
import { useAccess } from '@/hooks/useAccess'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, IoTOtaTaskRecordStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatFileSize } from '@/utils/download'

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
const formData = ref<OtaFirmware>() // 详情数据
const statistics = ref<Record<string, number>>({}) // 升级统计
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 更多操作菜单
const mainStatisticsStatuses: number[] = [ // 核心升级状态
  IoTOtaTaskRecordStatusEnum.UPGRADING.value,
  IoTOtaTaskRecordStatusEnum.SUCCESS.value,
  IoTOtaTaskRecordStatusEnum.FAILURE.value,
]
const minorStatisticsStatuses: number[] = [ // 次要升级状态
  IoTOtaTaskRecordStatusEnum.PENDING.value,
  IoTOtaTaskRecordStatusEnum.PUSHED.value,
  IoTOtaTaskRecordStatusEnum.CANCELED.value,
]
const statisticsStatusColors: Record<number, string> = { // 升级状态数字颜色
  [IoTOtaTaskRecordStatusEnum.PENDING.value]: 'text-[#999]',
  [IoTOtaTaskRecordStatusEnum.PUSHED.value]: 'text-[#4d80f0]',
  [IoTOtaTaskRecordStatusEnum.UPGRADING.value]: 'text-[#f59e0b]',
  [IoTOtaTaskRecordStatusEnum.SUCCESS.value]: 'text-[#16a34a]',
  [IoTOtaTaskRecordStatusEnum.FAILURE.value]: 'text-[#ef4444]',
  [IoTOtaTaskRecordStatusEnum.CANCELED.value]: 'text-[#999]',
}
const statisticsCards = computed(() => { // 升级状态统计卡片
  const dictOptions = getIntDictOptions(DICT_TYPE.IOT_OTA_TASK_RECORD_STATUS)
  return Object.values(IoTOtaTaskRecordStatusEnum).map((status) => {
    const dict = dictOptions.find(item => item.value === status.value)
    return {
      key: status.value,
      label: dict?.label || status.label,
      count: getStatisticsCount(status.value),
      color: statisticsStatusColors[status.value] || 'text-[#333]',
    }
  })
})
const statisticsTotal = computed(() => statisticsCards.value.reduce((sum, item) => sum + item.count, 0)) // 升级设备总数
const mainStatisticsCards = computed(() => statisticsCards.value.filter(item => mainStatisticsStatuses.includes(item.key))) // 核心升级状态卡片
const minorStatisticsCards = computed(() => statisticsCards.value.filter(item => minorStatisticsStatuses.includes(item.key))) // 次要升级状态卡片
const moreActions = computed(() => { // 更多操作
  const actions: Array<{ name: string, value: string }> = []
  if (hasAccessByCodes(['iot:ota-firmware:update'])) {
    actions.push({ name: '编辑', value: 'edit' })
  }
  if (hasAccessByCodes(['iot:ota-firmware:delete'])) {
    actions.push({ name: '删除', value: 'delete' })
  }
  return actions
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/ota/firmware/index')
}

/** 加载固件详情 */
async function getDetail() {
  if (props.id && !deleting.value) {
    formData.value = await getOtaFirmware(Number(props.id))
  }
}

/** 加载升级统计 */
async function getStatistics() {
  if (!props.id) {
    return
  }
  statistics.value = await getOtaTaskRecordStatusStatistics(Number(props.id))
}

/** 获取统计数量 */
function getStatisticsCount(status: number) {
  return statistics.value[String(status)] || statistics.value[status] || 0
}

/** 编辑固件 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/ota/firmware/form/index?id=${props.id}` })
}

/** 创建升级任务 */
function handleCreateTask() {
  uni.navigateTo({ url: buildTaskQueryUrl('/pages-iot/ota/task/form/index') })
}

/** 查看升级任务 */
function handleTaskList() {
  uni.navigateTo({ url: buildTaskQueryUrl('/pages-iot/ota/task/index') })
}

/** 构建任务页面参数 */
function buildTaskQueryUrl(baseUrl: string) {
  const query = [
    props.id ? `firmwareId=${props.id}` : '',
    formData.value?.productId ? `productId=${formData.value.productId}` : '',
  ].filter(Boolean).join('&')
  return `${baseUrl}${query ? `?${query}` : ''}`
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (deleting.value) {
    return
  }
  if (item.value === 'edit') {
    handleEdit()
  }
  if (item.value === 'delete') {
    handleDelete()
  }
}

/** 删除固件 */
async function handleDelete() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该固件吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteOtaFirmware(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:ota-firmware:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
  getStatistics()
})
</script>
