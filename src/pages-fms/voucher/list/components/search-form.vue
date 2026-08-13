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
      <VoucherWordSearchPicker
        v-model="formData.voucherWordId"
        @change="item => (voucherWordName = item?.name || '')"
      />
      <SubjectSearchPicker
        v-model="formData.subjectId"
        @change="item => (subjectName = item ? `${item.code} ${item.name}` : '')"
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
        @change="user => creatorUserName = user?.nickname || ''"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import SubjectSearchPicker from '@/pages-fms/config/subject/components/subject-search-picker.vue'
import VoucherWordSearchPicker from '@/pages-fms/config/voucher-word/components/voucher-word-search-picker.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsVoucherStatusOptions } from '@/pages-fms/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import dayjs from 'dayjs'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const fmsStore = useFmsStore()
const visible = ref(false) // 搜索弹窗显示状态
const voucherWordName = ref('') // 已选凭证字名称，用于 placeholder 展示
const subjectName = ref('') // 已选科目名称，用于 placeholder 展示
const creatorUserName = ref('') // 已选制单人名称，用于 placeholder 展示
const formData = reactive({
  voucherTime: [undefined, undefined] as [number | undefined, number | undefined],
  voucherWordId: undefined as number | undefined,
  subjectId: undefined as number | undefined,
  voucherNumber: undefined as number | undefined,
  digest: undefined as string | undefined,
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined,
  creatorUserId: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件 placeholder 拼接
  const conditions: string[] = []
  if (formData.voucherTime[0] || formData.voucherTime[1]) {
    conditions.push(`凭证日期:${formatDate(formData.voucherTime[0]) || '?'}~${formatDate(formData.voucherTime[1]) || '?'}`)
  }
  if (formData.voucherWordId !== undefined) {
    conditions.push(`凭证字:${voucherWordName.value}`)
  }
  if (formData.subjectId !== undefined) {
    conditions.push(`科目:${subjectName.value}`)
  }
  if (formData.voucherNumber !== undefined) {
    conditions.push(`凭证号:${formData.voucherNumber}`)
  }
  if (formData.digest) {
    conditions.push(`摘要:${formData.digest}`)
  }
  if (formData.minAmount !== undefined || formData.maxAmount !== undefined) {
    conditions.push(`金额:${formData.minAmount ?? ''}~${formData.maxAmount ?? ''}`)
  }
  if (formData.creatorUserId !== undefined) {
    conditions.push(`制单人:${creatorUserName.value || formData.creatorUserId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${FmsVoucherStatusOptions.find(item => item.value === formData.status)?.label || ''}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索凭证'
})

/** 当前会计期间的默认凭证日期范围（对齐 PC 默认查当前期间） */
function getDefaultVoucherTime(): [number | undefined, number | undefined] {
  const month = fmsStore.currentMonth || dayjs().format('YYYY-MM')
  const date = dayjs(`${month}-01`)
  return [date.startOf('month').valueOf(), date.endOf('month').valueOf()]
}

/** 恢复搜索条件默认值 */
function resetFormData() {
  formData.voucherTime = getDefaultVoucherTime()
  formData.voucherWordId = undefined
  formData.subjectId = undefined
  formData.voucherNumber = undefined
  formData.digest = undefined
  formData.minAmount = undefined
  formData.maxAmount = undefined
  formData.creatorUserId = undefined
  formData.status = undefined
  voucherWordName.value = ''
  subjectName.value = ''
  creatorUserName.value = ''
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    voucherTime: formatDateRange(formData.voucherTime),
    voucherWordId: formData.voucherWordId,
    subjectId: formData.subjectId,
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
  resetFormData()
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
})

/** 账套变化时刷新选项，并完整清空已选条件，避免旧条件打到新账套 */
watch(() => fmsStore.accountSet?.id, async () => {
  if (fmsStore.accountSet && !fmsStore.currentMonth) {
    await fmsStore.loadCurrentMonth() // 切换账套后期间被清空，先取新账套当前期间再算默认日期
  }
  resetFormData()
}, { immediate: true })
</script>
