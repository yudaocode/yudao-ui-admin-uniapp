<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <!-- TODO @AI：是不是少了【套账的选择？】 -->

    <template v-if="fmsStore.accountSet">
      <!-- 表单区域 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-cell v-if="detail" title="审核状态">
              <wd-tag :type="detail.status === FmsVoucherStatus.APPROVED ? 'success' : 'warning'" plain>
                {{ detail.status === FmsVoucherStatus.APPROVED ? '已审核' : '待审核' }}
              </wd-tag>
            </wd-cell>
            <wd-form-item
              title="凭证字"
              title-width="220rpx"
              prop="voucherWordId"
              :disabled="readOnly"
              is-link
              :value="voucherWordName"
              placeholder="请选择凭证字"
              @click="handleOpenVoucherWord"
            />
            <wd-form-item title="凭证号" title-width="220rpx" prop="voucherNumber" center>
              <wd-input-number v-model="formData.voucherNumber" :min="1" :precision="0" :disabled="readOnly" />
            </wd-form-item>
            <wd-form-item
              title="凭证日期"
              title-width="220rpx"
              prop="voucherTime"
              :disabled="readOnly"
              is-link
              :value="formatDate(formData.voucherTime) || ''"
              placeholder="请选择凭证日期"
              @click="dateVisible = true"
            />
            <wd-datetime-picker
              v-model="formData.voucherTime"
              v-model:visible="dateVisible"
              title="请选择凭证日期"
              type="date"
              :min-date="props.id ? undefined : minVoucherDate"
              :disabled="readOnly"
              @confirm="refreshVoucherNumber"
            />
            <wd-form-item title="附单据" title-width="220rpx" prop="attachmentCount" center>
              <view class="flex items-center justify-end gap-12rpx">
                <wd-input-number v-model="formData.attachmentCount" :min="0" :precision="0" :disabled="readOnly" />
                <text class="text-28rpx text-[#666]">张</text>
              </view>
            </wd-form-item>
          </wd-cell-group>

          <!-- 凭证分录 -->
          <view class="flex items-center justify-between px-24rpx py-16rpx">
            <text class="text-28rpx text-[#333] font-semibold">凭证分录</text>
          </view>
          <view class="px-24rpx">
            <VoucherEntryForm
              ref="entryEditorRef"
              v-model="formData.entries"
              :account-set-id="accountSetId"
              :subjects="subjectList"
              :disabled="readOnly"
            />
          </view>

          <!-- 借贷合计 -->
          <view class="mt-24rpx">
            <wd-cell-group border>
              <wd-cell title="借方合计" :value="formatFmsAmount(debitTotal)" />
              <wd-cell title="贷方合计" :value="formatFmsAmount(creditTotal)" />
              <wd-cell v-if="!balanced" title="平衡状态">
                <text class="text-28rpx text-[#ee0a24]">借贷不平衡</text>
              </wd-cell>
            </wd-cell-group>
          </view>

          <!-- TODO @AI：录制凭证的时候，是否需要上传附件？对齐下 vue3 + ep 噢； -->
          <!-- 凭证附件 -->
          <view class="mt-24rpx">
            <wd-cell-group border>
              <wd-form-item title="附件" title-width="220rpx">
                <yd-upload-imgs
                  v-model="formData.attachmentUrls"
                  directory="fms/voucher"
                  :file-type="FMS_VOUCHER_ATTACHMENT_FILE_TYPES"
                  :limit="9"
                  :disabled="readOnly"
                />
              </wd-form-item>
            </wd-cell-group>
          </view>
        </wd-form>

        <!-- 底部安全区域 -->
        <view class="h-160rpx" />
      </scroll-view>

      <!-- 底部保存按钮 -->
      <view v-if="!readOnly" class="yd-detail-footer">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>

      <!-- 凭证字选择器 -->
      <wd-select-picker
        ref="voucherWordPickerRef"
        v-model="formData.voucherWordId"
        title="选择凭证字"
        :columns="voucherWordList"
        value-key="id"
        label-key="name"
        type="radio"
        @confirm="refreshVoucherNumber"
      />
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SelectPickerInstance } from '@wot-ui/ui/components/wd-select-picker/types'
import type { Voucher, VoucherSaveReq } from '@/api/fms/voucher'
import type { Subject } from '@/api/fms/config/subject'
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { getSubjectList } from '@/api/fms/config/subject'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import {
  createVoucher,
  getNextVoucherNumber,
  getVoucher,
  updateVoucher,
  updateVoucherAttachments,
} from '@/api/fms/voucher'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FMS_VOUCHER_ATTACHMENT_FILE_TYPES, FmsVoucherStatus } from '@/pages-fms/utils/constants'
import { formatFmsAmount } from '@/pages-fms/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VoucherEntryForm from '../components/voucher-entry-form.vue'

