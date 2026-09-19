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
          <wd-form-item title="出差事由" title-width="200rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入出差事由"
            />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="200rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="200rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item v-if="dayCount > 0" title="出差天数" title-width="200rpx">
            <text class="text-28rpx text-[#333]">{{ dayCount }} 天</text>
          </wd-form-item>
          <wd-form-item title="同行人" title-width="200rpx" prop="companion">
            <wd-input
              v-model="formData.companion"
              clearable
              :maxlength="128"
              placeholder="请输入同行人"
            />
          </wd-form-item>
          <wd-form-item title="预计费用（元）" title-width="200rpx" prop="estimatedPrice">
            <wd-input-number
              v-model="formData.estimatedPrice"
              allow-null
              :min="0"
              :precision="2"
              placeholder="请输入预计费用"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="200rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/travel-apply" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />

      <!-- 行程明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-semibold">行程明细</text>
          <wd-button size="small" variant="plain" @click="handleAddItem">
            添加行程
          </wd-button>
        </view>
        <view v-if="items.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
          暂无行程明细，请点击右上角添加
        </view>
        <view
          v-for="(row, index) in items"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-8rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">行程 {{ index + 1 }}</text>
            <wd-icon name="delete" size="32rpx" color="#ee0a24" @click="handleRemoveItem(index)" />
          </view>
          <yd-tree-select
            v-model="row.departureAreaId"
            :data="areaTree"
            label="出发城市"
            label-width="180rpx"
            placeholder="请选择出发城市"
          />
          <yd-tree-select
            v-model="row.arrivalAreaId"
            :data="areaTree"
            label="到达城市"
            label-width="180rpx"
            placeholder="请选择到达城市"
          />
          <wd-form-item title="开始日期" title-width="180rpx">
            <view class="flex items-center justify-end gap-12rpx" @click="openItemDatePicker(index, 'startTime')">
              <text class="text-28rpx" :class="row.startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ row.startTime === '' ? '请选择开始日期' : formatDate(row.startTime) }}
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束日期" title-width="180rpx">
            <view class="flex items-center justify-end gap-12rpx" @click="openItemDatePicker(index, 'endTime')">
              <text class="text-28rpx" :class="row.endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ row.endTime === '' ? '请选择结束日期' : formatDate(row.endTime) }}
              </text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="row.transportType"
            label="交通方式"
            label-width="180rpx"
            :dict-type="DICT_TYPE.OA_TRANSPORT_TYPE"
            placeholder="请选择交通方式"
          />
          <wd-form-item title="备注" title-width="180rpx">
            <wd-input
              v-model="row.remark"
              clearable
              :maxlength="500"
              placeholder="请输入备注"
            />
          </wd-form-item>
        </view>
      </view>
      <!-- 行程日期共用选择器：editingItemDate 记录当前编辑的行和字段 -->
      <wd-datetime-picker
        v-model="editingItemDate.value"
        v-model:visible="itemDateVisible"
        type="date"
        :title="editingItemDate.key === 'startTime' ? '开始日期' : '结束日期'"
        @confirm="handleItemDateConfirm"
      />
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
import type { TravelApply } from '@/api/oa/travel/apply'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createTravelApply, getTravelApply, updateTravelApply } from '@/api/oa/travel/apply'
import { getAreaTree } from '@/api/system/area'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

/** 行程明细行：时间字段本地用时间戳承接，提交时直接传给后端 */
interface TravelItemRow {
  departureAreaId?: number
  arrivalAreaId?: number
  startTime: number | ''
  endTime: number | ''
  transportType?: number
  remark?: string
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
const getTitle = computed(() => props.id ? '编辑出差申请' : '新增出差申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<TravelApply>>({
  id: undefined,
  reason: '',
  companion: '',
  estimatedPrice: undefined,
  remark: '',
  fileUrls: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const dayCount = computed(() => // 出差天数预览，与后端 getDaysBetweenCeiling 一致按毫秒向上取整
  startTime.value !== '' && endTime.value !== '' && endTime.value > startTime.value
    ? Math.ceil((endTime.value - startTime.value) / 86400000)
    : 0)
const items = ref<TravelItemRow[]>([]) // 行程明细
const areaTree = ref<any[]>([]) // 地区树数据
const formSchema = createFormSchema({
  reason: [{ required: true, message: '出差事由不能为空' }, { max: 500 }],
  companion: [{ max: 128 }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用
const itemDateVisible = ref(false) // 行程日期选择器显示状态
const editingItemDate = ref({ index: 0, key: 'startTime' as 'startTime' | 'endTime', value: '' as number | '' }) // 当前编辑的行程日期

/** 打开行程日期选择器 */
function openItemDatePicker(index: number, key: 'startTime' | 'endTime') {
  editingItemDate.value = { index, key, value: items.value[index][key] }
  itemDateVisible.value = true
}

/** 确认行程日期 */
function handleItemDateConfirm({ value }: { value: number }) {
  items.value[editingItemDate.value.index][editingItemDate.value.key] = value
}

/** 添加行程 */
function handleAddItem() {
  items.value.push({ startTime: '', endTime: '', remark: '' })
}

/** 移除行程 */
function handleRemoveItem(index: number) {
  items.value.splice(index, 1)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/travel/apply/index')
}

/** 加载出差申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getTravelApply(Number(props.id))
  formData.value = data
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
  items.value = (data.items || []).map(row => ({
    departureAreaId: row.departureAreaId,
    arrivalAreaId: row.arrivalAreaId,
    startTime: row.startTime ? toTimestamp(row.startTime) : '',
    endTime: row.endTime ? toTimestamp(row.endTime) : '',
    transportType: row.transportType,
    remark: row.remark || '',
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
  if (items.value.length === 0) {
    toast.warning('请添加行程明细')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime；行程明细仍为自然日期
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
      items: items.value.map(row => ({
        departureAreaId: row.departureAreaId,
        arrivalAreaId: row.arrivalAreaId,
        startTime: row.startTime === '' ? undefined : row.startTime,
        endTime: row.endTime === '' ? undefined : row.endTime,
        transportType: row.transportType,
        remark: row.remark || undefined,
      })),
    } as unknown as TravelApply
    if (props.id) {
      await updateTravelApply(data)
      toast.success('修改成功')
    } else {
      await createTravelApply(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:travel-apply:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree()
  getDetail()
})
</script>
