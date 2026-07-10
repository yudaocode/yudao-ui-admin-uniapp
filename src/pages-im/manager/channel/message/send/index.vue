<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="推送频道消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <ChannelFormPicker v-model="formData.channelId" prop="channelId" @change="handleChannelChange" />
          <yd-form-picker
            v-model="formData.materialId"
            label="素材"
            label-width="180rpx"
            prop="materialId"
            :columns="materialOptions"
            placeholder="请选择素材"
            :before-open="handleOpenMaterialPicker"
          />
          <wd-form-item title="受众" title-width="180rpx" prop="receiverUserType" center>
            <wd-radio-group v-model="formData.receiverUserType" type="button">
              <wd-radio value="all">
                全员
              </wd-radio>
              <wd-radio value="users">
                指定用户
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <UserFormPicker
            v-if="formData.receiverUserType === 'users'"
            v-model="formData.receiverUserIds"
            label="接收用户"
            prop="receiverUserIds"
            placeholder="请选择接收用户"
            type="checkbox"
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
        确认推送
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ImManagerChannelVO } from '@/api/im/manager/channel'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { getSimpleManagerChannelMaterialList } from '@/api/im/manager/channel/material'
import { sendManagerChannelMessage } from '@/api/im/manager/channel/message'
import { UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import ChannelFormPicker from '@/pages-im/manager/channel/components/channel-form-picker.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const materialOptions = ref<{ label: string, value: number }[]>([]) // 素材选项
const formData = ref({
  channelId: undefined as number | undefined,
  materialId: undefined as number | undefined,
  receiverUserType: 'all' as 'all' | 'users',
  receiverUserIds: [] as number[],
}) // 表单数据
const formSchema = createFormSchema(() => ({
  channelId: [{ required: true, message: '所属频道不能为空' }],
  materialId: [{ required: true, message: '素材不能为空' }],
  receiverUserIds: [{
    required: () => formData.value.receiverUserType === 'users',
    message: '接收用户不能为空',
  }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/message/index')
}

/** 加载素材选项 */
async function loadMaterialOptions(channelId: number) {
  const list = await getSimpleManagerChannelMaterialList(channelId)
  materialOptions.value = list.map(item => ({
    label: item.title,
    value: item.id,
  }))
}

/** 选择频道 */
async function handleChannelChange(channel?: ImManagerChannelVO) {
  formData.value.materialId = undefined
  materialOptions.value = []
  if (channel?.id) {
    await loadMaterialOptions(channel.id)
  }
}

/** 打开素材选择器 */
function handleOpenMaterialPicker() {
  if (!formData.value.channelId) {
    toast.show('请先选择频道')
    return false
  }
  return true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid || !formData.value.materialId) {
    return
  }
  formLoading.value = true
  try {
    await sendManagerChannelMessage({
      materialId: formData.value.materialId,
      receiverUserIds: formData.value.receiverUserType === 'users'
        ? formData.value.receiverUserIds
        : undefined,
    })
    toast.success('推送成功')
    uni.$emit('im:manager:channel-message:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}
</script>
