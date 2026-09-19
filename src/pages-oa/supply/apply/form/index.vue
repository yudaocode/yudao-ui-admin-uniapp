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
          <wd-form-item title="领用日期" title-width="200rpx" prop="applyTime">
            <view class="flex items-center justify-end gap-12rpx" @click="applyTimeVisible = true">
              <text class="text-28rpx" :class="applyTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ applyTime === '' ? '请选择领用日期' : formatDate(applyTime) }}
              </text>
              <text v-if="applyTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="applyTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.useType"
            label="使用类型"
            label-width="200rpx"
            prop="useType"
            :dict-type="DICT_TYPE.OA_SUPPLY_USE_TYPE"
            placeholder="请选择使用类型"
          />
          <yd-form-picker
            v-model="formData.pickupMethod"
            label="领取方式"
            label-width="200rpx"
            prop="pickupMethod"
            :dict-type="DICT_TYPE.OA_SUPPLY_PICKUP_METHOD"
            placeholder="请选择领取方式"
          />
          <wd-form-item title="申请事由" title-width="200rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入申请事由"
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
            <yd-upload-file v-model="formData.fileUrls" :limit="10" directory="oa/supply-apply" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="applyTime" v-model:visible="applyTimeVisible" type="date" title="领用日期" />

      <!-- 领用明细 -->
      <view class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#333] font-semibold">领用明细</text>
          <wd-button size="small" variant="plain" @click="openItemPicker">
            添加办公用品
          </wd-button>
        </view>
        <view v-if="items.length === 0" class="py-32rpx text-center text-26rpx text-[#999]">
          暂无领用明细，请点击右上角添加
        </view>
        <view
          v-for="(row, index) in items"
          :key="row.itemId"
          class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-24rpx"
        >
          <view class="mb-12rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-30rpx text-[#333] font-semibold">{{ row.itemName }}</text>
            <wd-icon name="delete" size="32rpx" color="#ee0a24" @click="handleRemoveItem(index)" />
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text v-if="row.model" class="mr-16rpx">{{ row.model }}</text>
            <text v-if="row.unit" class="mr-16rpx">单位：{{ row.unit }}</text>
            <dict-tag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
          </view>
          <view class="flex items-center justify-between">
            <text class="text-26rpx text-[#999]">领用数量</text>
            <wd-input-number
              v-model="row.applyQuantity"
              :min="1"
              :precision="0"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 用品选择弹窗 -->
    <wd-popup
      v-model="itemPickerVisible"
      position="bottom"
      root-portal
      custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">选择办公用品</text>
          <wd-icon name="close" size="32rpx" color="#999" @click="itemPickerVisible = false" />
        </view>
        <view class="px-24rpx pb-16rpx">
          <wd-search
            v-model="itemQueryParams.name"
            placeholder="搜索物品名称"
            hide-cancel
            @search="handleItemQuery"
            @clear="handleItemQuery"
          />
        </view>
        <z-paging
          ref="itemPagingRef"
          v-model="itemList"
          :fixed="false"
          class="min-h-0 flex-1"
          :default-page-size="10"
          empty-view-text="暂无可领用用品"
          @query="queryItemList"
        >
          <view class="p-24rpx pt-0">
            <view
              v-for="item in itemList"
              :key="item.id"
              class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
              @click="handleItemSelect(item)"
            >
              <view class="min-w-0 flex-1">
                <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                  {{ item.name }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.model || '-' }} · 库存 {{ item.stockQuantity ?? 0 }}{{ item.unit || '' }}
                </view>
              </view>
              <wd-icon v-if="items.some(row => row.itemId === item.id)" name="check" size="32rpx" color="#1677ff" />
            </view>
          </view>
        </z-paging>
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
import type { SupplyApply } from '@/api/oa/supply-apply'
import type { SupplyItem } from '@/api/oa/supply-item'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createSupplyApply, getSupplyApply, updateSupplyApply } from '@/api/oa/supply-apply'
import { getSupplyItemSelectPage } from '@/api/oa/supply-item'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

