<template>
  <view class="yd-page-container">
    <wd-navbar title="批次属性配置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="loading" class="py-100rpx text-center">
        <wd-loading />
        <view class="mt-16rpx text-28rpx text-[#999]">
          加载中...
        </view>
      </view>

      <template v-else-if="item">
        <!-- 物料信息 -->
        <view class="px-24rpx pb-24rpx">
          <wd-cell-group border>
            <wd-cell title="物料编码" :value="item.code || '-'" />
            <wd-cell title="物料名称" :value="item.name || '-'" />
            <wd-cell title="物料/产品标识">
              <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
              <text v-else>-</text>
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- 联动提示 -->
        <view class="mx-24rpx mb-24rpx rounded-12rpx bg-[#fff7e6] px-24rpx py-16rpx text-24rpx text-[#ad6800]">
          启用批次管理的物料，至少配置一个批次属性后才能启用。
        </view>

        <!-- 通用属性 -->
        <view class="px-24rpx pb-16rpx text-28rpx text-[#333] font-semibold">
          通用属性
        </view>
        <view class="px-24rpx pb-24rpx">
          <wd-cell-group border>
            <wd-cell title="生产日期" center>
              <view class="flex justify-end">
                <wd-switch v-if="isEdit" v-model="formData.produceDateFlag" />
                <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.produceDateFlag)" />
              </view>
            </wd-cell>
            <wd-cell title="质量状态" center>
              <view class="flex justify-end">
                <wd-switch v-if="isEdit" v-model="formData.qualityStatusFlag" />
                <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.qualityStatusFlag)" />
              </view>
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- ITEM 物料专属 -->
        <template v-if="isItem">
          <view class="px-24rpx pb-16rpx text-28rpx text-[#333] font-semibold">
            物料专属属性
          </view>
          <view class="px-24rpx pb-24rpx">
            <wd-cell-group border>
              <wd-cell title="供应商" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.vendorFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.vendorFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="采购订单编号" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.purchaseOrderCodeFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.purchaseOrderCodeFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="生产批号" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.lotNumberFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.lotNumberFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="有效期" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.expireDateFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.expireDateFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="入库日期" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.receiptDateFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.receiptDateFlag)" />
                </view>
              </wd-cell>
            </wd-cell-group>
          </view>
        </template>

        <!-- PRODUCT 产品专属 -->
        <template v-if="isProduct">
          <view class="px-24rpx pb-16rpx text-28rpx text-[#333] font-semibold">
            产品专属属性
          </view>
          <view class="px-24rpx pb-24rpx">
            <wd-cell-group border>
              <wd-cell title="客户" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.clientFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.clientFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="销售订单编号" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.salesOrderCodeFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.salesOrderCodeFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="生产工单" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.workorderFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.workorderFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="生产任务" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.taskFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.taskFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="工作站" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.workstationFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.workstationFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="工具" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.toolFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.toolFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="模具" center>
                <view class="flex justify-end">
                  <wd-switch v-if="isEdit" v-model="formData.moldFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.moldFlag)" />
                </view>
              </wd-cell>
            </wd-cell-group>
          </view>
        </template>

        <view class="h-160rpx" />
      </template>
    </scroll-view>

    <!-- 保存按钮（仅 edit 模式） -->
    <view v-if="isEdit && hasAccessByCodes(['mes:md-item:update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="saving" @click="handleSave">
          保存批次属性
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { MdItemBatchConfig } from '@/api/mes/md/item/batchConfig'
import type { MdItem } from '@/api/mes/md/item'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getItem } from '@/api/mes/md/item'
import { getBatchConfigByItemId, saveBatchConfig } from '@/api/mes/md/item/batchConfig'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{ itemId?: number | string, mode?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const isEdit = computed(() => props.mode === 'edit') // 是否编辑模式
const item = ref<MdItem>() // 物料信息
const itemOrProduct = computed(() => String(item.value?.itemOrProduct || '').toUpperCase()) // 物料产品标识
const isItem = computed(() => itemOrProduct.value === 'ITEM') // 是否物料
const isProduct = computed(() => itemOrProduct.value === 'PRODUCT') // 是否产品
const loading = ref(false) // 页面加载状态
const saving = ref(false) // 保存状态

/** 所有属性字段默认 false */
function defaultForm(): MdItemBatchConfig {
  return {
    itemId: parseId(props.itemId) || 0,
    produceDateFlag: false,
    expireDateFlag: false,
    receiptDateFlag: false,
    vendorFlag: false,
    clientFlag: false,
    salesOrderCodeFlag: false,
    purchaseOrderCodeFlag: false,
    workorderFlag: false,
    taskFlag: false,
    workstationFlag: false,
    toolFlag: false,
    moldFlag: false,
    lotNumberFlag: false,
    qualityStatusFlag: false,
  }
}

const formData = ref<MdItemBatchConfig>(defaultForm()) // 表单数据

/** 接口可空布尔统一按关闭处理，避免覆盖本地默认值。 */
function hydrateConfig(config: MdItemBatchConfig | null): MdItemBatchConfig {
  if (!config) {
    return defaultForm()
  }
  return {
    itemId: parseId(props.itemId) as number,
    produceDateFlag: Boolean(config.produceDateFlag),
    expireDateFlag: Boolean(config.expireDateFlag),
    receiptDateFlag: Boolean(config.receiptDateFlag),
    vendorFlag: Boolean(config.vendorFlag),
    clientFlag: Boolean(config.clientFlag),
    salesOrderCodeFlag: Boolean(config.salesOrderCodeFlag),
    purchaseOrderCodeFlag: Boolean(config.purchaseOrderCodeFlag),
    workorderFlag: Boolean(config.workorderFlag),
    taskFlag: Boolean(config.taskFlag),
    workstationFlag: Boolean(config.workstationFlag),
    toolFlag: Boolean(config.toolFlag),
    moldFlag: Boolean(config.moldFlag),
    lotNumberFlag: Boolean(config.lotNumberFlag),
    qualityStatusFlag: Boolean(config.qualityStatusFlag),
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载页面数据 */
async function loadAll() {
  if (!props.itemId) {
    return
  }
  loading.value = true
  try {
    const [itemData, config] = await Promise.all([
      getItem(props.itemId as number),
      getBatchConfigByItemId(props.itemId as number),
    ])
    item.value = itemData
    if (!itemData.batchFlag) {
      toast.warning('该物料未启用批次管理')
      delay(handleBack)
      return
    }
    formData.value = hydrateConfig(config)
  } finally {
    loading.value = false
  }
}

/** 至少选择一个可见属性 */
function hasAnyChecked(): boolean {
  const f = formData.value
  const common = f.produceDateFlag || f.qualityStatusFlag
  if (isItem.value) {
    return common || f.vendorFlag || f.purchaseOrderCodeFlag || f.lotNumberFlag || f.expireDateFlag || f.receiptDateFlag
  }
  if (isProduct.value) {
    return common || f.clientFlag || f.salesOrderCodeFlag || f.workorderFlag || f.taskFlag || f.workstationFlag || f.toolFlag || f.moldFlag
  }
  return common
}

/** 保存配置 */
async function handleSave() {
  if (!hasAnyChecked()) {
    toast.warning('至少选择一个批次属性')
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认保存批次属性配置吗？',
    })
  } catch {
    return
  }

  saving.value = true
  try {
    await saveBatchConfig(formData.value)
    toast.success('保存成功')
    // 重新加载，展示后端实际保存结果
    const config = await getBatchConfigByItemId(props.itemId as number)
    formData.value = hydrateConfig(config)
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(() => {
  if (!props.itemId) {
    toast.warning('缺少物料编号')
    delay(handleBack)
    return
  }
  loadAll()
})
</script>
