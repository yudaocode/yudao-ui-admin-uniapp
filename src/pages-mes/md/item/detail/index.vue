<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="物料产品详情"
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
        <wd-cell title="物料编码" :value="formData?.code || '-'" />
        <wd-cell title="物料名称" :value="formData?.name || '-'" />
        <wd-cell title="规格型号" :value="formData?.specification || '-'" />
        <wd-cell title="计量单位" :value="formData?.unitMeasureName || '-'" />
        <wd-cell title="物料分类" :value="formData?.itemTypeName || '-'" />
        <wd-cell title="物料/产品标识">
          <dict-tag
            v-if="formData?.itemOrProduct"
            :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT"
            :value="formData.itemOrProduct"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="高值物料">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData?.highValue)" />
        </wd-cell>
        <wd-cell title="批次管理">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData?.batchFlag)" />
        </wd-cell>
        <wd-cell title="安全库存">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData?.safeStockFlag)" />
        </wd-cell>
        <wd-cell v-if="formData?.safeStockFlag" title="最低库存量" :value="formatStock(formData?.minStock)" />
        <wd-cell v-if="formData?.safeStockFlag" title="最高库存量" :value="formatStock(formData?.maxStock)" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <ItemBomSection v-if="tabType === 'bom' && formData?.id" :item-id="formData.id" />
    <ItemBatchConfigSection
      v-if="tabType === 'batch' && formData?.id"
      :item-id="formData.id"
      :item-or-product="formData.itemOrProduct"
    />
    <ItemProcessPictureSection v-if="tabType === 'sip' && formData?.id" :item-id="formData.id" type="sip" />
    <ItemProcessPictureSection v-if="tabType === 'sop' && formData?.id" :item-id="formData.id" type="sop" />
    <ItemSubstituteSection v-if="tabType === 'substitute'" />

    <!-- 底部操作按钮 -->
    <view v-if="formData && tabType === 'basic'" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="handleBarcode">
          条码
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-item:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-item:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteItem, getItem } from '@/api/mes/md/item'
import { useAccess } from '@/hooks/useAccess'
import { buildBarcodeListUrl } from '@/pages-mes/wm/barcode/utils'
import { delay, navigateBackPlus } from '@/utils'
import { BarcodeBizTypeEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ItemBatchConfigSection from '../components/item-batch-config-section.vue'
import ItemBomSection from '../components/item-bom-section.vue'
import ItemProcessPictureSection from '../components/item-process-picture-section.vue'
import ItemSubstituteSection from '../components/item-substitute-section.vue'

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
const formData = ref<MdItem>() // 详情数据
const deleting = ref(false) // 删除状态
const tabIndex = ref(0) // 当前 tab 索引
const tabs = computed(() => { // 详情 tab 配置
  const result = [
    { key: 'basic', title: '基本信息' },
    { key: 'bom', title: 'BOM' },
  ]
  if (formData.value?.batchFlag) {
    result.push({ key: 'batch', title: '批次属性' })
  }
  result.push({ key: 'substitute', title: '替代品' })
  result.push(
    { key: 'sip', title: 'SIP' },
    { key: 'sop', title: 'SOP' },
  )
  return result
})
const tabType = computed(() => tabs.value[tabIndex.value]?.key || 'basic') // 当前 tab 类型

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 格式化库存数量 */
function formatStock(value?: number) {
  if (value === undefined || value === null)
    return '-'
  return String(Number(value.toFixed(2)))
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getItem(Number(props.id))
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
      bizType: BarcodeBizTypeEnum.ITEM,
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
  uni.navigateTo({ url: `/pages-mes/md/item/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该物料产品吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteItem(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:item:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:md:item:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:md:item:reload', getDetail)
})
</script>