/** 领用明细行：itemId/applyQuantity 提交给后端，其余字段仅用于展示 */
interface ApplyItemRow {
  itemId: number
  applyQuantity: number
  itemName?: string
  model?: string
  unit?: string
  manageType?: number
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
const getTitle = computed(() => props.id ? '编辑领用申请' : '新增领用申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<SupplyApply>>({
  id: undefined,
  useType: 1,
  pickupMethod: 1,
  reason: '',
  remark: '',
  fileUrls: [],
}) // 表单数据
const applyTime = ref<number | ''>(new Date().setHours(0, 0, 0, 0)) // 领用日期选择器值，默认当天零点
const applyTimeVisible = ref(false) // 领用日期选择器显示状态
const items = ref<ApplyItemRow[]>([]) // 领用明细
const formSchema = createFormSchema({ // 表单校验规则
  useType: [{ required: true, message: '使用类型不能为空' }],
  pickupMethod: [{ required: true, message: '领取方式不能为空' }],
  reason: [{ required: true, message: '申请事由不能为空' }, { max: 500 }],
  remark: [{ max: 500 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

// ==================== 用品选择 ====================
const itemPickerVisible = ref(false) // 用品选择弹窗显示状态
const itemList = ref<SupplyItem[]>([]) // 可领用用品列表
const itemPagingRef = ref<any>() // 用品分页组件引用
const itemQueryParams = ref<Record<string, any>>({}) // 用品查询参数

/** 打开用品选择弹窗 */
function openItemPicker() {
  itemPickerVisible.value = true
  itemPagingRef.value?.reload()
}

/** 查询可领用用品列表 */
async function queryItemList(pageNo: number, pageSize: number) {
  try {
    const data = await getSupplyItemSelectPage({
      ...itemQueryParams.value,
      pageNo,
      pageSize,
    })
    itemPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    itemPagingRef.value?.complete(false)
  }
}

/** 搜索用品 */
function handleItemQuery() {
  itemPagingRef.value?.reload()
}

/** 选择用品：已添加过的用品不重复添加 */
function handleItemSelect(item: SupplyItem) {
  if (items.value.some(row => row.itemId === item.id)) {
    toast.warning('该用品已添加')
    return
  }
  items.value.push({
    itemId: item.id,
    applyQuantity: 1,
    itemName: item.name,
    model: item.model,
    unit: item.unit,
    manageType: item.manageType,
  })
}

/** 移除领用明细行 */
function handleRemoveItem(index: number) {
  items.value.splice(index, 1)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/supply/apply/index')
}

/** 加载领用申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getSupplyApply(Number(props.id))
  formData.value = data
  applyTime.value = data.applyTime ? toTimestamp(data.applyTime) : ''
  items.value = (data.items || []).map(row => ({
    itemId: row.itemId!,
    applyQuantity: row.applyQuantity ?? 1,
    itemName: row.itemName,
    model: row.model,
    unit: row.unit,
    manageType: row.manageType,
  }))
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (applyTime.value === '') {
    toast.warning('请选择领用日期')
    return
  }
  if (items.value.length === 0) {
    toast.warning('请添加领用明细')
    return
  }
  if (items.value.some(row => !row.applyQuantity || row.applyQuantity < 1)) {
    toast.warning('领用数量不能小于 1')
    return
  }

  formLoading.value = true
  try {
    // 领用日期取当天零点时间戳，由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      applyTime: applyTime.value,
      items: items.value.map(row => ({ itemId: row.itemId, applyQuantity: row.applyQuantity })),
    } as unknown as SupplyApply
    if (props.id) {
      await updateSupplyApply(data)
      toast.success('修改成功')
    } else {
      await createSupplyApply(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:supply-apply:reload')
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
