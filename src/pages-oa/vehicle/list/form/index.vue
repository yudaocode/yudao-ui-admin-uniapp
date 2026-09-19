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
          <DeptFormPicker v-model="formData.deptId" label="所属部门" label-width="220rpx" prop="deptId" placeholder="请选择所属部门" />
          <wd-form-item title="车牌号" title-width="220rpx" prop="no">
            <wd-input
              v-model="formData.no"
              clearable
              :maxlength="32"
              placeholder="请输入车牌号"
            />
          </wd-form-item>
          <wd-form-item title="车辆名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :maxlength="128"
              placeholder="请输入车辆名称"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="220rpx"
            prop="status"
            :dict-type="DICT_TYPE.OA_VEHICLE_STATUS"
            placeholder="请选择状态"
          />
          <wd-form-item title="车型" title-width="220rpx" prop="type">
            <wd-input
              v-model="formData.type"
              clearable
              :maxlength="64"
              placeholder="请输入车型"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.category"
            label="车辆分类"
            label-width="220rpx"
            prop="category"
            :dict-type="DICT_TYPE.OA_VEHICLE_CATEGORY"
            dict-kind="str"
            placeholder="请选择车辆分类"
          />
          <wd-form-item title="品牌型号" title-width="220rpx" prop="brandModel">
            <wd-input
              v-model="formData.brandModel"
              clearable
              :maxlength="128"
              placeholder="请输入品牌型号"
            />
          </wd-form-item>
          <wd-form-item title="座位数" title-width="220rpx" prop="seatCount">
            <wd-input
              v-model="formData.seatCount"
              type="number"
              clearable
              placeholder="请输入座位数"
            />
          </wd-form-item>
          <wd-form-item title="裸车价格（元）" title-width="220rpx" prop="barePrice">
            <wd-input
              v-model="formData.barePrice"
              type="digit"
              clearable
              placeholder="请输入裸车价格"
            />
          </wd-form-item>
          <wd-form-item title="交强险到期" title-width="220rpx" prop="compulsoryInsuranceExpireTime">
            <view class="flex items-center justify-end gap-12rpx" @click="compulsoryVisible = true">
              <text class="text-28rpx" :class="compulsoryTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ compulsoryTime === '' ? '请选择交强险到期时间' : formatDate(compulsoryTime) }}
              </text>
              <text v-if="compulsoryTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="compulsoryTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="商业险到期" title-width="220rpx" prop="commercialInsuranceExpireTime">
            <view class="flex items-center justify-end gap-12rpx" @click="commercialVisible = true">
              <text class="text-28rpx" :class="commercialTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ commercialTime === '' ? '请选择商业险到期时间' : formatDate(commercialTime) }}
              </text>
              <text v-if="commercialTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="commercialTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="年检到期" title-width="220rpx" prop="inspectionExpireTime">
            <view class="flex items-center justify-end gap-12rpx" @click="inspectionVisible = true">
              <text class="text-28rpx" :class="inspectionTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ inspectionTime === '' ? '请选择年检到期时间' : formatDate(inspectionTime) }}
              </text>
              <text v-if="inspectionTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="inspectionTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="车辆照片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" directory="oa/vehicle" />
          </wd-form-item>
          <wd-form-item title="显示顺序" title-width="220rpx" prop="sort">
            <wd-input
              v-model="formData.sort"
              type="number"
              clearable
              placeholder="请输入显示顺序"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="compulsoryTime" v-model:visible="compulsoryVisible" type="date" title="交强险到期时间" />
      <wd-datetime-picker v-model="commercialTime" v-model:visible="commercialVisible" type="date" title="商业险到期时间" />
      <wd-datetime-picker v-model="inspectionTime" v-model:visible="inspectionVisible" type="date" title="年检到期时间" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Vehicle } from '@/api/oa/vehicle'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createVehicle, getVehicle, updateVehicle } from '@/api/oa/vehicle'
import { DeptFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, toTimestamp } from '@/utils/date'
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
const getTitle = computed(() => props.id ? '编辑车辆' : '新增车辆')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Vehicle>>({
  id: undefined,
  no: '',
  name: '',
  deptId: undefined,
  type: '',
  category: undefined,
  brandModel: '',
  seatCount: undefined,
  barePrice: undefined,
  picUrl: '',
  sort: 0,
  status: 0,
  remark: '',
}) // 表单数据
const compulsoryTime = ref<number | ''>('') // 交强险到期时间选择器值，空字符串承接未选择
const commercialTime = ref<number | ''>('') // 商业险到期时间选择器值，空字符串承接未选择
const inspectionTime = ref<number | ''>('') // 年检到期时间选择器值，空字符串承接未选择
const compulsoryVisible = ref(false) // 交强险到期时间选择器显示状态
const commercialVisible = ref(false) // 商业险到期时间选择器显示状态
const inspectionVisible = ref(false) // 年检到期时间选择器显示状态
const formSchema = createFormSchema({
  no: [{ required: true, message: '车牌号不能为空' }, { max: 32 }],
  name: [{ required: true, message: '车辆名称不能为空' }, { max: 128 }],
  type: [{ required: true, message: '车型不能为空' }, { max: 64 }],
  brandModel: [{ max: 128 }],
  seatCount: [{ required: true, message: '座位数不能为空' }],
  barePrice: [{ required: true, message: '裸车价格不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/vehicle/list/index')
}

/** 加载车辆详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getVehicle(Number(props.id))
  formData.value = data
  compulsoryTime.value = data.compulsoryInsuranceExpireTime ? toTimestamp(data.compulsoryInsuranceExpireTime) : ''
  commercialTime.value = data.commercialInsuranceExpireTime ? toTimestamp(data.commercialInsuranceExpireTime) : ''
  inspectionTime.value = data.inspectionExpireTime ? toTimestamp(data.inspectionExpireTime) : ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    // 到期时间取当天零点时间戳，由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      seatCount: formData.value.seatCount !== undefined ? Number(formData.value.seatCount) : undefined,
      barePrice: formData.value.barePrice !== undefined ? Number(formData.value.barePrice) : undefined,
      sort: formData.value.sort !== undefined ? Number(formData.value.sort) : undefined,
      compulsoryInsuranceExpireTime: compulsoryTime.value === '' ? undefined : compulsoryTime.value,
      commercialInsuranceExpireTime: commercialTime.value === '' ? undefined : commercialTime.value,
      inspectionExpireTime: inspectionTime.value === '' ? undefined : inspectionTime.value,
    } as unknown as Vehicle
    if (props.id) {
      await updateVehicle(data)
      toast.success('修改成功')
    } else {
      await createVehicle(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:vehicle:reload')
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
