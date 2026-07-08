<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        检验项明细
      </view>
      <view v-if="total > 0" class="text-24rpx text-[#999]">
        共 {{ total }} 项
      </view>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="pageSize"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多检验项明细了"
      empty-view-text="暂无检验项明细"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-semibold">
                {{ item.indicatorName || '-' }}
              </view>
              <view class="mt-6rpx truncate text-24rpx text-[#999]">
                {{ item.indicatorCode || '-' }}
              </view>
            </view>
            <dict-tag v-if="item.indicatorType != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="item.indicatorType" />
          </view>

          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="text-[#999]">检测工具：</text>{{ item.tool || '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="text-[#999]">检测方法：</text>{{ item.checkMethod || '-' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="text-[#999]">标准值：</text>{{ formatDisplayValue(item.standardValue) }} {{ item.unitMeasureName || '' }}
          </view>
          <view class="mb-8rpx text-26rpx text-[#666]">
            <text class="text-[#999]">误差范围：</text>{{ formatDisplayValue(item.minThreshold) }} ~ {{ formatDisplayValue(item.maxThreshold) }}
          </view>
          <view class="grid grid-cols-3 gap-12rpx rounded-10rpx bg-white px-16rpx py-14rpx text-center">
            <view>
              <view class="text-22rpx text-[#999]">
                致命
              </view>
              <view class="mt-4rpx text-26rpx text-[#d93026] font-semibold">
                {{ formatDisplayValue(item.criticalQuantity) }}
              </view>
            </view>
            <view>
              <view class="text-22rpx text-[#999]">
                严重
              </view>
              <view class="mt-4rpx text-26rpx text-[#fa8c16] font-semibold">
                {{ formatDisplayValue(item.majorQuantity) }}
              </view>
            </view>
            <view>
              <view class="text-22rpx text-[#999]">
                轻微
              </view>
              <view class="mt-4rpx text-26rpx text-[#1677ff] font-semibold">
                {{ formatDisplayValue(item.minorQuantity) }}
              </view>
            </view>
          </view>
          <view v-if="item.remark" class="mt-10rpx text-24rpx text-[#999]">
            备注：{{ item.remark }}
          </view>
          <view class="mt-16rpx">
            <wd-button block size="small" variant="plain" @click="openDefectRecords(item)">
              缺陷记录
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 缺陷记录 -->
    <wd-popup
      v-model="defectVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 72vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-32rpx text-[#333] font-semibold">
              缺陷记录
            </view>
            <view class="mt-4rpx truncate text-24rpx text-[#999]">
              {{ currentLine?.indicatorName || '-' }}
            </view>
          </view>
          <view class="ml-16rpx flex shrink-0 gap-12rpx">
            <wd-button
              v-if="!readonly && hasAccessByCodes(['mes:qc-defect:create'])"
              size="small"
              type="primary"
              variant="plain"
              @click="handleAddDefect"
            >
              新增
            </wd-button>
            <wd-button size="small" variant="plain" @click="defectVisible = false">
              关闭
            </wd-button>
          </view>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view v-if="defectLoading" class="p-24rpx text-28rpx text-[#999]">
            加载中...
          </view>
          <view v-else-if="defectList.length === 0" class="p-24rpx text-28rpx text-[#999]">
            暂无缺陷记录
          </view>
          <view v-else class="p-24rpx">
            <view
              v-for="record in defectList"
              :key="record.id"
              class="mb-20rpx rounded-12rpx bg-white p-20rpx last:mb-0"
            >
              <view class="mb-10rpx flex items-start justify-between gap-16rpx">
                <view class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
                  {{ record.name || '-' }}
                </view>
                <dict-tag v-if="record.level != null" :type="DICT_TYPE.MES_DEFECT_LEVEL" :value="record.level" />
              </view>
              <view class="mb-8rpx text-26rpx text-[#666]">
                <text class="text-[#999]">缺陷数量：</text>{{ formatDisplayValue(record.quantity) }}
              </view>
              <view class="mb-8rpx text-24rpx text-[#999]">
                备注：{{ record.remark || '-' }}
              </view>
              <view class="text-24rpx text-[#999]">
                创建时间：{{ formatDateTime(record.createTime) || '-' }}
              </view>
              <view v-if="!readonly" class="mt-16rpx flex gap-16rpx">
                <wd-button
                  v-if="hasAccessByCodes(['mes:qc-defect:update'])"
                  class="flex-1"
                  size="small"
                  variant="plain"
                  @click="handleEditDefect(record)"
                >
                  编辑
                </wd-button>
                <wd-button
                  v-if="hasAccessByCodes(['mes:qc-defect:delete'])"
                  class="flex-1"
                  size="small"
                  type="danger"
                  variant="plain"
                  @click="handleDeleteDefect(record)"
                >
                  删除
                </wd-button>
              </view>
            </view>

            <view v-if="defectList.length < defectTotal" class="pt-4rpx">
              <wd-button block size="small" :loading="defectLoadingMore" variant="plain" @click="loadMoreDefects">
                加载更多
              </wd-button>
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 缺陷记录表单 -->
    <wd-popup
      v-model="defectFormVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 76vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="defectFormVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ defectFormData.id ? '编辑缺陷记录' : '新增缺陷记录' }}
          </view>
          <wd-button size="small" type="primary" :loading="defectFormLoading" @click="handleSubmitDefect">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="defectFormRef" :model="defectFormData" :schema="defectFormSchema">
            <wd-cell-group border>
              <wd-form-item title="缺陷描述" title-width="220rpx" prop="name">
                <wd-textarea v-model="defectFormData.name" placeholder="请输入缺陷描述" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
              <yd-form-picker v-model="defectFormData.level" label="缺陷等级" label-width="220rpx" prop="level" :dict-type="DICT_TYPE.MES_DEFECT_LEVEL" placeholder="请选择缺陷等级" />
              <wd-form-item title="缺陷数量" title-width="220rpx" prop="quantity">
                <wd-input-number v-model="defectFormData.quantity" :min="1" :precision="0" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="defectFormData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { QcIqcLine } from '@/api/mes/qc/iqc/line'
