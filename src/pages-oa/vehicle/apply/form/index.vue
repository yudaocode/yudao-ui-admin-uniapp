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
          <wd-form-item title="车辆" title-width="200rpx" prop="vehicleId">
            <view class="flex items-center justify-end gap-12rpx" @click="openVehiclePicker">
              <text class="text-28rpx" :class="selectedVehicleNo ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedVehicleNo || '请选择车辆' }}
              </text>
              <wd-icon name="arrow-right" size="26rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="预计出车时间" title-width="200rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择预计出车时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="预计回车时间" title-width="200rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择预计回车时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="出车地点" title-width="200rpx" prop="startLocation">
            <wd-input
              v-model="formData.startLocation"
              clearable
              :maxlength="255"
              placeholder="请输入出车地点"
            />
          </wd-form-item>
          <wd-form-item title="预计回车地点" title-width="200rpx" prop="endLocation">
            <wd-input
              v-model="formData.endLocation"
              clearable
              :maxlength="255"
              placeholder="请输入预计回车地点"
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
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/vehicle-apply" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="预计出车时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="预计回车时间" />
    </view>

    <!-- 车辆选择弹窗 -->
    <VehiclePicker v-model="vehiclePickerVisible" :selected-id="formData.vehicleId" @select="handleVehicleSelect" />

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
import type { VehicleApply } from '@/api/oa/vehicle/apply'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createVehicleApply, getVehicleApply, updateVehicleApply } from '@/api/oa/vehicle/apply'
import { delay, navigateBackPlus } from '@/utils'
import VehiclePicker from '@/pages-oa/vehicle/list/components/vehicle-picker.vue'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑用车申请' : '新增用车申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<VehicleApply>>({
  id: undefined,
  vehicleId: undefined,
  startLocation: '',
  endLocation: '',
  reason: '',
  passenger: '',
  remark: '',
  fileUrls: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 预计出车时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 预计回车时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 预计出车时间选择器显示状态
const endTimeVisible = ref(false) // 预计回车时间选择器显示状态
const formSchema = createFormSchema({
  vehicleId: [{ required: true, message: '车辆不能为空' }],
  startLocation: [{ required: true, message: '出车地点不能为空' }, { max: 255 }],
  endLocation: [{ required: true, message: '预计回车地点不能为空' }, { max: 255 }],
  reason: [{ required: true, message: '用车事由不能为空' }, { max: 500 }],
  passenger: [{ max: 500 }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用
const vehiclePickerVisible = ref(false) // 车辆选择弹窗显示状态
const selectedVehicleNo = ref('') // 已选车辆车牌号回显

/** 打开车辆选择弹窗 */
function openVehiclePicker() {
  vehiclePickerVisible.value = true
}

/** 选择车辆 */
function handleVehicleSelect(item: { id: number, no: string }) {
  formData.value.vehicleId = item.id
  selectedVehicleNo.value = item.no
  vehiclePickerVisible.value = false
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/vehicle/apply/index')
}

/** 加载用车申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getVehicleApply(Number(props.id))
  formData.value = data
  selectedVehicleNo.value = data.vehicleNo || ''
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择预计出车时间和预计回车时间')
    return
  }
  if (Number(startTime.value) >= Number(endTime.value)) {
    toast.warning('预计出车时间必须早于预计回车时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
    } as unknown as VehicleApply
    if (props.id) {
      await updateVehicleApply(data)
      toast.success('修改成功')
    } else {
      await createVehicleApply(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:vehicle-apply:reload')
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
