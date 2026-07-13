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
          <wd-form-item title="封面" title-width="180rpx" prop="icon">
            <yd-upload-img v-model="formData.icon" directory="im/face-pack" />
          </wd-form-item>
          <wd-form-item title="名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入表情包名称"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="排序" title-width="180rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" :max="9999" />
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
import type { ImManagerFacePackVO } from '@/api/im/manager/face/pack'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createManagerFacePack,
  getManagerFacePack,
  updateManagerFacePack,
} from '@/api/im/manager/face/pack'
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
const getTitle = computed(() => props.id ? '编辑表情包' : '新增表情包') // 表单标题
const formLoading = ref(false) // 表单提交状态
const formData = ref<ImManagerFacePackVO>({
  id: undefined,
  name: '',
  icon: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '名称不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/face/pack/index')
}

/** 加载表情包详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getManagerFacePack(Number(props.id))
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
      await updateManagerFacePack(formData.value)
      toast.success('修改成功')
    } else {
      await createManagerFacePack(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('im:manager:face-pack:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化表情包表单 */
onMounted(() => {
  getDetail()
})
</script>