/** 凭证分录编辑状态 */
interface VoucherEntryFormState {
  id?: number // 分录编号
  digest: string // 摘要内容
  subjectId?: number // 科目编号
  debitAmount?: number // 借方金额
  creditAmount?: number // 贷方金额
  auxiliaries: { typeId: number, itemId?: number, name?: string }[] // 辅助核算项目
}

const props = defineProps<{ id?: number }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const fmsStore = useFmsStore()
const getTitle = computed(() => props.id ? '编辑凭证' : '录凭证')
const formLoading = ref(false) // 表单提交状态
const formData = ref({
  id: undefined as number | undefined,
  voucherWordId: undefined as number | undefined,
  voucherNumber: undefined as number | undefined,
  voucherTime: '' as number | '',
  attachmentCount: 0,
  attachmentUrls: [] as string[],
  entries: [] as VoucherEntryFormState[],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const entryEditorRef = ref<InstanceType<typeof VoucherEntryForm>>() // 分录组件引用
const dateVisible = ref(false) // 凭证日期选择器状态
const voucherWordList = ref<VoucherWord[]>([]) // 凭证字列表
const subjectList = ref<Subject[]>([]) // 平铺科目列表
const detail = ref<Voucher>() // 凭证详情
const originalAttachmentUrls = ref<string[]>([]) // 编辑前的附件地址，用于判断附件是否变更
const voucherWordPickerRef = ref<SelectPickerInstance>() // 凭证字选择器
const formSchema = createFormSchema({
  voucherWordId: [{ required: true, message: '凭证字不能为空' }],
  voucherNumber: [
    { required: true, message: '凭证号不能为空' },
    { validator: value => Number.isInteger(Number(value)) && Number(value) > 0, message: '凭证号必须为正整数' },
  ],
  voucherTime: [{ required: true, message: '凭证日期不能为空' }],
  attachmentCount: [{ required: true, message: '附单据张数不能为空' }],
})

const accountSetId = computed(() => fmsStore.accountSet?.id) // 当前账套编号
const voucherWordName = computed(() => // 选中凭证字名称
  voucherWordList.value.find(item => item.id === formData.value.voucherWordId)?.name || '',
)
const savePermission = computed(() => props.id ? 'fms:voucher:update' : 'fms:voucher:create') // 当前保存权限
const readOnly = computed(() => // 已审核、结账生成、只读成员或无保存权限时不允许编辑
  detail.value?.status === FmsVoucherStatus.APPROVED
  || Boolean(detail.value?.closingGenerated)
  || !fmsStore.isAccountSetWritable
  || !hasAccessByCodes([savePermission.value]),
)
const minVoucherDate = computed(() => // 凭证日期不能早于当前会计期间
  fmsStore.currentMonth ? dayjs(`${fmsStore.currentMonth}-01`).valueOf() : undefined,
)
const filledEntries = computed(() => // 非空白的有效分录
  formData.value.entries.filter(entry => !isEntryEmpty(entry)),
)
const debitTotal = computed(() => sumAmount('debitAmount')) // 借方合计金额
const creditTotal = computed(() => sumAmount('creditAmount')) // 贷方合计金额
const balanced = computed(() => debitTotal.value === creditTotal.value && debitTotal.value > 0) // 借贷是否平衡

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/voucher/list/index')
}

/** 判断分录是否完全空白 */
function isEntryEmpty(entry: VoucherEntryFormState) {
  return !(
    entry.digest?.trim()
    || entry.subjectId
    || entry.debitAmount
    || entry.creditAmount
    || entry.auxiliaries.some(item => item.itemId)
  )
}

/** 汇总借方或贷方金额 */
function sumAmount(field: 'debitAmount' | 'creditAmount') {
  return Number(
    formData.value.entries.reduce((total, entry) => total + Number(entry[field] || 0), 0).toFixed(2),
  )
}

/** 打开凭证字选择器 */
function handleOpenVoucherWord() {
  if (readOnly.value) {
    return
  }
  voucherWordPickerRef.value?.open()
}

/** 创建空白分录 */
function createEmptyEntry(): VoucherEntryFormState {
  return { digest: '', auxiliaries: [] }
}

/** 获得默认凭证日期：当前期间内取今天，否则取当前期间最后一天 */
function getDefaultVoucherTime() {
  const currentMonth = fmsStore.currentMonth
  if (!currentMonth || dayjs().format('YYYY-MM') === currentMonth) {
    return dayjs().startOf('day').valueOf()
  }
  return dayjs(`${currentMonth}-01`).endOf('month').startOf('day').valueOf()
}

/** 刷新凭证号 */
async function refreshVoucherNumber() {
  const currentAccountSetId = accountSetId.value
  const { voucherWordId, voucherTime } = formData.value
  if (props.id || !currentAccountSetId || !voucherWordId || !voucherTime) {
    return
  }
  formData.value.voucherNumber = await getNextVoucherNumber(
    currentAccountSetId,
    voucherWordId,
    formatDateTime(voucherTime),
  )
}

/** 初始化新增表单 */
async function initCreate() {
  formData.value.voucherWordId
    = voucherWordList.value.find(item => item.defaultStatus)?.id || voucherWordList.value[0]?.id
  formData.value.voucherTime = getDefaultVoucherTime()
  formData.value.entries = [createEmptyEntry(), createEmptyEntry()]
  await refreshVoucherNumber()
}

/** 加载详情 */
async function getDetail() {
  const currentAccountSetId = accountSetId.value
  if (!props.id || !currentAccountSetId) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getVoucher(currentAccountSetId, Number(props.id))
    detail.value = data
    formData.value = {
      id: data.id,
      voucherWordId: data.voucherWordId,
      voucherNumber: data.voucherNumber,
      voucherTime: dayjs(data.voucherTime).startOf('day').valueOf(),
      attachmentCount: data.attachmentCount,
      attachmentUrls: data.attachmentUrls || [],
      entries: (data.entries || []).map(entry => ({
        id: entry.id,
        digest: entry.digest,
        subjectId: entry.subjectId,
        debitAmount: entry.debitAmount ?? undefined,
        creditAmount: entry.creditAmount ?? undefined,
        auxiliaries: (entry.auxiliaries || []).map(item => ({
          typeId: item.typeId,
          itemId: item.itemId,
          name: item.name,
        })),
      })),
    }
    originalAttachmentUrls.value = [...(data.attachmentUrls || [])]
  } finally {
    toast.close()
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !entryEditorRef.value?.validate()) {
    return
  }
  if (!balanced.value) {
    toast.warning('凭证借贷金额不平衡')
    return
  }

  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) {
    return
  }
  const data: VoucherSaveReq = {
    id: formData.value.id,
    accountSetId: currentAccountSetId,
    voucherWordId: formData.value.voucherWordId!,
    voucherNumber: Number(formData.value.voucherNumber),
    voucherTime: Number(formData.value.voucherTime),
    attachmentCount: Number(formData.value.attachmentCount || 0),
    entries: filledEntries.value.map(entry => ({
      id: entry.id,
      digest: entry.digest.trim(),
      subjectId: entry.subjectId!,
      debitAmount: entry.debitAmount ?? undefined,
      creditAmount: entry.creditAmount ?? undefined,
      auxiliaries: entry.auxiliaries
        .filter(item => item.itemId)
        .map(item => ({ typeId: item.typeId, itemId: item.itemId! })),
    })),
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateVoucher(data)
      // 附件走独立的修改接口，仅在变更时提交
      if (JSON.stringify(formData.value.attachmentUrls) !== JSON.stringify(originalAttachmentUrls.value)) {
        await updateVoucherAttachments({
          id: formData.value.id!,
          accountSetId: currentAccountSetId,
          attachmentUrls: formData.value.attachmentUrls,
        })
      }
      toast.success('修改成功')
    } else {
      const voucherId = await createVoucher(data)
      if (formData.value.attachmentUrls.length > 0) {
        await updateVoucherAttachments({
          id: voucherId,
          accountSetId: currentAccountSetId,
          attachmentUrls: formData.value.attachmentUrls,
        })
      }
      toast.success('新增成功')
    }
    uni.$emit('fms:voucher:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) {
    return
  }
  // 加载凭证录入依赖的基础数据
  const [wordList, subjects] = await Promise.all([
    getVoucherWordSimpleList(currentAccountSetId),
    getSubjectList(currentAccountSetId),
    fmsStore.loadCurrentMonth(),
  ])
  voucherWordList.value = wordList
  subjectList.value = subjects
  if (props.id) {
    await getDetail()
  } else {
    await initCreate()
  }
})
</script>
