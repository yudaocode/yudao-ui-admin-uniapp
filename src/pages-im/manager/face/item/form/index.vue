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
          <FacePackFormPicker
            v-model="formData.packId"
            label="表情包"
            label-width="180rpx"
            prop="packId"
            placeholder="请选择表情包"
            :disabled="Boolean(props.packId)"
          />
          <wd-form-item title="表情图" title-width="180rpx" prop="url">
            <yd-upload-img
              v-model="formData.url"
              directory="im/face-item"
              @uploaded="handleImageUploaded"
            />
          </wd-form-item>
          <wd-form-item title="表情名" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="可选；如「捂脸」"
              :maxlength="64"
            />
          </wd-form-item>
          <wd-form-item title="宽度" title-width="180rpx" prop="width" center>
            <wd-input-number v-model="formData.width" :min="1" :max="2048" />
          </wd-form-item>
          <wd-form-item title="高度" title-width="180rpx" prop="height" center>
            <wd-input-number v-model="formData.height" :min="1" :max="2048" />
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
import type { ImManagerFacePackItemVO } from '@/api/im/manager/face/item'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createManagerFacePackItem,
  getManagerFacePackItem,
  updateManagerFacePackItem,
} from '@/api/im/manager/face/item'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import FacePackFormPicker from '@/pages-im/manager/face/pack/components/pack-form-picker.vue'

const props = defineProps<{
  id?: number | string
  packId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑表情' : '新增表情') // 表单标题
const formLoading = ref(false) // 表单提交状态
const formData = ref<ImManagerFacePackItemVO>({
  id: undefined,
  packId: Number(props.packId || 0),
  url: '',
  name: '',
  width: 120,
  height: 120,
  sort: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  packId: [{ required: true, message: '表情包不能为空' }],
  url: [{ required: true, message: '表情图不能为空' }],
  width: [
    { required: true, message: '宽度不能为空' },
    { validator: value => validateSize(value, '宽度') },
  ],
  height: [
    { required: true, message: '高度不能为空' },
    { validator: value => validateSize(value, '高度') },
  ],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  const packParam = formData.value.packId || props.packId
  navigateBackPlus(`/pages-im/manager/face/item/index${packParam ? `?packId=${packParam}` : ''}`)
}

/** 校验尺寸 */
function validateSize(value: unknown, label: string) {
  const size = Number(value)
  if (!Number.isInteger(size) || size < 1 || size > 2048) {
    return `${label}需在 1 - 2048 像素之间`
  }
  return true
}

/** 自动探测图片尺寸 */
function handleImageUploaded(url: string) {
  uni.getImageInfo({
    src: url,
    success: (res) => {
      formData.value.width = res.width
      formData.value.height = res.height
    },
  })
}

/** 加载表情详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getManagerFacePackItem(Number(props.id))
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
      await updateManagerFacePackItem(formData.value)
      toast.success('修改成功')
    } else {
      await createManagerFacePackItem(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('im:manager:face-pack-item:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化表情表单 */
onMounted(() => {
  getDetail()
})
</script>
