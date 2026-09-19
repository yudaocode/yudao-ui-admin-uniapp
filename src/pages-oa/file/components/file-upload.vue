<template>
  <!-- 上传文件并登记云盘节点 -->
  <wd-button type="primary" :loading="uploadLoading" @click="handleChoose">
    上传文件
  </wd-button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { uploadFile } from '@/api/infra/file'
import { createFileNode } from '@/api/oa/file'
import { OA_FILE_NODE_TYPE } from '../../utils/constants'

const props = defineProps<{
  parentId: number // 上传目标目录
}>()

const emit = defineEmits<{
  success: []
}>() // 定义 success 事件，用于上传成功后的回调

const toast = useToast()
const uploadLoading = ref(false) // 文件上传中

/** 选择文件 */
function handleChoose() {
  if (uploadLoading.value) {
    return
  }
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res) => {
      const file = res.tempFiles[0]
      handleUpload(file.path, file.name, file.size)
    },
  })
  // #endif
  // #ifdef H5
  uni.chooseFile({
    count: 1,
    success: (res) => {
      const file = res.tempFiles[0] as any
      handleUpload(file.path, file.name, file.size)
    },
  })
  // #endif
  // #ifdef APP-PLUS
  toast.warning('App 端暂不支持上传文件，请在小程序或网页端操作')
  // #endif
}

/** 上传文件到平台并登记云盘节点 */
async function handleUpload(filePath: string, name: string, size?: number) {
  // 保存上传开始时的目标目录，避免切换目录后登记到其他位置
  const parentId = props.parentId
  uploadLoading.value = true
  try {
    const url = await uploadFile(filePath, 'oa/file')
    // 分类由后端根据文件扩展名计算
    await createFileNode({
      parentId,
      type: OA_FILE_NODE_TYPE.FILE,
      name,
      url,
      size,
    })
    toast.success('上传成功')
    emit('success')
  } catch {
    // 上传失败由请求层提示
  } finally {
    uploadLoading.value = false
  }
}
</script>
