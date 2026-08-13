<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <yd-search-date-range
        v-model="formData.voucherTime"
        label="凭证日期"
      />
      <yd-search-picker
        v-model="formData.voucherWordId"
        label="凭证字"
        :columns="voucherWordOptions"
        all-option
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          凭证号
        </view>
        <wd-input v-model.number="formData.voucherNumber" type="number" placeholder="请输入凭证号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          摘要
        </view>
        <wd-input v-model="formData.digest" placeholder="请输入摘要关键词" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          金额
        </view>
        <view class="flex items-center gap-12rpx">
          <wd-input
            v-model.number="formData.minAmount"
            class="flex-1"
            type="digit"
            placeholder="最小金额"
            clearable
          />
          <text class="text-28rpx text-[#999]">至</text>
          <wd-input
            v-model.number="formData.maxAmount"
            class="flex-1"
            type="digit"
            placeholder="最大金额"
            clearable
          />
        </view>
      </view>
      <UserSearchPicker
        v-model="formData.creatorUserId"
        label="制单人"
        placeholder="请选择制单人"
      />
      <yd-search-picker
        v-model="formData.status"
        label="审核状态"
        :columns="[...FmsVoucherStatusOptions]"
        all-option
      />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsVoucherStatusOptions } from '@/pages-fms/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const fmsStore = useFmsStore()
const visible = ref(false) // 搜索弹窗显示状态
const voucherWords = ref<VoucherWord[]>([]) // 凭证字选项来源
const formData = reactive({
  voucherTime: [undefined, undefined] as [number | undefined, number | undefined],
  voucherWordId: undefined as number | undefined,
  voucherNumber: undefined as number | undefined,
  digest: undefined as string | undefined,
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined,
  creatorUserId: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

/** 凭证字选项 */
const voucherWordOptions = computed(() =>
  voucherWords.value.map(item => ({ label: item.name, value: item.id! })),
)

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.voucherTime[0] || formData.voucherTime[1]) {
    conditions.push('凭证日期已选')
  }
  if (formData.voucherWordId !== undefined) {
    conditions.push('凭证字已选')
  }
  if (formData.voucherNumber !== undefined) {
    conditions.push(`凭证号:${formData.voucherNumber}`)
  }
  if (formData.digest) {
    conditions.push(`摘要:${formData.digest}`)
  }
  if (formData.minAmount !== undefined || formData.maxAmount !== undefined) {
    conditions.push('金额已选')
  }
  if (formData.creatorUserId !== undefined) {
    conditions.push('制单人已选')
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${FmsVoucherStatusOptions.find(item => item.value === formData.status)?.label || ''}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索凭证'
})

/** 加载凭证字选项 */
async function loadVoucherWords() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    voucherWords.value = []
    return
  }
  voucherWords.value = await getVoucherWordSimpleList(accountSetId)
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    voucherTime: formatDateRange(formData.voucherTime),
    voucherWordId: formData.voucherWordId,
    voucherNumber: formData.voucherNumber,
    digest: formData.digest || undefined,
    minAmount: formData.minAmount,
    maxAmount: formData.maxAmount,
    creatorUserId: formData.creatorUserId,
    status: formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.voucherTime = [undefined, undefined]
  formData.voucherWordId = undefined
  formData.voucherNumber = undefined
  formData.digest = undefined
  formData.minAmount = undefined
  formData.maxAmount = undefined
  formData.creatorUserId = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
})

/** 账套变化时刷新凭证字选项，并清空已选凭证字 */
watch(() => fmsStore.accountSet?.id, () => {
  formData.voucherWordId = undefined
  loadVoucherWords()
}, { immediate: true })
</script>
