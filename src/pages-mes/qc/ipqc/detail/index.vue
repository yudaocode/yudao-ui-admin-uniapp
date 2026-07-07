<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="过程检验单详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabType" shrink>
        <wd-tab title="基本信息" name="basic" />
        <wd-tab title="检验项" name="lines" />
        <wd-tab title="检测结果" name="results" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="p-24rpx">
        <wd-cell-group border>
          <wd-cell title="检验单编号" :value="formData?.code || '-'" />
          <wd-cell title="检验单名称" :value="formData?.name || '-'" />
          <wd-cell title="检验类型">
            <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_IPQC_TYPE" :value="formData.type" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="单据状态">
            <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_ORDER_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="检测结果">
            <dict-tag v-if="formData?.checkResult != null" :type="DICT_TYPE.MES_QC_CHECK_RESULT" :value="formData.checkResult" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="备注" :value="formData?.remark || '-'" />
        </wd-cell-group>

        <wd-cell-group title="来源单据" border class="mt-24rpx">
          <wd-cell title="来源单据类型">
            <dict-tag v-if="formData?.sourceDocType != null" :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="formData.sourceDocType" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="来源单据编号" :value="formData?.sourceDocCode || '-'" />
          <wd-cell title="来源单据 ID" :value="formData?.sourceDocId != null ? String(formData.sourceDocId) : '-'" />
          <wd-cell title="来源行 ID" :value="formData?.sourceLineId != null ? String(formData.sourceLineId) : '-'" />
        </wd-cell-group>

        <wd-cell-group title="生产关联" border class="mt-24rpx">
          <wd-cell title="生产工单" :value="`${formData?.workOrderCode || '-'} / ${formData?.workOrderName || '-'}`" />
          <wd-cell title="生产任务" :value="formData?.taskCode || (formData?.taskId != null ? String(formData.taskId) : '-')" />
          <wd-cell title="工位" :value="`${formData?.workstationCode || '-'} / ${formData?.workstationName || '-'}`" />
          <wd-cell title="工序" :value="formData?.processName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="产品物料" border class="mt-24rpx">
          <wd-cell title="物料编码" :value="formData?.itemCode || '-'" />
          <wd-cell title="物料名称" :value="formData?.itemName || '-'" />
          <wd-cell title="规格型号" :value="formData?.itemSpecification || '-'" />
          <wd-cell title="单位" :value="formData?.unitName || '-'" />
        </wd-cell-group>

        <wd-cell-group title="检测情况" border class="mt-24rpx">
          <wd-cell title="检测数量" :value="formatDisplayValue(formData?.checkQuantity)" />
          <wd-cell title="合格数量" :value="formatDisplayValue(formData?.qualifiedQuantity)" />
          <wd-cell title="不合格数量" :value="formatDisplayValue(formData?.unqualifiedQuantity)" />
          <wd-cell title="检测日期" :value="formatDateTime(formData?.inspectDate) || '-'" />
          <wd-cell title="检测人员" :value="formData?.inspectorNickname || '-'" />
        </wd-cell-group>

        <wd-cell-group title="废品与缺陷" border class="mt-24rpx">
          <wd-cell title="工废数量" :value="formatDisplayValue(formData?.laborScrapQuantity)" />
          <wd-cell title="料废数量" :value="formatDisplayValue(formData?.materialScrapQuantity)" />
          <wd-cell title="其他废品数量" :value="formatDisplayValue(formData?.otherScrapQuantity)" />
          <wd-cell title="致命缺陷数" :value="formatDisplayValue(formData?.criticalQuantity)" />
          <wd-cell title="严重缺陷数" :value="formatDisplayValue(formData?.majorQuantity)" />
          <wd-cell title="轻微缺陷数" :value="formatDisplayValue(formData?.minorQuantity)" />
          <wd-cell title="致命缺陷率" :value="formatDisplayPercent(formData?.criticalRate)" />
          <wd-cell title="严重缺陷率" :value="formatDisplayPercent(formData?.majorRate)" />
          <wd-cell title="轻微缺陷率" :value="formatDisplayPercent(formData?.minorRate)" />
        </wd-cell-group>
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 检验项 -->
    <scroll-view v-if="tabType === 'lines' && formData?.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <QcLineList :order-id="formData.id" :qc-type="MesQcTypeEnum.IPQC" readonly :show-title="false" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 检测结果 -->
    <scroll-view v-if="tabType === 'results' && formData?.id" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <IndicatorResultList :qc-id="formData.id" :qc-type="MesQcTypeEnum.IPQC" readonly :show-title="false" />
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view
      v-if="tabType === 'basic' && formData && isDraft && (hasAccessByCodes(['mes:qc-ipqc:update']) || hasAccessByCodes(['mes:qc-ipqc:finish']) || hasAccessByCodes(['mes:qc-ipqc:delete']))"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:qc-ipqc:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:qc-ipqc:finish'])" class="flex-1" type="success" :loading="finishing" @click="handleFinish">
          完成
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:qc-ipqc:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QcIpqc } from '@/api/mes/qc/ipqc'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteIpqc, finishIpqc, getIpqc } from '@/api/mes/qc/ipqc'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesQcStatusEnum, MesQcTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatDisplayPercent, formatDisplayValue } from '@/utils/format'
import IndicatorResultList from '../../indicatorresult/components/indicator-result-list.vue'
import QcLineList from '../../components/qc-line-list.vue'

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
const formData = ref<QcIpqc>() // 详情数据
const deleting = ref(false) // 删除状态
const finishing = ref(false) // 完成状态
const tabType = ref('basic') // 当前 tab 类型
const isDraft = computed(() => formData.value?.status === MesQcStatusEnum.DRAFT)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/ipqc/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getIpqc(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/qc/ipqc/form/index?id=${props.id}` })
}

/** 完成 */
async function handleFinish() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '完成确认',
      msg: '确定要完成该过程检验单吗？完成后将不能修改。',
    })
  } catch {
    return
  }
  finishing.value = true
  try {
    await finishIpqc(Number(props.id))
    toast.success('完成成功')
    uni.$emit('mes:qc:ipqc:reload')
    await getDetail()
  } finally {
    finishing.value = false
  }
}

/** 删除 */
async function handleDelete() {
  if (!props.id || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要删除过程检验单「${formData.value.code}」吗？删除后将无法恢复。`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteIpqc(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:qc:ipqc:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
