<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="意见反馈"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="p-24rpx">
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group custom-class="cell-group" border>
          <wd-textarea
            v-model="formData.content"
            label="反馈内容"
            label-width="180rpx"
            prop="content"
            placeholder="请输入您的宝贵意见和建议"
            :maxlength="500"
            show-word-limit
            clearable
            :rows="5"
          />
          <wd-cell title="反馈图片" title-width="180rpx" />
          <!-- TODO @芋艿：图片上传的接入 -->
          <view class="px-24rpx pb-24rpx">
            <wd-upload
              v-model:file-list="fileList"
              :upload-method="customUpload"
              accept="image"
              multiple
              :limit="9"
            />
          </view>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部提交按钮 -->
    <view class="safe-area-inset-bottom fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        提交反馈
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { UploadFile, UploadMethod } from 'wot-design-uni/components/wd-upload/types'
import { ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getEnvBaseUrl, navigateBackPlus } from '@/utils/index'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false)
const fileList = ref<UploadFile[]>([])
const formData = ref({
  content: '',
})
const formRules = {
  content: [
    { required: true, message: '请输入反馈内容' },
    {
      required: true,
      validator: (value: string) => value.length >= 10,
      message: '反馈内容至少10个字符',
    },
  ],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/user/index')
}

/** 自定义上传方法 */
const customUpload: UploadMethod = (file, formData, options) => {
  const uploadTask = uni.uploadFile({
    url: `${getEnvBaseUrl()}/infra/file/upload`,
    header: {
      ...options.header,
    },
    name: options.name,
    fileType: options.fileType,
    formData,
    filePath: file.url,
    success(res) {
      if (res.statusCode === options.statusCode) {
        options.onSuccess(res, file, formData)
      } else {
        options.onError({ ...res, errMsg: res.errMsg || '' }, file, formData)
      }
    },
    fail(err) {
      options.onError(err, file, formData)
    },
  })
  uploadTask.onProgressUpdate((res) => {
    options.onProgress(res, file)
  })
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    // 构建提交数据
    const submitData = {
      content: formData.value.content,
      // 提取已上传成功的图片 URL
      images: fileList.value
        .filter(file => file.status === 'success')
        .map((file) => {
          // 尝试从响应中解析 URL
          if (file.response) {
            try {
              const res = typeof file.response === 'string' ? JSON.parse(file.response) : file.response
              return res.data || file.url
            } catch {
              return file.url
            }
          }
          return file.url
        }),
    }

    // TODO: 替换为真实 API 调用
    await mockSubmitFeedback(submitData)

    toast.success('提交成功，感谢您的反馈！')
    setTimeout(() => {
      handleBack()
    }, 1500)
  } finally {
    formLoading.value = false
  }
}

// ===================== Mock API =====================
// TODO: 后端 API 实现后，删除此 mock 函数，替换为真实 API 调用

interface FeedbackData {
  content: string
  images: string[]
}

/**
 * Mock 提交反馈接口
 *
 * @param data 反馈数据
 */
function mockSubmitFeedback(data: FeedbackData): Promise<{ code: number, message: string }> {
  return new Promise((resolve, reject) => {
    console.log('[Mock] 提交反馈数据:', data)

    // 模拟网络延迟
    setTimeout(() => {
      // 模拟成功
      if (data.content && data.content.length >= 10) {
        resolve({
          code: 0,
          message: '提交成功',
        })
      } else {
        reject(new Error('反馈内容不能少于 10 个字符'))
      }
    }, 1000)
  })
}
</script>

<style lang="scss" scoped>
:deep(.cell-group) {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}

.safe-area-inset-bottom {
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
