<template>
  <!-- 配乐、参考音频表单：新增时上传文件，编辑时调整使用的镜头、音量、起始偏移 -->
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
          {{ formData.id ? '编辑音频' : '新增音频' }}
        </text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 表单区域 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="类型" title-width="180rpx" center>
              <wd-radio-group v-model="formData.type" type="button" :disabled="!!formData.id">
                <wd-radio :value="AiDramaAudioTypeEnum.BGM">
                  配乐
                </wd-radio>
                <wd-radio :value="AiDramaAudioTypeEnum.REFERENCE">
                  参考音频
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item title="名称" title-width="180rpx">
              <wd-input v-model="formData.name" :maxlength="64" clearable placeholder="请输入名称" />
            </wd-form-item>
            <wd-form-item v-if="!formData.id" title="音频文件" title-width="180rpx" prop="fileUrl" layout="vertical">
              <yd-upload-file
                v-model="formData.fileUrl"
                :limit="1"
                :file-size="20"
                :file-type="['mp3', 'wav', 'm4a']"
                directory="ai/drama"
              />
            </wd-form-item>
            <yd-form-picker
              v-model="formData.storyboardIds"
              label="使用的镜头"
              label-width="180rpx"
              placeholder="为空表示候选，暂不使用"
              :columns="storyboardColumns"
              type="checkbox"
              filterable
              clearable
            />
            <template v-if="formData.id">
              <wd-form-item title="音量" title-width="180rpx" center>
                <wd-input-number v-model="formData.volume" :min="0" :max="2" :step="0.1" :precision="2" />
              </wd-form-item>
              <wd-form-item title="起始偏移（秒）" title-width="180rpx" center>
                <wd-input-number v-model="formData.startOffset" :min="0" :step="0.5" :precision="1" />
              </wd-form-item>
            </template>
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
import type { DramaAudio } from '@/api/ai/drama/asset'
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { createDramaAudio, updateDramaAudio } from '@/api/ai/drama/asset'
import { AiDramaAudioTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  success: [] // 已保存，需要刷新详情
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const saving = ref(false) // 保存状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref({ // 表单数据
  id: undefined as number | undefined,
  type: AiDramaAudioTypeEnum.BGM as number,
  name: '',
  fileUrl: '',
  storyboardIds: [] as number[],
  volume: 1,
  startOffset: 0,
})
const formSchema = createFormSchema({
  fileUrl: [{ required: () => !formData.value.id, message: '音频文件不能为空' }],
})
const storyboardColumns = computed(() => // 可使用的镜头
  props.detail.storyboards.map(item => ({ label: `#${item.sceneNo} ${item.title || '未命名镜头'}`, value: item.id })),
)

/** 打开：传入音频时为编辑 */
function open(audio?: DramaAudio) {
  visible.value = true
  formData.value = {
    id: audio?.id,
    type: audio?.type ?? AiDramaAudioTypeEnum.BGM,
    name: audio?.name || '',
    fileUrl: audio?.fileUrl || '',
    storyboardIds: [...(audio?.storyboardIds || [])],
    volume: audio ? audio.volume ?? 0.12 : 1, // 未设置时，合成按默认音量 0.12 混入
    startOffset: audio?.startOffset ?? 0,
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
    const { id, type, name, fileUrl, storyboardIds, volume, startOffset } = formData.value
    if (id) {
      await updateDramaAudio({ id, name, storyboardIds, volume, startOffset })
    } else {
      await createDramaAudio({ projectId: props.detail.project.id, type, name, fileUrl, storyboardIds })
    }
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
