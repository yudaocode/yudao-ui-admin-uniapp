<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="假期设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="日期"
            title-width="180rpx"
            prop="day"
            is-link
            :value="formData.day || ''"
            placeholder="请选择日期"
            @click="handleOpenDayPicker"
          />
          <wd-datetime-picker
            v-model="formData.day"
            v-model:visible="dayVisible"
            title="请选择日期"
            type="date"
          />
          <yd-form-picker v-model="formData.type" label="类型" label-width="180rpx" prop="type" :dict-type="DICT_TYPE.MES_CAL_HOLIDAY_TYPE" placeholder="请选择类型" />
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalHoliday } from '@/api/mes/cal/holiday'
import { onMounted, reactive, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getHolidayByDay, saveHoliday } from '@/api/mes/cal/holiday'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesCalHolidayTypeEnum } from '@/utils/constants'
import { formatDate, formatDateOnly, formatDateStartTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ day?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const dayVisible = ref(false) // 日期选择弹层
const formRef = ref<FormInstance>() // 表单组件引用
const formData = reactive<CalHoliday>({
  id: undefined,
  day: formatDate(Date.now()),
  type: MesCalHolidayTypeEnum.WORKDAY,
}) // 表单数据
const formSchema = createFormSchema({
  day: [{ required: true, message: '日期不能为空' }],
  type: [{ required: true, message: '类型不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/holiday/index')
}

/** 打开日期选择 */
function handleOpenDayPicker() {
  if (props.day) {
    return
  }
  dayVisible.value = true
}

/** 加载详情 */
async function getDetail() {
  if (props.day) {
    formData.day = formatDateOnly(props.day)
  }
  formLoading.value = true
  try {
    const day = formData.day
    Object.assign(formData, await getHolidayByDay(formatDateStartTime(day)), { day })
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    await saveHoliday({
      ...formData,
      day: formatDateStartTime(formData.day),
    })
    toast.success('设置成功')
    uni.$emit('mes:cal:holiday:reload')
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
