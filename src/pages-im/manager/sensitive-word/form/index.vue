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
          <wd-form-item title="敏感词" prop="word">
            <wd-input v-model="formData.word" placeholder="请输入敏感词" :maxlength="64" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.status" label="状态" prop="status" :dict-type="DICT_TYPE.COMMON_STATUS" />
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
import type { ImManagerSensitiveWordVO } from '@/api/im/manager/sensitiveword'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createManagerSensitiveWord,
  getManagerSensitiveWord,
  updateManagerSensitiveWord,
} from '@/api/im/manager/sensitiveword'
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
const getTitle = computed(() => props.id ? '编辑敏感词' : '新增敏感词') // 表单标题
const formLoading = ref(false) // 表单提交状态
const formData = ref<ImManagerSensitiveWordVO>({
  word: '',
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  word: [{ required: true, message: '敏感词不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/sensitive-word/index')
}

/** 加载敏感词详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getManagerSensitiveWord(Number(props.id))
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
      await updateManagerSensitiveWord(formData.value)
      toast.success('修改成功')
    } else {
      await createManagerSensitiveWord(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('im:manager:sensitive-word:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化敏感词表单 */
onMounted(() => {
  getDetail()
})
</script>
