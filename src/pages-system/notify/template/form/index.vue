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
          <wd-form-item title="模板名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入模板名称"
            />
          </wd-form-item>
          <wd-form-item title="模板编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入模板编码"
            />
          </wd-form-item>
          <wd-form-item title="发送人名称" title-width="200rpx" prop="nickname">
            <wd-input
              v-model="formData.nickname"
              clearable
              placeholder="请输入发送人名称"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="模板类型"
            prop="type"
            :dict-type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE"
            placeholder="请选择模板类型"
          />
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
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
          <wd-form-item title="模板内容" title-width="200rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入模板内容"
              :rows="4"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
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
import type { NotifyTemplate } from '@/api/system/notify/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createNotifyTemplate, getNotifyTemplate, updateNotifyTemplate } from '@/api/system/notify/template'
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
const getTitle = computed(() => props.id ? '编辑站内信模板' : '新增站内信模板')
const formLoading = ref(false) // 表单提交状态
const formData = ref<NotifyTemplate>({
  id: undefined,
  name: '',
  code: '',
  nickname: '',
  content: '',
  type: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '模板名称不能为空' }],
  code: [{ required: true, message: '模板编码不能为空' }],
  nickname: [{ required: true, message: '发送人名称不能为空' }],
  type: [{ required: true, message: '模板类型不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  content: [{ required: true, message: '模板内容不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/notify/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getNotifyTemplate(props.id)
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
      await updateNotifyTemplate(formData.value)
      toast.success('修改成功')
    } else {
      await createNotifyTemplate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:notify-template:reload')
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
