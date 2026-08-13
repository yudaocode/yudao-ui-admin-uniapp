<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="visible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          添加辅助核算明细
        </view>
        <wd-button type="primary" size="small" :disabled="!canConfirm" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <view class="p-24rpx">
        <!-- 所属科目 -->
        <view class="mb-20rpx rounded-12rpx bg-white p-24rpx text-28rpx text-[#333] shadow-sm">
          {{ subject?.subjectCode }} {{ subject?.subjectName }}
        </view>

        <!-- 辅助核算类别 -->
        <view
          v-for="config in subject?.auxiliaryConfigs || []"
          :key="config.auxiliaryTypeId"
          class="mb-20rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleOpen(config)"
        >
          <text class="text-28rpx text-[#666]">{{ config.name }}</text>
          <view class="flex items-center gap-8rpx">
            <text class="text-28rpx" :class="selections[config.auxiliaryTypeId] ? 'text-[#333]' : 'text-[#999]'">
              {{ selections[config.auxiliaryTypeId]?.name || `请选择${config.name}` }}
            </text>
            <wd-icon name="arrow-right" size="12px" color="#999" />
          </view>
        </view>
      </view>
    </view>

    <!-- 辅助核算项目选择器 -->
    <AuxiliaryPicker ref="auxiliaryPickerRef" :account-set-id="accountSetId" @confirm="handleAuxiliaryConfirm" />
  </wd-popup>
</template>

<script lang="ts" setup>
import type {
  InitialBalance,
  InitialBalanceAuxiliaryConfig,
  InitialBalanceAuxiliaryItem,
} from '@/api/fms/config/initial-balance'
import AuxiliaryPicker from '@/pages-fms/voucher/components/auxiliary-picker.vue'

defineProps<{
  accountSetId?: number
}>()

const emit = defineEmits<{
  success: [auxiliaries: InitialBalanceAuxiliaryItem[]]
}>()

const visible = ref(false) // 弹窗显示状态
const subject = ref<InitialBalance>() // 当前科目
const selections = ref<Record<number, InitialBalanceAuxiliaryItem>>({}) // 各类别已选项目
const currentConfig = ref<InitialBalanceAuxiliaryConfig>() // 当前编辑的辅助核算类别
const auxiliaryPickerRef = ref<InstanceType<typeof AuxiliaryPicker>>() // 辅助核算项目选择器

const canConfirm = computed(() => // 所有辅助核算类别都已选择项目时才可确定
  !!subject.value?.auxiliaryConfigs.length
  && subject.value.auxiliaryConfigs.every(config => selections.value[config.auxiliaryTypeId]?.itemId),
)

/** 打开弹窗 */
function open(row: InitialBalance) {
  subject.value = row
  selections.value = {}
  currentConfig.value = undefined
  visible.value = true
}

/** 打开辅助核算项目选择器 */
function handleOpen(config: InitialBalanceAuxiliaryConfig) {
  currentConfig.value = config
  auxiliaryPickerRef.value?.open(config.auxiliaryTypeId, config.name)
}

/** 辅助核算项目选择确认 */
function handleAuxiliaryConfirm({ typeId, item }: { typeId: number, item: { id?: number, name: string } }) {
  const config = currentConfig.value
  if (!config || config.auxiliaryTypeId !== typeId || !item.id) {
    return
  }
  selections.value[config.auxiliaryTypeId] = {
    type: config.type,
    typeId: config.auxiliaryTypeId,
    itemId: item.id,
    name: item.name,
  }
  currentConfig.value = undefined
}

/** 确认添加 */
function handleConfirm() {
  if (!canConfirm.value || !subject.value) {
    return
  }
  emit('success', subject.value.auxiliaryConfigs.map(config => selections.value[config.auxiliaryTypeId]))
  visible.value = false
}

defineExpose({ open })
</script>
