<template>
  <!-- 文件夹表单弹窗 -->
  <wd-popup v-model="visible" position="bottom" root-portal>
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ formData.id ? '编辑文件夹' : '新建文件夹' }}
      </view>
      <wd-input
        v-model.trim="formData.title"
        label="文件夹名称"
        label-width="180rpx"
        placeholder="请输入文件夹名称"
        clearable
        :maxlength="255"
      />
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="loading" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createKnowledgeFolder, getKnowledgeFolder, updateKnowledgeFolder } from '@/api/pms/kb/content/folder'
import { PmsKnowledgeRootId } from '@/pages-pms/kb/utils/constants'

const emit = defineEmits<{ success: [] }>() // 文件夹变化事件

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 提交中
const formData = ref<{
  id?: number
  libraryId: number
  parentId: number
  title: string
}>({ libraryId: 0, parentId: PmsKnowledgeRootId, title: '' }) // 表单数据

/** 打开弹窗：create 传入 parentId；update 额外传入 id */
async function open(mode: 'create' | 'update', libraryId: number, parentId = PmsKnowledgeRootId, id?: number) {
  formData.value = { libraryId, parentId, title: '' }
  visible.value = true
  if (mode === 'update' && id) {
    loading.value = true
    try {
      const folder = await getKnowledgeFolder(id)
      formData.value = {
        id: folder.id,
        libraryId: folder.libraryId,
        parentId: folder.parentId,
        title: folder.title,
      }
    } finally {
      loading.value = false
    }
  }
}

/** 提交表单 */
async function handleSubmit() {
  const title = formData.value.title.trim()
  if (!title) {
    toast.warning('请输入文件夹名称')
    return
  }
  loading.value = true
  try {
    if (formData.value.id) {
      await updateKnowledgeFolder({ ...formData.value, title })
      toast.success('更新成功')
    } else {
      await createKnowledgeFolder({ ...formData.value, title })
      toast.success('创建成功')
    }
    visible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
