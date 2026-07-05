<template>
  <view class="yd-page-container yd-page-container-paging">
    <wd-navbar
      title="车间详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="车间编码" :value="formData?.code || '-'" />
        <wd-cell title="车间名称" :value="formData?.name || '-'" />
        <wd-cell title="面积" :value="formData?.area != null ? `${formData.area} ㎡` : '-'" />
        <wd-cell title="负责人" :value="formData?.chargeUserName || '-'" />
        <wd-cell title="状态">
          <dict-tag
            v-if="formData?.status != null"
            :type="DICT_TYPE.COMMON_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>

    <WorkshopWorkstationList v-if="tabType === 'workstation' && formData?.id" :workshop-id="formData.id" />

    <view v-if="formData && tabType === 'basic'" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-workshop:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-workshop:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteWorkshop, getWorkshop } from '@/api/mes/md/workstation/workshop'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import WorkshopWorkstationList from '../components/workshop-workstation-list.vue'

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
const formData = ref<MdWorkshop>() // 详情数据
const deleting = ref(false) // 删除状态
const tabs = [ // 详情 tab 配置
  { key: 'basic', title: '基本信息' },
  { key: 'workstation', title: '工作站' },
] as const
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabs[tabIndex.value]?.key || 'basic') // 当前 tab 类型

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/workshop/index')
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
  formData.value = await getWorkshop(Number(props.id))
}

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return
  }
  uni.navigateTo({
    url: buildBarcodeListUrl({
      bizType: BarcodeBizTypeEnum.WORKSHOP,
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
  uni.navigateTo({ url: `/pages-mes/md/workstation/workshop/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该车间吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWorkshop(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:workshop:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:workshop:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:workshop:reload', getDetail)
})
</script>
