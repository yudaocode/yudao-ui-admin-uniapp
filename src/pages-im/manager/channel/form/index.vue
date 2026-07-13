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
          <wd-form-item title="频道编码" title-width="180rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              :disabled="!!props.id"
              placeholder="如 system_notice"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="频道名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入频道名称"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="频道头像" title-width="180rpx" prop="avatar">
            <yd-upload-img v-model="formData.avatar" directory="im/channel" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="180rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="180rpx"
            prop="status"
            :dict-type="DICT_TYPE.COMMON_STATUS"
          />
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
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createManagerChannel,
  getManagerChannel,
  updateManagerChannel,
} from '@/api/im/manager/channel'
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
const getTitle = computed(() => props.id ? '编辑频道' : '新增频道') // 表单标题
const formLoading = ref(false) // 表单提交状态
const formData = ref<ImManagerChannelVO>({
  id: undefined,
  code: '',
  name: '',
  avatar: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  code: [
    { required: true, message: '频道编码不能为空' },
    { pattern: /^[a-z][a-z0-9_]*$/, message: '只能由小写字母、数字、下划线组成，且以字母开头' },
  ],
  name: [{ required: true, message: '频道名称不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/index')
}

/** 加载频道详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getManagerChannel(Number(props.id))
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
      await updateManagerChannel(formData.value)
      toast.success('修改成功')
    } else {
      await createManagerChannel(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('im:manager:channel:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化频道表单 */
onMounted(() => {
  getDetail()
})
</script>
