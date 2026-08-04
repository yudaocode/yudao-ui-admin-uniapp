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
        <wd-cell-group border title="基本信息">
          <wd-form-item title="结果设置名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入结果设置名称"
              :maxlength="255"
            />
          </wd-form-item>
        </wd-cell-group>

        <view class="mt-24rpx">
          <LevelList ref="levelListRef" v-model="formData.levels" />
        </view>
      </wd-form>
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
import type { ResultTemplate } from '@/api/hrm/performance/config/result-template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPerformanceResultTemplate,
  getPerformanceResultTemplate,
  updatePerformanceResultTemplate,
} from '@/api/hrm/performance/config/result-template'
import { createDefaultResultLevels } from '@/pages-hrm/utils/performance'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import LevelList from '../components/level-list.vue'

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
const getTitle = computed(() => props.id ? '编辑考核结果设置' : '新增考核结果设置')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const levelListRef = ref<InstanceType<typeof LevelList>>() // 结果等级列表
const formData = ref<ResultTemplate>(createDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '结果设置名称不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/performance/config/result-template/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getPerformanceResultTemplate(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!levelListRef.value?.validate()) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updatePerformanceResultTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createPerformanceResultTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:performance:result-template:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 创建默认表单数据 */
function createDefaultFormData(): ResultTemplate {
  return {
    id: undefined,
    name: '',
    levels: createDefaultResultLevels(),
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
