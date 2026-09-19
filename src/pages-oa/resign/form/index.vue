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
          <wd-form-item title="标题" title-width="220rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入标题"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.urgency"
            label="紧急程度"
            label-width="220rpx"
            prop="urgency"
            :dict-type="DICT_TYPE.OA_APPLY_URGENCY"
            placeholder="请选择紧急程度"
          />
          <UserFormPicker v-model="formData.handoverUserId" label="工作交接人" label-width="220rpx" prop="handoverUserId" placeholder="请选择工作交接人" />
          <wd-form-item title="未完成事宜" title-width="220rpx" prop="unfinishedWork">
            <wd-textarea
              v-model="formData.unfinishedWork"
              clearable
              placeholder="请输入未完成事宜"
            />
          </wd-form-item>
          <wd-form-item title="申请原因" title-width="220rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="5000"
              show-word-limit
              placeholder="请输入申请原因"
            />
          </wd-form-item>
          <wd-form-item title="有未完成报销" title-width="220rpx" prop="hasPendingReimbursement">
            <wd-radio-group v-model="formData.hasPendingReimbursement" type="button">
              <wd-radio :value="true">
                是
              </wd-radio>
              <wd-radio :value="false">
                否
              </wd-radio>
            </wd-radio-group>
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
        保存草稿
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ResignApply } from '@/api/oa/resign'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createResignApply, getResignApply, updateResignApply } from '@/api/oa/resign'
import { UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑离职申请' : '新增离职申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<ResignApply>>({
  id: undefined,
  title: '',
  urgency: undefined,
  handoverUserId: undefined,
  unfinishedWork: '',
  reason: '',
  hasPendingReimbursement: false,
}) // 表单数据
const formSchema = createFormSchema({ // 表单校验规则
  title: [{ required: true, message: '标题不能为空' }, { max: 255 }],
  urgency: [{ required: true, message: '紧急程度不能为空' }],
  handoverUserId: [{ required: true, message: '工作交接人不能为空' }],
  unfinishedWork: [{ required: true, message: '未完成事宜不能为空' }],
  reason: [{ required: true, message: '申请原因不能为空' }, { max: 5000 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/resign/index')
}

/** 加载离职申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getResignApply(Number(props.id))
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateResignApply(formData.value)
      toast.success('修改成功')
    } else {
      await createResignApply(formData.value)
      toast.success('保存成功')
    }
    uni.$emit('oa:resign:reload')
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
