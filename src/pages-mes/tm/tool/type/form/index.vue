<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="类型编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="类型名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入类型名称" clearable />
          </wd-form-item>
          <wd-cell title="编码管理" center>
            <view class="flex justify-end">
              <wd-switch v-model="formData.codeFlag" />
            </view>
          </wd-cell>
          <yd-form-picker v-if="formData.codeFlag" v-model="formData.maintenType" label="保养维护类型" label-width="220rpx" prop="maintenType" :dict-type="DICT_TYPE.MES_TM_MAINTEN_TYPE" placeholder="请选择保养维护类型" />
          <wd-form-item v-if="showMaintenPeriod" :title="maintenPeriodTitle" title-width="220rpx" prop="maintenPeriod" center>
            <wd-input-number v-model="formData.maintenPeriod" allow-null :min="1" :precision="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
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
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createToolType, getToolType, updateToolType } from '@/api/mes/tm/tool/type'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesMaintenTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑工具类型' : '新增工具类型')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<TmToolType>({
  id: undefined,
  code: '',
  name: '',
  codeFlag: true,
  maintenType: undefined,
  maintenPeriod: undefined,
  remark: '',
}) // 表单数据
const showMaintenPeriod = computed(() => formData.value.codeFlag && formData.value.maintenType != null)
const maintenPeriodTitle = computed(() => formData.value.maintenType === MesMaintenTypeEnum.USAGE ? '保养周期(次)' : '保养周期(天)')
const formSchema = createFormSchema({
  code: [{ required: true, message: '类型编码不能为空' }],
  name: [{ required: true, message: '类型名称不能为空' }],
  codeFlag: [{ required: true, message: '编码管理不能为空' }],
  maintenType: [{ required: () => !!formData.value.codeFlag, message: '保养维护类型不能为空' }],
  maintenPeriod: [{ required: () => showMaintenPeriod.value, message: '保养周期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/tm/tool/type/index')
}

/** 加载工具类型详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getToolType(Number(props.id))
}

/** 生成工具类型编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.TM_TOOL_TYPE_CODE)
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
    if (!formData.value.codeFlag) {
      formData.value.maintenType = undefined
      formData.value.maintenPeriod = undefined
    } else if (!showMaintenPeriod.value) {
      formData.value.maintenPeriod = undefined
    }
    if (props.id) {
      await updateToolType(formData.value)
      toast.success('修改成功')
    } else {
      await createToolType(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:tm:tool-type:reload')
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
