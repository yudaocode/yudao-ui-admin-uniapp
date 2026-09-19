<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="标题" title-width="200rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入标题"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.urgency"
            label="紧急程度"
            label-width="200rpx"
            prop="urgency"
            :dict-type="DICT_TYPE.OA_APPLY_URGENCY"
            placeholder="请选择紧急程度"
          />
          <yd-form-picker
            v-model="formData.paymentMethod"
            label="报销方式"
            label-width="200rpx"
            prop="paymentMethod"
            :dict-type="DICT_TYPE.OA_REIMBURSEMENT_PAYMENT_METHOD"
            placeholder="请选择报销方式"
          />
          <UserFormPicker v-model="formData.witnessUserId" label="证明人" label-width="200rpx" prop="witnessUserId" placeholder="请选择证明人" />
          <wd-form-item title="相关客户" title-width="200rpx" prop="customerName">
            <wd-input
              v-model="formData.customerName"
              clearable
              :maxlength="255"
              placeholder="请输入相关客户"
            />
          </wd-form-item>
          <wd-form-item title="申请原因" title-width="200rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="5000"
              show-word-limit
              placeholder="请输入申请原因"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="200rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/reimbursement" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 报销明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-semibold">报销明细</text>
          <wd-button size="small" variant="plain" @click="handleAddItem">
            添加明细
          </wd-button>
        </view>
        <view v-if="items.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
          暂无报销明细，请点击右上角添加
        </view>
        <view
          v-for="(row, index) in items"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-8rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">明细 {{ index + 1 }}</text>
            <wd-icon name="delete" size="32rpx" color="#ee0a24" @click="handleRemoveItem(index)" />
          </view>
          <wd-form-item title="费用时间" title-width="180rpx">
            <view class="flex items-center justify-end gap-12rpx" @click="openItemDatePicker(index)">
              <text class="text-28rpx" :class="row.expenseTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ row.expenseTime === '' ? '请选择费用时间' : formatDateTime(row.expenseTime) }}
              </text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="row.expenseType"
            label="费用类型"
            label-width="180rpx"
            :dict-type="DICT_TYPE.OA_EXPENSE_TYPE"
            placeholder="请选择费用类型"
          />
          <wd-form-item title="费用说明" title-width="180rpx">
            <wd-input
              v-model="row.description"
              clearable
              :maxlength="500"
              placeholder="请输入费用说明"
            />
          </wd-form-item>
          <wd-form-item title="票据张数" title-width="180rpx">
            <wd-input-number
              v-model="row.invoiceCount"
              allow-null
              :min="0"
              :precision="0"
              placeholder="请输入票据张数"
            />
          </wd-form-item>
          <wd-form-item title="报销金额（元）" title-width="180rpx">
            <wd-input-number
              v-model="row.price"
              allow-null
              :min="0"
              :precision="2"
              placeholder="请输入报销金额"
            />
          </wd-form-item>
        </view>
        <!-- 明细费用时间共用选择器：editingItemIndex 记录当前编辑的行 -->
        <wd-datetime-picker
          v-model="editingItemDate"
          v-model:visible="itemDateVisible"
          type="datetime"
          title="费用时间"
          @confirm="handleItemDateConfirm"
        />
      </view>

      <!-- 合计 -->
      <view v-if="items.length > 0" class="mt-20rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx">
        <text class="text-28rpx text-[#666]">票据总数 {{ totalInvoiceCount }} 张</text>
        <text class="text-28rpx text-[#ee0a24] font-semibold">合计 {{ totalPrice }} 元</text>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存草稿
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Reimbursement, ReimbursementItem } from '@/api/oa/reimbursement'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createReimbursement, getReimbursement, updateReimbursement } from '@/api/oa/reimbursement'
import { UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

/** 报销明细行：费用时间本地用时间戳承接，提交时直接传给后端 */
interface ReimbursementItemRow extends ReimbursementItem {
  expenseTime: number | ''
}

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑费用报销' : '新增费用报销')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Reimbursement>>({
  id: undefined,
  title: '',
  urgency: undefined,
  paymentMethod: undefined,
  witnessUserId: undefined,
  customerName: '',
  reason: '',
  fileUrls: [],
}) // 表单数据
const items = ref<ReimbursementItemRow[]>([]) // 报销明细
const itemDateVisible = ref(false) // 明细费用时间选择器显示状态
const editingItemIndex = ref(0) // 当前编辑费用时间的明细行
const editingItemDate = ref<number | ''>('') // 明细费用时间选择器值
const formSchema = createFormSchema({ // 表单校验规则
  title: [{ required: true, message: '标题不能为空' }, { max: 255 }],
  urgency: [{ required: true, message: '紧急程度不能为空' }],
  paymentMethod: [{ required: true, message: '报销方式不能为空' }],
  witnessUserId: [{ required: true, message: '证明人不能为空' }],
  customerName: [{ required: true, message: '相关客户不能为空' }, { max: 255 }],
  reason: [{ required: true, message: '申请原因不能为空' }, { max: 5000 }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const totalInvoiceCount = computed(() => items.value.reduce((sum, row) => sum + (row.invoiceCount || 0), 0)) // 票据总数
const totalPrice = computed(() => items.value.reduce((sum, row) => sum + (row.price || 0), 0).toFixed(2)) // 报销总金额

/** 打开明细费用时间选择器 */
function openItemDatePicker(index: number) {
  editingItemIndex.value = index
  editingItemDate.value = items.value[index].expenseTime
  itemDateVisible.value = true
}

/** 确认明细费用时间 */
function handleItemDateConfirm({ value }: { value: number }) {
  items.value[editingItemIndex.value].expenseTime = value
}

/** 添加明细 */
function handleAddItem() {
  items.value.push({ expenseTime: '', description: '', invoiceCount: undefined, price: undefined })
}

/** 移除明细 */
function handleRemoveItem(index: number) {
  items.value.splice(index, 1)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/reimbursement/index')
}

/** 加载报销详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getReimbursement(Number(props.id))
  formData.value = data
  items.value = (data.items || []).map(row => ({
    expenseTime: row.expenseTime ? toTimestamp(row.expenseTime) : '',
    expenseType: row.expenseType,
    description: row.description || '',
    invoiceCount: row.invoiceCount,
    price: row.price,
  }))
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (items.value.length === 0) {
    toast.warning('请添加报销明细')
    return
  }
  for (const row of items.value) {
    if (row.expenseTime === '' || row.expenseType == null || row.invoiceCount == null || row.price == null) {
      toast.warning('请完善报销明细的费用时间、类型、票据张数和金额')
      return
    }
    if (!row.description.trim()) { // 费用说明后端 @NotBlank
      toast.warning('请完善报销明细的费用说明')
      return
    }
  }

  formLoading.value = true
  try {
    // 费用时间时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      items: items.value.map(row => ({
        expenseTime: row.expenseTime,
        expenseType: row.expenseType,
        description: row.description || undefined,
        invoiceCount: row.invoiceCount,
        price: row.price,
      })),
    } as unknown as Reimbursement
    if (props.id) {
      await updateReimbursement(data)
      toast.success('修改成功')
    } else {
      await createReimbursement(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:reimbursement:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
