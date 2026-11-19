<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="height: 80vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="h-full flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between px-24rpx py-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">
          {{ formData.id ? '编辑道具' : '新增道具' }}
        </text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 表单区域 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="道具名称" title-width="180rpx" prop="title">
              <wd-input v-model="formData.title" :maxlength="128" clearable placeholder="请输入道具名称" />
            </wd-form-item>
            <wd-form-item title="出图提示词" title-width="180rpx" layout="vertical">
              <wd-textarea
                v-model="formData.prompt"
                :maxlength="2000"
                show-word-limit
                auto-height
                placeholder="请输入出图提示词"
              />
            </wd-form-item>
            <wd-form-item title="参考图" title-width="180rpx">
              <yd-upload-img v-model="formData.referenceImageUrl" :file-size="10" />
            </wd-form-item>
            <yd-form-picker
              v-model="formData.shotNumbers"
              label="出现的镜头"
              label-width="180rpx"
              placeholder="镜头未单独指定道具时，按这里关联"
              :columns="shotOptions"
              type="checkbox"
              clearable
            />
          </wd-cell-group>
        </wd-form>
      </scroll-view>

      <!-- 底部保存按钮 -->
      <view class="bg-white p-24rpx">
        <wd-button block type="primary" :loading="saving" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DramaVisualAsset, DramaVisualAssetSaveReq } from '@/api/ai/drama/asset'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { createDramaVisualAsset, updateDramaVisualAsset } from '@/api/ai/drama/asset'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  projectId: number // 项目编号
  sceneNos: number[] // 当前分镜的镜头序号
}>()

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const saving = ref(false) // 保存状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<DramaVisualAssetSaveReq>({ // 表单数据：道具即类型为道具的视觉资产
  projectId: props.projectId,
  title: '',
})
const formSchema = createFormSchema({
  title: [{ required: true, message: '道具名称不能为空' }],
})
const shotOptions = computed(() => props.sceneNos.map(item => ({ label: `镜头 ${item}`, value: item }))) // 可关联的镜头

/** 打开：传入道具时为编辑 */
function open(asset?: DramaVisualAsset) {
  visible.value = true
  formData.value = {
    id: asset?.id,
    projectId: props.projectId,
    title: asset?.title || '',
    prompt: asset?.prompt || '',
    referenceImageUrl: asset?.referenceImages?.referenceImageUrl || '',
    shotNumbers: [...(asset?.referenceImages?.shotNumbers || [])],
  }
}

defineExpose({ open })

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  saving.value = true
  try {
    if (formData.value.id) {
      await updateDramaVisualAsset(formData.value)
    } else {
      await createDramaVisualAsset(formData.value)
    }
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
