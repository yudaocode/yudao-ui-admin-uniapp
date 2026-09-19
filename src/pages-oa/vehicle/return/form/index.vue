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
          <wd-form-item title="用车申请" title-width="200rpx" prop="applyId">
            <view class="flex items-center justify-end gap-12rpx" @click="openApplyPicker">
              <text class="text-28rpx" :class="selectedApplyLabel ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedApplyLabel || '请选择用车申请' }}
              </text>
              <wd-icon name="arrow-right" size="26rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="实际出车时间" title-width="200rpx" prop="actualStartTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="actualStartTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ actualStartTime === '' ? '请选择实际出车时间' : formatDateTime(actualStartTime) }}
              </text>
              <text v-if="actualStartTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="actualStartTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="实际出车地点" title-width="200rpx" prop="startLocation">
            <wd-input
              v-model="formData.startLocation"
              clearable
              :maxlength="255"
              placeholder="请输入实际出车地点"
            />
          </wd-form-item>
          <wd-form-item title="用车事由" title-width="200rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入用车事由"
            />
          </wd-form-item>
          <wd-form-item title="随行人" title-width="200rpx" prop="passenger">
            <wd-input
              v-model="formData.passenger"
              clearable
              :maxlength="500"
              placeholder="请输入随行人"
            />
          </wd-form-item>
          <wd-form-item title="实际回车时间" title-width="200rpx" prop="actualReturnTime">
            <view class="flex items-center justify-end gap-12rpx" @click="returnTimeVisible = true">
              <text class="text-28rpx" :class="actualReturnTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ actualReturnTime === '' ? '请选择实际回车时间' : formatDateTime(actualReturnTime) }}
              </text>
              <text v-if="actualReturnTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="actualReturnTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="回车地点" title-width="200rpx" prop="returnLocation">
            <wd-input
              v-model="formData.returnLocation"
              clearable
              :maxlength="255"
              placeholder="请输入回车地点"
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
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/vehicle-return" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="actualStartTime" v-model:visible="startTimeVisible" type="datetime" title="实际出车时间" />
      <wd-datetime-picker v-model="actualReturnTime" v-model:visible="returnTimeVisible" type="datetime" title="实际回车时间" />
    </view>

    <!-- 用车申请选择弹窗：仅本人审批通过且待还车的申请 -->
    <wd-popup
      v-model="applyPickerVisible"
      position="bottom"
      root-portal
      custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">选择用车申请</text>
          <wd-icon name="close" size="32rpx" color="#999" @click="applyPickerVisible = false" />
        </view>
        <view class="px-24rpx pb-12rpx">
          <wd-search
            v-model="applyKeyword"
            placeholder="请输入车牌号搜索"
            hide-cancel
            @search="handleApplySearch"
            @clear="handleApplySearch"
          />
        </view>
        <z-paging
          ref="applyPagingRef"
          v-model="applyList"
          :fixed="false"
          class="min-h-0 flex-1"
          :default-page-size="10"
          empty-view-text="暂无待还车的用车申请"
          @query="queryApplyList"
        >
          <view class="p-24rpx">
            <view
              v-for="item in applyList"
              :key="item.id"
              class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
              @click="handleApplySelect(item)"
            >
              <view>
                <view class="text-30rpx text-[#333] font-semibold">
                  {{ item.no || `用车申请 #${item.id}` }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.vehicleNo }} · {{ formatDateTime(item.startTime) || '-' }}
                </view>
              </view>
              <wd-icon v-if="item.id === formData.applyId" name="check" size="32rpx" color="#1677ff" />
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
import type { VehicleApply } from '@/api/oa/vehicle-apply'
import type { VehicleReturn } from '@/api/oa/vehicle-return'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getVehicleApply, getVehicleApplyPage } from '@/api/oa/vehicle-apply'
import { createVehicleReturn, getVehicleReturn, updateVehicleReturn } from '@/api/oa/vehicle-return'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_VEHICLE_RETURN_STATUS } from '../../../utils/constants'

