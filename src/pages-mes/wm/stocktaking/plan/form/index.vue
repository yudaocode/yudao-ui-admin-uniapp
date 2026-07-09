<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="方案编码" title-width="220rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                placeholder="请输入方案编码"
              />
              <wd-button size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="方案名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入方案名称" />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="盘点类型" label-width="220rpx" prop="type" :columns="stockTakingTypeOptions" placeholder="请选择盘点类型" />
          <wd-form-item
            v-if="isDynamicType"
            title="开始时间"
            title-width="220rpx"
            prop="startTime"
            is-link
            placeholder="请选择开始时间"
            :value="formatDateTime(formData.startTime)"
            @click="pickerVisible.startTime = true"
          />
          <wd-datetime-picker
            v-model="formData.startTime"
            v-model:visible="pickerVisible.startTime"
            title="请选择开始时间"
            type="datetime"
          />
          <wd-form-item
            v-if="isDynamicType"
            title="结束时间"
            title-width="220rpx"
            prop="endTime"
            is-link
            placeholder="请选择结束时间"
            :value="formatDateTime(formData.endTime)"
            @click="pickerVisible.endTime = true"
          />
          <wd-datetime-picker
            v-model="formData.endTime"
            v-model:visible="pickerVisible.endTime"
            title="请选择结束时间"
            type="datetime"
          />
          <wd-form-item title="是否盲盘" title-width="220rpx" prop="blindFlag" center>
            <wd-switch v-model="formData.blindFlag" />
          </wd-form-item>
          <wd-form-item title="冻结库存" title-width="220rpx" prop="frozen" center>
            <wd-switch v-model="formData.frozen" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="状态" title-width="220rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view v-if="currentId" class="px-24rpx">
        <PlanParamList :plan-id="currentId" :readonly="!canMaintainParams" />
      </view>
      <view class="h-180rpx" />
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
import type { StockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createStockTakingPlan, getStockTakingPlan, updateStockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode, MesWmStockTakingTypeEnum } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import PlanParamList from '../components/plan-param-list.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const routeId = computed(() => props.id ? Number(props.id) : undefined) // 路由编号
const currentId = ref<number>() // 当前编辑编号
const getTitle = computed(() => currentId.value ? '编辑盘点方案' : '新增盘点方案')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<StockTakingPlan>(getDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const stockTakingTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE))
const isDynamicType = computed(() => formData.value.type === MesWmStockTakingTypeEnum.DYNAMIC)
const canMaintainParams = computed(() => {
  return currentId.value !== undefined && formData.value.status === CommonStatusEnum.DISABLE
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '方案编码不能为空' }],
  name: [{ required: true, message: '方案名称不能为空' }],
  type: [{ required: true, message: '盘点类型不能为空' }],
  startTime: [{ required: () => isDynamicType.value, message: '开始时间不能为空' }],
  endTime: [
    { required: () => isDynamicType.value, message: '结束时间不能为空' },
    {
      validator: () => {
        if (!isDynamicType.value || !formData.value.startTime || !formData.value.endTime) {
          return true
        }
        return toTimestamp(formData.value.endTime) > toTimestamp(formData.value.startTime)
          || '结束时间必须晚于开始时间'
      },
    },
  ],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingPlan {
  return {
    blindFlag: false,
    frozen: false,
    status: CommonStatusEnum.DISABLE,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/stocktaking/plan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getStockTakingPlan(currentId.value)
}

/** 生成方案编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_STOCK_TAKING_PLAN_CODE)
  } finally {
    codeLoading.value = false
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
    if (!isDynamicType.value) {
      formData.value.startTime = undefined
      formData.value.endTime = undefined
    }
    if (currentId.value) {
      await updateStockTakingPlan(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createStockTakingPlan(formData.value)
      currentId.value = id
      formData.value.id = id
      formData.value.status = CommonStatusEnum.DISABLE
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:stocktaking:plan:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  currentId.value = routeId.value
  await getDetail()
})
</script>
