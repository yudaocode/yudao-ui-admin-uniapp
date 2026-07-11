<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="loading" class="py-100rpx text-center">
        <wd-loading />
        <view class="mt-16rpx text-28rpx text-[#999]">
          加载中...
        </view>
      </view>

      <template v-else>
        <!-- 通用属性 -->
        <view class="px-24rpx pb-16rpx pt-24rpx text-28rpx text-[#333] font-semibold">
          通用属性
        </view>
        <view class="px-24rpx pb-24rpx">
          <wd-cell-group border>
            <wd-cell title="生产日期" center>
              <view class="flex justify-end">
                <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.produceDateFlag" />
                <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.produceDateFlag)" />
              </view>
            </wd-cell>
            <wd-cell title="质量状态" center>
              <view class="flex justify-end">
                <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.qualityStatusFlag" />
                <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.qualityStatusFlag)" />
              </view>
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- 物料专属属性 -->
        <template v-if="isItem">
          <view class="px-24rpx pb-16rpx text-28rpx text-[#333] font-semibold">
            物料专属属性
          </view>
          <view class="px-24rpx pb-24rpx">
            <wd-cell-group border>
              <wd-cell title="供应商" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.vendorFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.vendorFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="采购订单编号" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.purchaseOrderCodeFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.purchaseOrderCodeFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="生产批号" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.lotNumberFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.lotNumberFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="有效期" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.expireDateFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.expireDateFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="入库日期" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.receiptDateFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.receiptDateFlag)" />
                </view>
              </wd-cell>
            </wd-cell-group>
          </view>
        </template>

        <!-- 产品专属属性 -->
        <template v-if="isProduct">
          <view class="px-24rpx pb-16rpx text-28rpx text-[#333] font-semibold">
            产品专属属性
          </view>
          <view class="px-24rpx pb-24rpx">
            <wd-cell-group border>
              <wd-cell title="客户" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.clientFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.clientFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="销售订单编号" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.salesOrderCodeFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.salesOrderCodeFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="生产工单" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.workorderFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.workorderFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="生产任务" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.taskFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.taskFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="工作站" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.workstationFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.workstationFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="工具" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.toolFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.toolFlag)" />
                </view>
              </wd-cell>
              <wd-cell title="模具" center>
                <view class="flex justify-end">
                  <wd-switch v-if="hasAccessByCodes(['mes:md-item:update'])" v-model="formData.moldFlag" />
                  <dict-tag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(formData.moldFlag)" />
                </view>
              </wd-cell>
            </wd-cell-group>
          </view>
        </template>
      </template>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 保存按钮 -->
    <view v-if="hasAccessByCodes(['mes:md-item:update'])" class="yd-detail-footer">
      <wd-button type="primary" block :loading="saving" @click="handleSave">
        保存批次属性
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MdItemBatchConfig } from '@/api/mes/md/item/batchConfig'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getBatchConfigByItemId, saveBatchConfig } from '@/api/mes/md/item/batchConfig'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  itemId?: number | string
  itemOrProduct?: string
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 加载状态
const saving = ref(false) // 保存状态
const itemType = computed(() => String(props.itemOrProduct || '').toUpperCase())
const isItem = computed(() => itemType.value === 'ITEM')
const isProduct = computed(() => itemType.value === 'PRODUCT')
const formData = ref<MdItemBatchConfig>(defaultForm()) // 批次属性配置

/** 获取物料编号 */
function getItemId() {
  const itemId = Number(props.itemId)
  return Number.isFinite(itemId) && itemId > 0 ? itemId : undefined
}

/** 默认批次属性 */
function defaultForm(): MdItemBatchConfig {
  return {
    itemId: getItemId() || 0,
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

/** 归一化接口返回 */
function hydrateConfig(config: MdItemBatchConfig | null): MdItemBatchConfig {
  if (!config) {
    return defaultForm()
  }
  return {
    itemId: getItemId() || 0,
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

/** 加载批次属性配置 */
async function loadConfig() {
  const itemId = getItemId()
  if (!itemId) {
    formData.value = defaultForm()
    return
  }
  loading.value = true
  try {
    formData.value = hydrateConfig(await getBatchConfigByItemId(itemId))
  } finally {
    loading.value = false
  }
}

/** 至少选择一个可见属性 */
function hasAnyChecked(): boolean {
  const data = formData.value
  const common = data.produceDateFlag || data.qualityStatusFlag
  if (isItem.value) {
    return Boolean(common || data.vendorFlag || data.purchaseOrderCodeFlag || data.lotNumberFlag || data.expireDateFlag || data.receiptDateFlag)
  }
  if (isProduct.value) {
    return Boolean(common || data.clientFlag || data.salesOrderCodeFlag || data.workorderFlag || data.taskFlag || data.workstationFlag || data.toolFlag || data.moldFlag)
  }
  return Boolean(common)
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
    formData.value = hydrateConfig(await getBatchConfigByItemId(Number(props.itemId)))
    loadConfig()
  } finally {
    saving.value = false
  }
}

/** 监听物料编号变化 */
watch(() => props.itemId, loadConfig, { immediate: true })

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:md:item:reload', loadConfig)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:md:item:reload', loadConfig)
})
</script>
