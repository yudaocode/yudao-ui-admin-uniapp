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
          <wd-form-item title="关联出差申请" title-width="220rpx" prop="travelApplyId">
            <view class="flex items-center justify-end gap-12rpx" @click="openApplyPicker">
              <text class="text-28rpx" :class="selectedApplyNo ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedApplyNo || '请选择关联出差申请' }}
              </text>
              <wd-icon name="arrow-right" size="26rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="出差事由" title-width="220rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              placeholder="请输入出差事由"
            />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="220rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="220rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item v-if="dayCount > 0" title="出差天数" title-width="220rpx">
            <text class="text-28rpx text-[#333]">{{ dayCount }} 天</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
            />
          </wd-form-item>
          <wd-form-item title="报销附件" title-width="220rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/travel-reimbursement" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />

      <!-- 费用明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-semibold">费用明细</text>
          <wd-button size="small" variant="plain" @click="handleAddItem">
            添加费用
          </wd-button>
        </view>
        <view v-if="items.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
          暂无费用明细，请点击右上角添加
        </view>
        <view
          v-for="(row, index) in items"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-8rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">费用 {{ index + 1 }}</text>
            <wd-icon name="delete" size="32rpx" color="#ee0a24" @click="handleRemoveItem(index)" />
          </view>
          <yd-form-picker
            v-model="row.expenseType"
            label="费用类型"
            label-width="180rpx"
            :dict-type="DICT_TYPE.OA_EXPENSE_TYPE"
            placeholder="请选择费用类型"
          />
          <wd-form-item title="发生日期" title-width="180rpx">
            <view class="flex items-center justify-end gap-12rpx" @click="openItemDatePicker(index)">
              <text class="text-28rpx" :class="row.expenseTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ row.expenseTime === '' ? '请选择发生日期' : formatDate(row.expenseTime) }}
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="出发地" title-width="180rpx">
            <wd-input
              v-model="row.departureCity"
              clearable
              :maxlength="64"
              placeholder="请输入出发地"
            />
          </wd-form-item>
          <wd-form-item title="到达地" title-width="180rpx">
            <wd-input
              v-model="row.arrivalCity"
              clearable
              :maxlength="64"
              placeholder="请输入到达地"
            />
          </wd-form-item>
          <wd-form-item title="金额（元）" title-width="180rpx">
            <wd-input-number
              v-model="row.price"
              allow-null
              :min="0"
              :precision="2"
              placeholder="请输入金额"
            />
          </wd-form-item>
          <wd-form-item title="费用说明" title-width="180rpx">
            <wd-input
              v-model="row.description"
              clearable
              placeholder="请输入费用说明"
            />
          </wd-form-item>
        </view>
        <view v-if="items.length > 0" class="mt-8rpx text-right text-26rpx text-[#666]">
          报销总金额：<text class="text-[#fa541c] font-semibold">{{ totalPrice }} 元</text>
        </view>
      </view>
      <!-- 费用发生日期共用选择器：editingItemIndex 记录当前编辑的行 -->
      <wd-datetime-picker
        v-model="editingItemDate"
        v-model:visible="itemDateVisible"
        type="date"
        title="发生日期"
        @confirm="handleItemDateConfirm"
      />
    </view>

    <!-- 出差申请选择弹窗 -->
    <wd-popup
      v-model="applyPickerVisible"
      position="bottom"
      root-portal
      custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">选择出差申请</text>
          <wd-icon name="close" size="32rpx" color="#999" @click="applyPickerVisible = false" />
        </view>
        <view class="px-24rpx pb-12rpx">
          <wd-search
            v-model="applyKeyword"
            placeholder="请输入单号 / 事由搜索"
            hide-cancel
          />
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1">
          <view class="p-24rpx pt-0">
            <view v-if="filteredApplyList.length === 0" class="py-64rpx text-center text-26rpx text-[#999]">
              暂无可关联的出差申请
            </view>
            <view
              v-for="item in filteredApplyList"
              :key="item.id"
              class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
              @click="handleApplySelect(item)"
            >
              <view class="min-w-0 flex-1">
                <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                  {{ item.no }}
                </view>
                <view class="line-clamp-1 mt-4rpx text-24rpx text-[#999]">
                  {{ item.reason || '-' }} · {{ formatDate(item.startTime) }} 至 {{ formatDate(item.endTime) }}
                </view>
              </view>
              <wd-icon v-if="item.id === formData.travelApplyId" name="check" size="32rpx" color="#1677ff" />
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

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
import type { TravelApply } from '@/api/oa/travel-apply'
import type { TravelReimbursement } from '@/api/oa/travel-reimbursement'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getApprovedTravelApplyList } from '@/api/oa/travel-apply'
import { createTravelReimbursement, getTravelReimbursement, updateTravelReimbursement } from '@/api/oa/travel-reimbursement'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

