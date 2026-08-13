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
            <VoucherWordFormPicker
              v-model="formData.voucherWordId"
              prop="voucherWordId"
              :disabled="readOnly"
              @confirm="refreshVoucherNumber"
            />
            <wd-form-item title="凭证号" title-width="220rpx" prop="voucherNumber" center>
              <wd-input-number v-model="formData.voucherNumber" allow-null :min="1" :precision="0" :update-on-init="false" :disabled="readOnly" />
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
              :min-date="minVoucherDate"
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
            <view v-if="!props.id && !readOnly" class="flex gap-16rpx">
              <wd-button size="small" variant="plain" @click="handleOpenTemplateApply">
                套用模板
              </wd-button>
              <wd-button
                v-if="hasAccessByCodes(['fms:config:voucher-template:create'])"
                size="small"
                variant="plain"
                @click="handleOpenTemplateSave"
              >
                保存为模板
              </wd-button>
            </view>
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
              <wd-cell title="合计大写" :value="balanced ? formatFmsUppercaseMoney(debitTotal) : '-'" />
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
                  :limit="100"
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

      <!-- 套用模板弹窗 -->
      <wd-popup
        v-model="templateSelectVisible"
        position="bottom"
        safe-area-inset-bottom
        custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
      >
        <view class="h-full flex flex-col bg-[#f5f5f5]">
          <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
            <wd-button variant="plain" size="small" @click="templateSelectVisible = false">
              取消
            </wd-button>
            <view class="text-32rpx text-[#333] font-semibold">
              套用模板
            </view>
            <view class="w-96rpx" />
          </view>
          <scroll-view scroll-y class="min-h-0 flex-1">
            <view class="p-24rpx">
              <view
                v-for="template in templateList"
                :key="template.id"
                class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
                @click="handleApplyTemplate(template)"
              >
                <view class="text-28rpx text-[#333]">
                  {{ template.name }}
                </view>
                <view class="mt-8rpx text-24rpx text-[#999]">
                  {{ template.categoryName || '未分类' }}
                </view>
              </view>
              <view v-if="templateList.length === 0" class="py-100rpx text-center">
                <wd-empty icon="content" tip="暂无凭证模板" />
              </view>
            </view>
          </scroll-view>
        </view>
      </wd-popup>

      <!-- 保存为模板弹窗 -->
      <wd-popup v-model="templateSaveVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
        <view class="p-32rpx">
          <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
            保存为模板
          </view>
          <view class="mb-24rpx">
            <view class="mb-16rpx text-28rpx text-[#666]">
              模板名称
            </view>
            <wd-input v-model="templateForm.name" clearable placeholder="请输入模板名称" :maxlength="255" />
          </view>
          <view class="mb-32rpx">
            <view class="mb-16rpx text-28rpx text-[#666]">
              模板分类
            </view>
            <wd-radio-group v-model="templateForm.categoryId" type="button">
              <wd-radio v-for="item in templateCategories" :key="item.id" :value="item.id">
                {{ item.name }}
              </wd-radio>
            </wd-radio-group>
          </view>
          <wd-button type="primary" block :loading="templateSaveLoading" @click="handleSaveTemplate">
            确 定
          </wd-button>
        </view>
      </wd-popup>
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Voucher, VoucherSaveReq } from '@/api/fms/voucher'
import type { Subject } from '@/api/fms/config/subject'
import type { VoucherTemplate } from '@/api/fms/config/voucher-template'
import type { VoucherTemplateCategory } from '@/api/fms/config/voucher-template-category'
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { getSubjectList } from '@/api/fms/config/subject'
import { createVoucherTemplate, getVoucherTemplateSimpleList } from '@/api/fms/config/voucher-template'
import { getVoucherTemplateCategorySimpleList } from '@/api/fms/config/voucher-template-category'
import { getVoucherWordSimpleList } from '@/api/fms/config/voucher-word'
import VoucherWordFormPicker from '@/pages-fms/config/voucher-word/components/voucher-word-form-picker.vue'
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
import { formatFmsAmount, formatFmsUppercaseMoney } from '@/pages-fms/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { formatDate, formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import VoucherEntryForm from '../components/voucher-entry-form.vue'

