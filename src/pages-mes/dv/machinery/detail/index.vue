<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar title="设备详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" line-theme="text" @change="handleTabChange">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="设备编码" :value="formData?.code || '-'" />
        <wd-cell title="设备名称" :value="formData?.name || '-'" />
        <wd-cell title="品牌" :value="formData?.brand || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="设备类型" :value="formData?.machineryTypeName || '-'" />
        <wd-cell title="所属车间" :value="formData?.workshopName || '-'" />
        <wd-cell title="设备状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_DV_MACHINERY_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="最近点检时间" :value="formatDateTime(formData?.lastCheckTime) || '-'" />
        <wd-cell title="最近保养时间" :value="formatDateTime(formData?.lastMaintenTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 点检记录 -->
    <MachineryCheckRecordList v-else-if="tabType === 'check' && formData?.id" :machinery-id="formData.id" />

    <!-- 保养记录 -->
    <MachineryMaintenRecordList v-else-if="tabType === 'mainten' && formData?.id" :machinery-id="formData.id" />

    <!-- 维修记录 -->
    <MachineryRepairRecordList v-else-if="tabType === 'repair' && formData?.id" :machinery-id="formData.id" />

    <view v-if="formData && tabType === 'basic'" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:dv-machinery:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:dv-machinery:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvMachinery } from '@/api/mes/dv/machinery'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteMachinery, getMachinery } from '@/api/mes/dv/machinery'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MachineryCheckRecordList from '../components/machinery-check-record-list.vue'
import MachineryMaintenRecordList from '../components/machinery-mainten-record-list.vue'
import MachineryRepairRecordList from '../components/machinery-repair-record-list.vue'

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
const formData = ref<DvMachinery>() // 详情数据
const deleting = ref(false) // 删除状态
const tabs = [ // 详情 tab 配置
  { key: 'basic', title: '基本信息' },
  { key: 'check', title: '点检记录' },
  { key: 'mainten', title: '保养记录' },
  { key: 'repair', title: '维修记录' },
] as const
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabs[tabIndex.value]?.key || 'basic') // 当前 tab 类型

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMachinery(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: buildBarcodeListUrl({
      bizType: BarcodeBizTypeEnum.MACHINERY,
      bizId: formData.value.id,
      bizCode: formData.value.code,
    }),
  })
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/dv/machinery/form/index?id=${props.id}` })
}

/** 删除 */
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
    await deleteMachinery(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:dv:machinery:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:dv:machinery:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:dv:machinery:reload', getDetail)
})
</script>
