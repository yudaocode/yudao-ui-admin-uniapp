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
          <wd-form-item title="名字" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入课程名字" />
          </wd-form-item>
          <wd-form-item title="分数" title-width="200rpx" prop="score">
            <wd-input v-model="formData.score" type="number" clearable placeholder="请输入分数" />
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
import { parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Demo03Course } from '@/api/infra/demo/demo03/erp'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDemo03Course, getDemo03Course, updateDemo03Course } from '@/api/infra/demo/demo03/erp'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  studentId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑课程' : '新增课程')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Demo03Course>({
  id: undefined,
  studentId: undefined,
  name: '',
  score: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '名字不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDemo03Course(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data: Demo03Course = {
      ...formData.value,
      studentId: parseId(props.studentId) || formData.value.studentId,
      score: formData.value.score != null ? Number(formData.value.score) : undefined,
    }
    if (props.id) {
      await updateDemo03Course(data)
      toast.success('修改成功')
    } else {
      await createDemo03Course(data)
      toast.success('新增成功')
    }
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
