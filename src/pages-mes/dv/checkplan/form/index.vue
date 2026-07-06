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
          <wd-form-item title="方案编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入或点击生成"
            >
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="方案名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入方案名称"
            />
          </wd-form-item>
          <yd-form-picker v-model="formData.type" label="方案类型" label-width="200rpx" prop="type" :dict-type="DICT_TYPE.MES_DV_SUBJECT_TYPE" placeholder="请选择方案类型" />
          <wd-datetime-picker
            v-model="formData.startDate"
            type="date"
            label="开始日期"
            label-width="200rpx"
            prop="startDate"
          />
          <wd-datetime-picker
            v-model="formData.endDate"
            type="date"
            label="结束日期"
            label-width="200rpx"
            prop="endDate"
          />
          <yd-form-picker v-model="formData.cycleType" label="周期类型" label-width="200rpx" prop="cycleType" :dict-type="DICT_TYPE.MES_DV_CYCLE_TYPE" placeholder="请选择周期类型" />
          <wd-form-item title="周期数量" title-width="200rpx" prop="cycleCount" center>
            <wd-input-number v-model="formData.cycleCount" :min="1" :precision="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status">
            <dict-tag :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="formData.status" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
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
      <view v-if="props.id" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-18rpx text-26rpx text-[#0958d9]">
        草稿方案可维护关联设备和保养项目；保存关联会立即写入，请谨慎操作。
      </view>
      <MachineryList v-if="props.id" :plan-id="Number(props.id)" />
      <SubjectList v-if="props.id" :plan-id="Number(props.id)" :type="formData.type" />
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
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createCheckPlan, getCheckPlan, updateCheckPlan } from '@/api/mes/dv/checkplan'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesDvCheckPlanStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MachineryList from '../components/machinery-list.vue'
import SubjectList from '../components/subject-list.vue'

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
const getTitle = computed(() => props.id ? '编辑点检方案' : '新增点检方案')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<DvCheckPlan>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '方案编码不能为空' }],
  name: [{ required: true, message: '方案名称不能为空' }],
  type: [{ required: true, message: '方案类型不能为空' }],
  cycleType: [{ required: true, message: '周期类型不能为空' }],
  cycleCount: [{ required: true, message: '周期数量不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 默认表单数据 */
function getDefaultFormData(): DvCheckPlan {
  return {
    code: '',
    name: '',
    type: undefined,
    startDate: '',
    endDate: '',
    cycleType: undefined,
    cycleCount: 1,
    status: MesDvCheckPlanStatusEnum.PREPARE,
    remark: '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/checkplan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getCheckPlan(Number(props.id))
}

/** 初始化页面数据 */
async function initPage() {
  if (!props.id) {
    formData.value = getDefaultFormData()
    return
  }
  if (!formData.value.id || formData.value.id !== Number(props.id)) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 生成方案编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_CHECK_PLAN_CODE)
    toast.success('生成成功')
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
    if (props.id) {
      await updateCheckPlan(formData.value)
      toast.success('修改成功')
    } else {
      await createCheckPlan(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:checkplan:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})
</script>
