<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="基本信息" />
        <wd-tab title="检测指标项" />
        <wd-tab title="产品关联" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <scroll-view v-if="tabType === 'basic'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="方案编号" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="方案名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入方案名称" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.types" label="检测种类" label-width="220rpx" prop="types" :dict-type="DICT_TYPE.MES_QC_TYPE" type="checkbox" placeholder="请选择检测种类" />
          <yd-form-picker v-model="formData.status" label="状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" placeholder="请选择状态" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 检测指标项 -->
    <scroll-view v-if="tabType === 'indicators'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <TemplateIndicatorList v-if="formData.id" :template-id="formData.id" :show-title="false" />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-20rpx text-24rpx text-[#389e0d]">
        请先保存质检方案主表；保存后可维护检测指标项。
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 产品关联 -->
    <scroll-view v-if="tabType === 'items'" class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <TemplateItemList v-if="formData.id" :template-id="formData.id" :show-title="false" />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-20rpx text-24rpx text-[#389e0d]">
        请先保存质检方案主表；保存后可维护产品关联。
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="tabType === 'basic'" class="yd-detail-footer">
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
import type { QcTemplate } from '@/api/mes/qc/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createTemplate, getTemplate, updateTemplate } from '@/api/mes/qc/template'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import TemplateIndicatorList from '../components/template-indicator-list.vue'
import TemplateItemList from '../components/template-item-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑质检方案' : '新增质检方案')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const tabTypes = ['basic', 'indicators', 'items'] // tab 配置
const tabIndex = ref(0) // 当前 tab 索引
const tabType = computed(() => tabTypes[tabIndex.value]) // 当前 tab 类型
const formData = ref<QcTemplate>({
  code: '',
  name: '',
  types: [],
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '方案编号不能为空' }],
  name: [{ required: true, message: '方案名称不能为空' }],
  types: [{ required: true, message: '检测种类不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/template/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getTemplate(Number(props.id))
}

/** 生成方案编号 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_TEMPLATE_CODE)
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
      await updateTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:template:reload')
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