import type { QcIpqcLine } from '@/api/mes/qc/ipqc/line'
import type { QcOqcLine } from '@/api/mes/qc/oqc/line'
import type { QcRqcLine } from '@/api/mes/qc/rqc/line'
import type { QcDefectRecord } from '@/api/mes/qc/defectrecord'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { createDefectRecord, deleteDefectRecord, getDefectRecordPage, updateDefectRecord } from '@/api/mes/qc/defectrecord'
import { getIqcLinePage } from '@/api/mes/qc/iqc/line'
import { getIpqcLinePage } from '@/api/mes/qc/ipqc/line'
import { getOqcLinePage } from '@/api/mes/qc/oqc/line'
import { getRqcLinePage } from '@/api/mes/qc/rqc/line'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE, MesQcTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatDisplayValue } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

type QcLineItem = QcIqcLine | QcIpqcLine | QcOqcLine | QcRqcLine

const props = withDefaults(defineProps<{
  orderId?: number
  qcType: number
  readonly?: boolean
  showTitle?: boolean
}>(), {
  readonly: false,
  showTitle: true,
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const pageSize = 10
const total = ref(0) // 明细总数
const list = ref<QcLineItem[]>([]) // 检验项明细
const pagingRef = ref<ZPagingRef<QcLineItem>>() // 分页组件引用
const defectVisible = ref(false) // 缺陷弹层状态
const defectLoading = ref(false) // 缺陷首屏加载状态
const defectLoadingMore = ref(false) // 缺陷追加加载状态
const defectPageNo = ref(1) // 缺陷当前页码
const defectTotal = ref(0) // 缺陷总数
const currentLine = ref<QcLineItem>() // 当前检验项
const defectList = ref<QcDefectRecord[]>([]) // 缺陷记录
const defectFormVisible = ref(false) // 缺陷表单弹层状态
const defectFormLoading = ref(false) // 缺陷表单提交状态
const defectFormRef = ref<FormInstance>() // 缺陷表单引用
const defectFormData = ref<QcDefectRecord>({ quantity: 1 }) // 缺陷表单数据
const defectFormSchema = createFormSchema({
  name: [{ required: true, message: '缺陷描述不能为空' }],
  level: [{ required: true, message: '缺陷等级不能为空' }],
  quantity: [{ required: true, message: '缺陷数量不能为空' }],
})

/** 查询明细 */
async function queryList(currentPage: number, currentPageSize: number) {
  if (!props.orderId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await queryLinePage(currentPage, currentPageSize)
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新明细 */
function reloadList() {
  total.value = 0
  list.value = []
  pagingRef.value?.reload()
}

/** 获取刷新事件 */
function getReloadEvent() {
  if (props.qcType === MesQcTypeEnum.IQC) {
    return 'mes:qc:iqc:reload'
  }
  if (props.qcType === MesQcTypeEnum.IPQC) {
    return 'mes:qc:ipqc:reload'
  }
  if (props.qcType === MesQcTypeEnum.OQC) {
    return 'mes:qc:oqc:reload'
  }
  return 'mes:qc:rqc:reload'
}

/** 查询对应检验单行 */
function queryLinePage(currentPage: number, currentPageSize: number) {
  const orderId = props.orderId || 0
  const baseParam = {
    pageNo: currentPage,
    pageSize: currentPageSize,
  }
  if (props.qcType === MesQcTypeEnum.IQC) {
    return getIqcLinePage({ ...baseParam, iqcId: orderId })
  }
  if (props.qcType === MesQcTypeEnum.IPQC) {
    return getIpqcLinePage({ ...baseParam, ipqcId: orderId })
  }
  if (props.qcType === MesQcTypeEnum.OQC) {
    return getOqcLinePage({ ...baseParam, oqcId: orderId })
  }
  return getRqcLinePage({ ...baseParam, rqcId: orderId })
}

/** 打开缺陷记录 */
async function openDefectRecords(item: QcLineItem) {
  currentLine.value = item
  defectVisible.value = true
  await loadDefectRecords()
}

/** 加载缺陷记录 */
async function loadDefectRecords(reset = true) {
  if (!props.orderId || !currentLine.value?.id) {
    defectList.value = []
    defectTotal.value = 0
    return
  }
  if (reset) {
    defectPageNo.value = 1
    defectLoading.value = true
  } else {
    defectLoadingMore.value = true
  }

  try {
    const data = await getDefectRecordPage({
      pageNo: defectPageNo.value,
      pageSize,
      qcType: props.qcType,
      qcId: props.orderId,
      lineId: currentLine.value.id,
    })
    defectList.value = reset ? data.list : [...defectList.value, ...data.list]
    defectTotal.value = data.total
  } finally {
    defectLoading.value = false
    defectLoadingMore.value = false
  }
}

/** 加载更多缺陷记录 */
async function loadMoreDefects() {
  if (defectList.value.length >= defectTotal.value || defectLoadingMore.value) {
    return
  }
  defectPageNo.value += 1
  await loadDefectRecords(false)
}

/** 新增缺陷记录 */
function handleAddDefect() {
  if (!props.orderId || !currentLine.value?.id) {
    toast.warning('请先选择检验项')
    return
  }
  defectFormData.value = {
    qcType: props.qcType,
    qcId: props.orderId,
    lineId: currentLine.value.id,
    quantity: 1,
  }
  defectFormVisible.value = true
}

/** 编辑缺陷记录 */
function handleEditDefect(record: QcDefectRecord) {
  defectFormData.value = {
    ...record,
    qcType: props.qcType,
    qcId: props.orderId,
    lineId: currentLine.value?.id,
  }
  defectFormVisible.value = true
}

/** 提交缺陷记录 */
async function handleSubmitDefect() {
  const { valid } = await defectFormRef.value.validate()
  if (!valid) {
    return
  }
  if (!props.orderId || !currentLine.value?.id) {
    toast.warning('请先选择检验项')
    return
  }
  const data: QcDefectRecord = {
    ...defectFormData.value,
    qcType: props.qcType,
    qcId: props.orderId,
    lineId: currentLine.value.id,
  }
  defectFormLoading.value = true
  try {
    if (data.id) {
      await updateDefectRecord(data)
      toast.success('修改成功')
    } else {
      await createDefectRecord(data)
      toast.success('新增成功')
    }
    defectFormVisible.value = false
    await loadDefectRecords()
    reloadList()
  } finally {
    defectFormLoading.value = false
  }
}

/** 删除缺陷记录 */
async function handleDeleteDefect(record: QcDefectRecord) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除缺陷记录「${record.name || record.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteDefectRecord(record.id)
  toast.success('删除成功')
  await loadDefectRecords()
  reloadList()
}

/** 初始化 */
onMounted(() => {
  uni.$on(getReloadEvent(), reloadList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off(getReloadEvent(), reloadList)
})

/** 监听检验单编号变化 */
watch(
  () => props.orderId,
  async () => {
    total.value = 0
    list.value = []
    await nextTick()
    pagingRef.value?.reload()
  },
  { immediate: true },
)
</script>
