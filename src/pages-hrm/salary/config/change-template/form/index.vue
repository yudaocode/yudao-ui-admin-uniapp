<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="模板名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入模板名称"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="默认模板" title-width="180rpx" prop="defaultStatus" center>
            <wd-switch v-model="formData.defaultStatus" />
          </wd-form-item>
          <yd-form-picker
            v-model="selectedCodes"
            label="调薪项"
            label-width="180rpx"
            prop="options"
            type="checkbox"
            filterable
            clearable
            :columns="optionColumns"
            placeholder="请选择调薪项"
            @confirm="syncOptionsFromCodes"
            @clear="syncOptionsFromCodes"
          />
        </wd-cell-group>
      </wd-form>

      <!-- 已选调薪项预览 -->
      <view v-if="formData.options.length" class="mx-24rpx mt-24rpx">
        <view class="mb-16rpx text-28rpx text-[#999]">
          已选 {{ formData.options.length }} 项
        </view>
        <view class="flex flex-wrap gap-12rpx">
          <view
            v-for="option in formData.options"
            :key="option.code"
            class="rounded-6rpx bg-[#e6f4ff] px-12rpx py-4rpx text-22rpx text-[#1677ff]"
          >
            {{ option.name }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SalaryOption } from '@/api/hrm/salary/config/option'
import type { SalaryChangeTemplate } from '@/api/hrm/salary/config/change-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createSalaryChangeTemplate,
  getSalaryChangeTemplate,
  updateSalaryChangeTemplate,
} from '@/api/hrm/salary/config/change-template'
import { getSalaryOptionSimpleList } from '@/api/hrm/salary/config/option'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑调薪模板' : '新增调薪模板')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const optionList = ref<SalaryOption[]>([]) // 可调薪项列表
const selectedCodes = ref<number[]>([]) // 已选调薪项编码
const formData = ref<SalaryChangeTemplate>(createDefaultFormData()) // 表单数据

const optionColumns = computed(() => { // 调薪项选择列
  return optionList.value.map(item => ({
    label: `${item.name} / ${item.code}`,
    value: item.code,
  }))
})

const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(): SalaryChangeTemplate {
  return {
    name: '',
    defaultStatus: false,
    options: [],
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/salary/config/change-template/index')
}

/** 按编码同步调薪项 */
function syncOptionsFromCodes() {
  const codeSet = new Set(selectedCodes.value)
  formData.value.options = selectedCodes.value.map((code) => {
    const option = optionList.value.find(item => item.code === code)
    const selected = formData.value.options.find(item => item.code === code)
    return {
      code,
      name: option?.name || selected?.name || '',
    }
  }).filter(item => codeSet.has(item.code))
}

/** 加载可调薪项 */
async function loadOptions(selectAll: boolean) {
  optionList.value = await getSalaryOptionSimpleList(true)
  if (selectAll) {
    selectedCodes.value = optionList.value.map(item => item.code)
    syncOptionsFromCodes()
  }
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时默认勾选全部可调薪项，对齐 PC
    await loadOptions(true)
    return
  }
  const [detail] = await Promise.all([
    getSalaryChangeTemplate(Number(props.id)),
    loadOptions(false),
  ])
  formData.value = detail
  selectedCodes.value = (detail.options || []).map(item => item.code)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  syncOptionsFromCodes()

  formLoading.value = true
  try {
    if (props.id) {
      await updateSalaryChangeTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createSalaryChangeTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:salary:change-template:reload')
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
