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
          <yd-form-picker v-model="formData.format" label="条码格式" label-width="220rpx" prop="format" :dict-type="DICT_TYPE.MES_WM_BARCODE_FORMAT" placeholder="请选择条码格式" />
          <yd-form-picker v-model="formData.bizType" label="业务类型" label-width="220rpx" prop="bizType" :disabled="!!props.id" :dict-type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" placeholder="请选择业务类型" />
          <wd-form-item title="内容格式模板" title-width="220rpx" prop="contentFormat">
            <wd-input
              v-model="formData.contentFormat"
              placeholder="支持 {BUSINESSCODE} 占位符，如 WH-{BUSINESSCODE}"
              :maxlength="100"
              clearable
            />
          </wd-form-item>
          <wd-form-item title="内容样例" title-width="220rpx" prop="contentExample">
            <wd-input
              v-model="formData.contentExample"
              placeholder="如 WH-WH001"
              :maxlength="100"
              clearable
            />
          </wd-form-item>
          <wd-form-item title="自动生成" title-width="220rpx" prop="autoGenerateFlag" center>
            <wd-switch v-model="formData.autoGenerateFlag" />
          </wd-form-item>
          <wd-form-item title="默认打印模板" title-width="220rpx" prop="defaultTemplate">
            <wd-input
              v-model="formData.defaultTemplate"
              readonly
              placeholder="报表/打印专项维护"
            />
          </wd-form-item>
          <view class="px-24rpx pb-20rpx text-24rpx text-[#999] leading-36rpx">
            默认打印模板暂不在移动端选择；正式打印和模板维护归入报表/打印专项。
          </view>
          <yd-form-picker v-model="formData.status" label="状态" label-width="220rpx" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" placeholder="请选择状态" />
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import type { WmBarcodeConfig } from '@/api/mes/wm/barcode/config'
import { createBarcodeConfig, getBarcodeConfig, updateBarcodeConfig } from '@/api/mes/wm/barcode/config'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑条码配置' : '新增条码配置')
const formLoading = ref(false) // 表单提交状态
const formData = ref<WmBarcodeConfig>({
  id: undefined,
  format: undefined,
  bizType: undefined,
  contentFormat: '',
  contentExample: '',
  autoGenerateFlag: true,
  defaultTemplate: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  format: [{ required: true, message: '条码格式不能为空' }],
  bizType: [{ required: true, message: '业务类型不能为空' }],
  contentFormat: [
    { required: true, message: '内容格式模板不能为空' },
    { max: 100, message: '内容格式模板长度不能超过 100 个字符' },
  ],
  contentExample: [{ max: 100, message: '内容样例长度不能超过 100 个字符' }],
  autoGenerateFlag: [{ required: true, message: '是否自动生成不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  remark: [{ max: 200, message: '备注长度不能超过 200 个字符' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/config/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getBarcodeConfig(Number(props.id))
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
      await updateBarcodeConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createBarcodeConfig(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:barcode:config:reload')
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