/** 费用明细行：发生日期本地用时间戳承接，提交时直接传给后端 */
interface ExpenseItemRow {
  expenseType?: number
  expenseTime: number | ''
  departureCity?: string
  arrivalCity?: string
  price?: number
  description?: string
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
const getTitle = computed(() => props.id ? '编辑差旅报销' : '新增差旅报销')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<TravelReimbursement>>({
  id: undefined,
  travelApplyId: undefined,
  reason: '',
  remark: '',
  fileUrls: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const dayCount = computed(() => // 出差天数预览，与后端 getDaysBetweenCeiling 一致按毫秒向上取整
  startTime.value !== '' && endTime.value !== '' && endTime.value > startTime.value
    ? Math.ceil((endTime.value - startTime.value) / 86400000)
    : 0)
const startTimeVisible = ref(false) // 开始日期选择器显示状态
const endTimeVisible = ref(false) // 结束日期选择器显示状态
const items = ref<ExpenseItemRow[]>([]) // 费用明细
const totalPrice = computed(() => // 报销总金额：按费用明细金额汇总
  items.value.reduce((sum, row) => sum + (Number(row.price) || 0), 0).toFixed(2))
const formSchema = createFormSchema({ // 表单校验规则
  reason: [{ required: true, message: '出差事由不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

// ==================== 费用发生日期选择 ====================
const itemDateVisible = ref(false) // 费用发生日期选择器显示状态
const editingItemIndex = ref(0) // 当前编辑的费用明细行号
const editingItemDate = ref<number | ''>('') // 费用发生日期选择器值，空字符串承接未选择

/** 打开费用发生日期选择器 */
function openItemDatePicker(index: number) {
  editingItemIndex.value = index
  editingItemDate.value = items.value[index].expenseTime
  itemDateVisible.value = true
}

/** 确认费用发生日期 */
function handleItemDateConfirm({ value }: { value: number }) {
  items.value[editingItemIndex.value].expenseTime = value
}

/** 添加费用明细 */
function handleAddItem() {
  items.value.push({ expenseTime: '', departureCity: '', arrivalCity: '', description: '' })
}

/** 移除费用明细 */
function handleRemoveItem(index: number) {
  items.value.splice(index, 1)
}

// ==================== 关联出差申请选择 ====================
const applyPickerVisible = ref(false) // 出差申请选择弹窗显示状态
const applyList = ref<TravelApply[]>([]) // 可关联的已通过出差申请列表
const selectedApplyNo = ref('') // 已选出差申请单号回显
const applyKeyword = ref('') // 出差申请弹窗搜索关键词
const filteredApplyList = computed(() => { // 本地过滤：接口返回本人全量已通过申请
  const keyword = applyKeyword.value.trim()
  if (!keyword) {
    return applyList.value
  }
  return applyList.value.filter(item => item.no?.includes(keyword) || item.reason?.includes(keyword))
})

/** 打开出差申请选择弹窗 */
async function openApplyPicker() {
  applyPickerVisible.value = true
  applyList.value = await getApprovedTravelApplyList()
}

/** 选择出差申请：带出事由和日期，换选时覆盖回填 */
function handleApplySelect(item: TravelApply) {
  formData.value.travelApplyId = item.id
  selectedApplyNo.value = item.no || ''
  formData.value.reason = item.reason || ''
  startTime.value = item.startTime ? toTimestamp(item.startTime) : ''
  endTime.value = item.endTime ? toTimestamp(item.endTime) : ''
  applyPickerVisible.value = false
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/travel/reimbursement/index')
}

/** 加载差旅报销详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getTravelReimbursement(Number(props.id))
  formData.value = data
  selectedApplyNo.value = data.travelApplyNo || ''
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
  items.value = (data.items || []).map(row => ({
    expenseType: row.expenseType,
    expenseTime: row.expenseTime ? toTimestamp(row.expenseTime) : '',
    departureCity: row.departureCity || '',
    arrivalCity: row.arrivalCity || '',
    price: row.price,
    description: row.description || '',
  }))
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择开始时间和结束时间')
    return
  }
  if (Number(endTime.value) < Number(startTime.value)) {
    toast.warning('结束时间不能早于开始时间')
    return
  }
  if (!formData.value.fileUrls?.length) {
    toast.warning('请上传报销附件')
    return
  }
  if (items.value.length === 0) {
    toast.warning('请添加费用明细')
    return
  }
  if (items.value.some(row => row.price == null || Number(row.price) < 0)) {
    toast.warning('请填写每行费用金额')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime；费用明细发生日期仍为自然日期
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
      items: items.value.map(row => ({
        expenseType: row.expenseType,
        expenseTime: row.expenseTime === '' ? undefined : row.expenseTime,
        departureCity: row.departureCity || undefined,
        arrivalCity: row.arrivalCity || undefined,
        price: row.price,
        description: row.description || undefined,
      })),
    } as unknown as TravelReimbursement
    if (props.id) {
      await updateTravelReimbursement(data)
      toast.success('修改成功')
    } else {
      await createTravelReimbursement(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:travel-reimbursement:reload')
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
