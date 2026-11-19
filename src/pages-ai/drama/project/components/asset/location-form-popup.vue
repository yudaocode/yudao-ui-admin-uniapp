<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="height: 88vh; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="h-full flex flex-col">
      <!-- 标题 -->
      <view class="flex items-center justify-between px-24rpx py-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">
          {{ formData.id ? '编辑场景' : '新增场景' }}
        </text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 表单区域 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="场景名称" title-width="180rpx" prop="name">
              <wd-input v-model="formData.name" :maxlength="64" clearable placeholder="请输入场景名称" />
            </wd-form-item>
            <wd-form-item title="场景设定" title-width="180rpx" layout="vertical">
              <wd-textarea
                v-model="formData.description"
                :maxlength="2000"
                show-word-limit
                auto-height
                placeholder="请输入场景设定"
              />
            </wd-form-item>
            <wd-form-item title="可站位置" title-width="180rpx">
              <wd-input v-model="slotsText" clearable placeholder="例如：门口，窗边；多个用逗号分隔" />
            </wd-form-item>
            <wd-form-item title="有群演" title-width="180rpx" center>
              <wd-switch v-model="formData.crowd" />
            </wd-form-item>
            <wd-form-item v-if="formData.crowd" title="群演描述" title-width="180rpx">
              <wd-input v-model="formData.crowdDescription" :maxlength="500" clearable placeholder="人数、服饰、位置、姿态" />
            </wd-form-item>
            <wd-form-item title="参考图" title-width="180rpx">
              <yd-upload-img v-model="formData.referenceImageUrl" :file-size="10" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>

        <!-- 候选图：点选后保存时生效 -->
        <view v-if="currentLocation?.imageUrls?.length" class="mt-16rpx bg-white p-24rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            选用候选
          </view>
          <view class="flex flex-wrap gap-16rpx">
            <view v-for="(url, index) in currentLocation.imageUrls" :key="`${url}${index}`" class="w-150rpx">
              <view :class="formData.selectedIndex === index ? 'outline outline-4 outline-[#1677ff] rounded-8rpx' : ''">
                <AssetImage :url="url" size="150rpx" :preview-urls="currentLocation.imageUrls" />
              </view>
              <view class="mt-4rpx flex items-center justify-between">
                <text v-if="formData.selectedIndex === index" class="text-22rpx text-[#1677ff]">已选用</text>
                <text v-else class="text-22rpx text-[#1677ff]" @click="formData.selectedIndex = index">选用</text>
                <text class="text-22rpx text-[#f5222d]" @click="handleDeleteCandidate(index)">删除</text>
              </view>
            </view>
          </view>
        </view>
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
import type { DramaLocation, DramaLocationSaveReq } from '@/api/ai/drama/asset'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { createDramaLocation, deleteDramaLocationCandidate, updateDramaLocation } from '@/api/ai/drama/asset'
import { createFormSchema } from '@/utils/wot'
import AssetImage from './asset-image.vue'

const props = defineProps<{
  projectId: number // 项目编号
  locations: DramaLocation[] // 项目的场景：用于展示编辑中场景的最新候选图
}>()

const emit = defineEmits<{
  success: []
}>()

const toast = useToast()
const dialog = useDialog()
const visible = ref(false) // 弹窗显示状态
const saving = ref(false) // 保存状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<DramaLocationSaveReq>({ // 表单数据
  projectId: props.projectId,
  name: '',
})
const slotsText = ref('') // 可站位置：逗号分隔
const formSchema = createFormSchema({
  name: [{ required: true, message: '场景名称不能为空' }],
})
const currentLocation = computed(() => props.locations.find(item => item.id === formData.value.id)) // 编辑中的场景

/** 打开：传入场景时为编辑 */
function open(location?: DramaLocation) {
  visible.value = true
  formData.value = {
    id: location?.id,
    projectId: props.projectId,
    name: location?.name || '',
    description: location?.description || '',
    crowd: !!location?.crowd,
    crowdDescription: location?.crowdDescription || '',
    referenceImageUrl: location?.referenceImageUrl || '',
    selectedIndex: location?.selectedIndex,
  }
  slotsText.value = (location?.availableSlots || []).join('，')
}

defineExpose({ open })

/** 删除一张候选图：删除前的候选图记为上一版，可撤销 */
async function handleDeleteCandidate(index: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '删除这张候选图后，可通过「撤销」恢复，是否继续？' })
  } catch {
    return
  }
  await deleteDramaLocationCandidate(formData.value.id!, index)
  formData.value.selectedIndex = undefined
  toast.success('删除成功')
  emit('success')
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  saving.value = true
  try {
    const data: DramaLocationSaveReq = {
      ...formData.value,
      availableSlots: slotsText.value.split(/[,，、]/).map(item => item.trim()).filter(Boolean),
    }
    if (data.id) {
      await updateDramaLocation(data)
    } else {
      await createDramaLocation(data)
    }
    toast.success('保存成功')
    visible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>
