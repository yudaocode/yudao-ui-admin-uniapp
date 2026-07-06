<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      title="工作站详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" line-theme="text" @change="handleTabChange">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="工作站编码" :value="formData?.code || '-'" />
        <wd-cell title="工作站名称" :value="formData?.name || '-'" />
        <wd-cell title="所在车间" :value="formData?.workshopName || '-'" />
        <wd-cell title="工作站地点" :value="formData?.address || '-'" />
        <wd-cell title="所属工序" :value="formData?.processName || '-'" />
        <wd-cell title="线边仓库" :value="formData?.warehouseName || '-'" />
        <wd-cell title="库区" :value="formData?.locationName || '-'" />
        <wd-cell title="库位" :value="formData?.areaName || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 资源列表 -->
    <WorkstationResourceList
      v-else-if="formData?.id"
      :workstation-id="formData.id"
      :resource-type="currentResourceType"
      mode="edit"
    />

    <view v-if="formData && tabType === 'basic'" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-workstation:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-workstation:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteWorkstation, getWorkstation } from '@/api/mes/md/workstation'
import { getWorkshopSimpleList } from '@/api/mes/md/workstation/workshop'
import { getProcessSimpleList } from '@/api/mes/pro/process'
import { getWarehouseSimpleList } from '@/api/mes/wm/warehouse'
import { getWarehouseLocationSimpleList } from '@/api/mes/wm/warehouse/location'
import { getWarehouseAreaSimpleList } from '@/api/mes/wm/warehouse/area'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import WorkstationResourceList from '../components/workstation-resource-list.vue'

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
interface MdWorkstationDetail extends MdWorkstation {
  warehouseName?: string
  locationName?: string
  areaName?: string
}
const formData = ref<MdWorkstationDetail>() // 详情数据
const deleting = ref(false) // 删除状态
const tabs = [ // 详情 tab 配置
  { key: 'basic', title: '基本信息' },
  { key: 'machine', title: '设备资源' },
  { key: 'tool', title: '工装夹具' },
  { key: 'worker', title: '人力资源' },
] as const
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabs[tabIndex.value]?.key || 'basic') // 当前 tab 类型
const currentResourceType = computed(() => tabType.value === 'basic' ? 'machine' : tabType.value) // 当前资源类型

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/index')
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
    const data = await getWorkstation(Number(props.id))
    const [workshops, processes, warehouses, locations, areas] = await Promise.all([
      getWorkshopSimpleList(),
      getProcessSimpleList(),
      getWarehouseSimpleList(),
      data.warehouseId ? getWarehouseLocationSimpleList(data.warehouseId) : Promise.resolve([]),
      data.locationId ? getWarehouseAreaSimpleList(data.locationId) : Promise.resolve([]),
    ])
    formData.value = {
      ...data,
      workshopName: data.workshopName || workshops.find(item => item.id === data.workshopId)?.name,
      processName: data.processName || processes.find(item => item.id === data.processId)?.name,
      warehouseName: warehouses.find(item => item.id === data.warehouseId)?.name,
      locationName: locations.find(item => item.id === data.locationId)?.name,
      areaName: areas.find(item => item.id === data.areaId)?.name,
    }
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
      bizType: BarcodeBizTypeEnum.WORKSTATION,
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
  uni.navigateTo({ url: `/pages-mes/md/workstation/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该工作站吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWorkstation(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:workstation:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:workstation:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:workstation:reload', getDetail)
})
</script>