/** 凭证分录编辑状态 */
interface VoucherEntryFormState {
  id?: number // 分录编号
  digest: string // 摘要内容
  subjectId?: number // 科目编号
  quantity?: number // 数量（无录入 UI，编辑时原样透传，避免覆盖已有数量核算数据）
  unitPrice?: number // 单价（同数量，仅透传）
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
const templateSelectVisible = ref(false) // 套用模板弹窗状态
const templateList = ref<VoucherTemplate[]>([]) // 凭证模板列表
const templateSaveVisible = ref(false) // 保存为模板弹窗状态
const templateSaveLoading = ref(false) // 模板保存状态
const templateCategories = ref<VoucherTemplateCategory[]>([]) // 模板分类列表
const templateForm = ref({ name: '', categoryId: undefined as number | undefined }) // 模板保存表单
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
const balanced = computed(() => debitTotal.value === creditTotal.value) // 借贷是否平衡，允许合计为负的红字凭证

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
        quantity: entry.quantity ?? undefined,
        unitPrice: entry.unitPrice ?? undefined,
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
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
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
      // 附件走独立的修改接口；上传失败时凭证已保存，提示后正常返回列表
      let attachmentFailed = false
      if (formData.value.attachmentUrls.length > 0) {
        try {
          await updateVoucherAttachments({
            id: voucherId,
            accountSetId: currentAccountSetId,
            attachmentUrls: formData.value.attachmentUrls,
          })
        } catch {
          attachmentFailed = true
        }
      }
      if (attachmentFailed) {
        toast.warning('凭证已保存，附件上传失败')
      } else {
        toast.success('新增成功')
      }
    }
    uni.$emit('fms:voucher:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 打开套用模板弹窗 */
async function handleOpenTemplateApply() {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) {
    return
  }
  templateList.value = await getVoucherTemplateSimpleList(currentAccountSetId)
  templateSelectVisible.value = true
}

/** 套用凭证模板：模板分录填入当前分录区 */
function handleApplyTemplate(template: VoucherTemplate) {
  const subjectIds = new Set(subjectList.value.map(item => item.id))
  if (template.entries.some(entry => !subjectIds.has(entry.subjectId))) {
    toast.warning('模板包含当前账套不可用的会计科目，暂不能套用')
    return
  }
  formData.value.entries = template.entries.map(entry => ({
    digest: entry.digest,
    subjectId: entry.subjectId,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    debitAmount: entry.debitAmount,
    creditAmount: entry.creditAmount,
    auxiliaries: (entry.auxiliaries || []).map(item => ({
      typeId: item.typeId,
      itemId: item.itemId,
      name: item.name,
    })),
  }))
  templateSelectVisible.value = false
  toast.success(`已套用凭证模板“${template.name}”`)
}

/** 打开保存为模板弹窗：先复用分录校验与借贷平衡校验 */
async function handleOpenTemplateSave() {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId || !entryEditorRef.value?.validate()) {
    return
  }
  if (!balanced.value) {
    toast.warning('凭证借贷金额不平衡')
    return
  }
  if (templateCategories.value.length === 0) {
    templateCategories.value = await getVoucherTemplateCategorySimpleList(currentAccountSetId)
  }
  templateForm.value = { name: '', categoryId: undefined }
  templateSaveVisible.value = true
}

/** 保存当前分录为凭证模板 */
async function handleSaveTemplate() {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) {
    return
  }
  if (!templateForm.value.name.trim()) {
    toast.warning('请输入模板名称')
    return
  }
  if (!templateForm.value.categoryId) {
    toast.warning('请选择模板分类')
    return
  }
  templateSaveLoading.value = true
  try {
    await createVoucherTemplate({
      accountSetId: currentAccountSetId,
      name: templateForm.value.name.trim(),
      categoryId: templateForm.value.categoryId,
      entries: filledEntries.value.map(entry => ({
        digest: entry.digest.trim(),
        subjectId: entry.subjectId!,
        quantity: entry.quantity,
        unitPrice: entry.unitPrice,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        auxiliaries: entry.auxiliaries
          .filter(item => item.itemId)
          .map(item => ({ typeId: item.typeId, itemId: item.itemId! })),
      })),
    })
    toast.success('模板保存成功')
    templateSaveVisible.value = false
    uni.$emit('fms:config:voucher-template:reload')
  } finally {
    templateSaveLoading.value = false
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
