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
          <wd-form-item title="分类名" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入分类名"
            />
          </wd-form-item>
          <wd-form-item title="分类标志" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入分类标志"
            />
          </wd-form-item>
          <wd-form-item title="分类描述" title-width="180rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              clearable
              placeholder="请输入分类描述"
            />
          </wd-form-item>
          <wd-form-item title="分类状态" title-width="180rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="分类排序" title-width="180rpx" prop="sort">
            <wd-input
              v-model.number="formData.sort"
              type="number"
              clearable
              placeholder="请输入分类排序"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
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
import type { Category } from '@/api/bpm/category'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createCategory, getCategory, updateCategory } from '@/api/bpm/category'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑流程分类' : '新增流程分类')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Category>({
  id: undefined,
  name: '',
  code: '',
  status: CommonStatusEnum.ENABLE,
  description: '',
  sort: 0,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '分类名不能为空' }],
  code: [{ required: true, message: '分类标志不能为空' }],
  status: [{ required: true, message: '分类状态不能为空' }],
  sort: [{ required: true, message: '分类排序不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/category/index')
}

/** 加载流程分类详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getCategory(props.id)
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
      await updateCategory(formData.value)
      toast.success('修改成功')
    } else {
      await createCategory(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('bpm:category:reload')
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
