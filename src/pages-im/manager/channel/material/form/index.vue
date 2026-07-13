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
          <ChannelFormPicker v-model="formData.channelId" prop="channelId" />
          <yd-form-picker
            v-model="formData.type"
            label="内容类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.IM_CHANNEL_MATERIAL_TYPE"
          />
          <wd-form-item title="标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              placeholder="请输入图文标题"
              :maxlength="128"
            />
          </wd-form-item>
          <wd-form-item title="封面图" title-width="180rpx" prop="coverUrl">
            <yd-upload-img v-model="formData.coverUrl" directory="im/channel-material" />
          </wd-form-item>
          <wd-form-item title="摘要" title-width="180rpx" prop="summary">
            <wd-textarea
              v-model="formData.summary"
              clearable
              placeholder="请输入一句话摘要"
              :maxlength="255"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item v-if="formData.type === ImChannelMaterialType.CONTENT" title="正文" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入站内正文"
              :maxlength="5000"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item v-else title="跳转链接" title-width="180rpx" prop="url">
            <wd-input
              v-model="formData.url"
              clearable
              placeholder="https://example.com/..."
              :maxlength="512"
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
import type { ImManagerChannelMaterialVO } from '@/api/im/manager/channel/material'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createManagerChannelMaterial,
  getManagerChannelMaterial,
  updateManagerChannelMaterial,
} from '@/api/im/manager/channel/material'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, ImChannelMaterialType } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ChannelFormPicker from '@/pages-im/manager/channel/components/channel-form-picker.vue'

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
const getTitle = computed(() => props.id ? '编辑频道素材' : '新增频道素材') // 表单标题
const formLoading = ref(false) // 表单提交状态
const formData = ref<ImManagerChannelMaterialVO>({
  id: undefined,
  channelId: undefined,
  type: ImChannelMaterialType.CONTENT,
  title: '',
  coverUrl: '',
  summary: '',
  content: '',
  url: '',
}) // 表单数据
const formSchema = createFormSchema({
  channelId: [{ required: true, message: '所属频道不能为空' }],
  type: [{ required: true, message: '内容类型不能为空' }],
  title: [{ required: true, message: '标题不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/material/index')
}

/** 加载频道素材详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getManagerChannelMaterial(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.type === ImChannelMaterialType.CONTENT) {
      formData.value.url = ''
    } else {
      formData.value.content = ''
    }
    if (props.id) {
      await updateManagerChannelMaterial(formData.value)
      toast.success('修改成功')
    } else {
      await createManagerChannelMaterial(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('im:manager:channel-material:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化频道素材表单 */
onMounted(() => {
  getDetail()
})
</script>
