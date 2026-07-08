<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="路线编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="路线名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入路线名称" clearable />
          </wd-form-item>
          <wd-form-item title="路线说明" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入工艺路线说明" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <RouteProcessList
        v-if="formData.id"
        :route-id="formData.id"
        :editable="isDisabled"
      />
      <RouteProductList
        v-if="formData.id"
        :route-id="formData.id"
        :editable="isDisabled"
      />
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
import type { ProRoute } from '@/api/mes/pro/route'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createRoute, getRoute, updateRoute } from '@/api/mes/pro/route'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, MesAutoCodeRuleCode } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import RouteProcessList from '../components/route-process-list.vue'
import RouteProductList from '../components/route-product-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑工艺路线' : '新增工艺路线')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<ProRoute>({
  code: '',
  name: '',
  description: '',
  remark: '',
}) // 表单数据
const isDisabled = computed(() => formData.value.status === CommonStatusEnum.DISABLE)
const formSchema = createFormSchema({
  code: [{ required: true, message: '工艺路线编码不能为空' }],
  name: [{ required: true, message: '工艺路线名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/route/index')
}

/** 加载工艺路线详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getRoute(Number(props.id))
}

/** 生成工艺路线编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_ROUTE_CODE)
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
      await updateRoute(formData.value)
      toast.success('修改成功')
    } else {
      const id = await createRoute(formData.value)
      toast.success('新增成功')
      uni.$emit('mes:pro:route:reload')
      uni.redirectTo({ url: `/pages-mes/pro/route/form/index?id=${id}` })
      return
    }
    uni.$emit('mes:pro:route:reload')
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