const props = defineProps<{
  id?: string
  applyId?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑还车申请' : '新增还车申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<VehicleReturn>>({
  id: undefined,
  applyId: undefined,
  startLocation: '',
  reason: '',
  passenger: '',
  returnLocation: '',
  remark: '',
  fileUrls: [],
}) // 表单数据
const actualStartTime = ref<number | ''>('') // 实际出车时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 实际出车时间选择器显示状态
const actualReturnTime = ref<number | ''>('') // 实际回车时间选择器值，空字符串承接未选择
const returnTimeVisible = ref(false) // 实际回车时间选择器显示状态
const formSchema = createFormSchema({ // 表单校验规则
  applyId: [{ required: true, message: '用车申请不能为空' }],
  startLocation: [{ required: true, message: '实际出车地点不能为空' }, { max: 255 }],
  reason: [{ required: true, message: '用车事由不能为空' }, { max: 500 }],
  passenger: [{ max: 500 }],
  returnLocation: [{ required: true, message: '实际回车地点不能为空' }, { max: 255 }],
  remark: [{ max: 500 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

// ==================== 用车申请选择 ====================
const applyPickerVisible = ref(false) // 用车申请选择弹窗显示状态
const applyList = ref<VehicleApply[]>([]) // 待还车的用车申请列表
const applyPagingRef = ref<any>() // 用车申请分页组件引用
const selectedApplyLabel = ref('') // 已选用车申请回显
const applyKeyword = ref('') // 用车申请选择弹窗车牌号搜索

/** 打开用车申请选择弹窗 */
function openApplyPicker() {
  applyPickerVisible.value = true
  applyPagingRef.value?.reload()
}

/** 搜索用车申请 */
function handleApplySearch() {
  applyPagingRef.value?.reload()
}

/** 查询待还车的用车申请：审批通过且还车状态为待还车 */
async function queryApplyList(pageNo: number, pageSize: number) {
  try {
    const data = await getVehicleApplyPage({
      status: 2,
      returnStatus: OA_VEHICLE_RETURN_STATUS.PENDING_RETURN,
      vehicleNo: applyKeyword.value || undefined,
      pageNo,
      pageSize,
    })
    applyPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    applyPagingRef.value?.complete(false)
  }
}

/** 选择用车申请：带入计划出车信息，还车人可按实际行程修改 */
function handleApplySelect(item: VehicleApply) {
  formData.value.applyId = item.id
  selectedApplyLabel.value = `${item.no || `用车申请 #${item.id}`}（${item.vehicleNo || '-'}）`
  actualStartTime.value = item.startTime ? toTimestamp(item.startTime) : ''
  formData.value.startLocation = item.startLocation || ''
  formData.value.reason = item.reason || ''
  formData.value.passenger = item.passenger || ''
  applyPickerVisible.value = false
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/vehicle/return/index')
}

/** 加载还车申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getVehicleReturn(Number(props.id))
  formData.value = data
  selectedApplyLabel.value = `${data.applyNo || `用车申请 #${data.applyId}`}（${data.vehicleNo || '-'}）`
  actualStartTime.value = data.actualStartTime ? toTimestamp(data.actualStartTime) : ''
  actualReturnTime.value = data.actualReturnTime ? toTimestamp(data.actualReturnTime) : ''
}

/** 从用车申请详情跳入时，带出并回显用车申请 */
async function initFromApply() {
  if (props.id || !props.applyId) {
    return
  }
  const apply = await getVehicleApply(Number(props.applyId))
  formData.value.applyId = apply.id
  selectedApplyLabel.value = `${apply.no || `用车申请 #${apply.id}`}（${apply.vehicleNo || '-'}）`
  actualStartTime.value = apply.startTime ? toTimestamp(apply.startTime) : ''
  formData.value.startLocation = apply.startLocation || ''
  formData.value.reason = apply.reason || ''
  formData.value.passenger = apply.passenger || ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (actualStartTime.value === '') {
    toast.warning('请选择实际出车时间')
    return
  }
  if (actualReturnTime.value === '') {
    toast.warning('请选择实际回车时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      actualStartTime: actualStartTime.value,
      actualReturnTime: actualReturnTime.value,
    } as unknown as VehicleReturn
    if (props.id) {
      await updateVehicleReturn(data)
      toast.success('修改成功')
    } else {
      await createVehicleReturn(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:vehicle-return:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  initFromApply()
})
</script>
