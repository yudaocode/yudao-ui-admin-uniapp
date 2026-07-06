<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑代码生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="tableForm" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="表名称" title-width="200rpx">
            <wd-input v-model="tableForm.tableName" readonly placeholder="表名称" />
          </wd-form-item>
          <wd-form-item title="表描述" title-width="200rpx" prop="tableComment">
            <wd-input v-model="tableForm.tableComment" clearable placeholder="请输入表描述" />
          </wd-form-item>
          <wd-form-item title="实体类名" title-width="200rpx" prop="className">
            <wd-input v-model="tableForm.className" clearable placeholder="请输入实体类名" />
          </wd-form-item>
          <wd-form-item title="类描述" title-width="200rpx" prop="classComment">
            <wd-input v-model="tableForm.classComment" clearable placeholder="请输入类描述" />
          </wd-form-item>
          <wd-form-item title="模块名" title-width="200rpx" prop="moduleName">
            <wd-input v-model="tableForm.moduleName" clearable placeholder="请输入模块名" />
          </wd-form-item>
          <wd-form-item title="业务名" title-width="200rpx" prop="businessName">
            <wd-input v-model="tableForm.businessName" clearable placeholder="请输入业务名" />
          </wd-form-item>
          <wd-form-item title="作者" title-width="200rpx" prop="author">
            <wd-input v-model="tableForm.author" clearable placeholder="请输入作者" />
          </wd-form-item>
          <!-- 模板类型 / 生成场景：依赖上级菜单、主子/树表关联等 PC 端配置，移动端仅展示 -->
          <wd-form-item title="模板类型" title-width="200rpx">
            <dict-tag :type="DICT_TYPE.INFRA_CODEGEN_TEMPLATE_TYPE" :value="tableForm.templateType" />
          </wd-form-item>
          <wd-form-item title="生成场景" title-width="200rpx">
            <dict-tag :type="DICT_TYPE.INFRA_CODEGEN_SCENE" :value="tableForm.scene" />
          </wd-form-item>
          <yd-form-picker
            v-model="tableForm.frontType"
            label="前端类型" prop="frontType"
            :dict-type="DICT_TYPE.INFRA_CODEGEN_FRONT_TYPE"
          />
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea v-model="tableForm.remark" clearable placeholder="请输入备注" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="px-24rpx pt-16rpx text-24rpx text-[#999]">
        提示：上级菜单、主子表/树表关联等生成配置需在 PC 端设置。
      </view>
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
import type { CodegenColumn } from '@/api/infra/codegen'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getCodegenDetail, updateCodegenTable } from '@/api/infra/codegen'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formLoading = ref(false) // 表单提交状态
const tableForm = ref<Record<string, any>>({}) // 表定义（保留全部字段回传）
const columns = ref<CodegenColumn[]>([]) // 字段定义（原样回传）
const formSchema = createFormSchema({
  tableComment: [{ required: true, message: '表描述不能为空' }],
  className: [{ required: true, message: '实体类名不能为空' }],
  classComment: [{ required: true, message: '类描述不能为空' }],
  moduleName: [{ required: true, message: '模块名不能为空' }],
  businessName: [{ required: true, message: '业务名不能为空' }],
  author: [{ required: true, message: '作者不能为空' }],
  frontType: [{ required: true, message: '前端类型不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/codegen/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getCodegenDetail(props.id)
  tableForm.value = data.table as Record<string, any>
  columns.value = data.columns || []
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    await updateCodegenTable({ table: tableForm.value as any, columns: columns.value })
    toast.success('保存成功')
    uni.$emit('infra:codegen:reload')
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
