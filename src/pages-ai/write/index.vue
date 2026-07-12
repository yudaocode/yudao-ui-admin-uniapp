<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 写作"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="创作" />
        <wd-tab title="历史" />
      </wd-tabs>
    </view>

    <!-- 创作区域 -->
    <view v-show="tabIndex === 0" class="min-h-0 flex-1 flex-col">
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx">
          <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
            <wd-form ref="formRef" :model="formData" :schema="formSchema">
              <wd-cell-group border>
                <wd-form-item title="类型" title-width="160rpx" prop="type" center>
                  <wd-radio-group v-model="formData.type" type="button">
                    <wd-radio :value="AiWriteTypeEnum.WRITING">
                      撰写
                    </wd-radio>
                    <wd-radio :value="AiWriteTypeEnum.REPLY">
                      回复
                    </wd-radio>
                  </wd-radio-group>
                </wd-form-item>
                <wd-form-item title="提示" title-width="160rpx" prop="prompt">
                  <wd-textarea
                    v-model="formData.prompt"
                    placeholder="请输入写作要求"
                    :maxlength="1200"
                    show-word-limit
                    clearable
                  />
                </wd-form-item>
                <wd-form-item v-if="formData.type === AiWriteTypeEnum.REPLY" title="原文" title-width="160rpx" prop="originalContent">
                  <wd-textarea
                    v-model="formData.originalContent"
                    placeholder="请输入需要回复的原文"
                    :maxlength="2000"
                    show-word-limit
                    clearable
                  />
                </wd-form-item>
                <yd-form-picker v-model="formData.length" label="长度" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_LENGTH" />
                <yd-form-picker v-model="formData.format" label="格式" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_FORMAT" />
                <yd-form-picker v-model="formData.tone" label="语气" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_TONE" />
                <yd-form-picker v-model="formData.language" label="语言" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_LANGUAGE" />
              </wd-cell-group>
            </wd-form>
            <view class="mt-24rpx flex gap-16rpx">
              <wd-button v-if="!isWriting" class="flex-1" type="primary" @click="handleSubmit">
                开始生成
              </wd-button>
              <wd-button v-else class="flex-1" type="danger" @click="stopStream">
                停止生成
              </wd-button>
              <wd-button class="flex-1" variant="plain" @click="handleReset">
                重置
              </wd-button>
            </view>
          </view>

          <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
              生成结果
            </view>
            <view class="min-h-260rpx whitespace-pre-wrap text-28rpx text-[#333] leading-46rpx">
              {{ writeResult || '生成结果会显示在这里' }}
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 历史列表 -->
    <z-paging
      v-show="tabIndex === 1"
      ref="pagingRef"
      v-model="historyList"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无写作记录"
      @query="queryHistory"
    >
      <view class="p-24rpx">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between">
            <dict-tag :type="DICT_TYPE.AI_WRITE_TYPE" :value="item.type" />
            <text class="text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
          </view>
          <view class="line-clamp-2 text-28rpx text-[#333]">
            {{ item.prompt || '-' }}
          </view>
          <view class="line-clamp-3 mt-12rpx text-26rpx text-[#666]">
            {{ item.generatedContent || item.errorMessage || '-' }}
          </view>
          <view class="mt-16rpx flex justify-end">
            <wd-button size="small" type="danger" variant="plain" @click="handleDeleteHistory(item.id)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AiWriteRespVO } from '@/api/ai/write'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnmounted, reactive, ref } from 'vue'
import { deleteWrite, getWritePage, writeStream } from '@/api/ai/write'
import { navigateBackPlus } from '@/utils'
import { AiWriteDefaultOptions, AiWriteTypeEnum, DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0)
const formRef = ref<FormInstance>() // 表单组件引用
const pagingRef = ref<any>() // 分页组件引用
const historyList = ref<AiWriteRespVO[]>([]) // 历史列表
const writeResult = ref('') // 写作结果
const isWriting = ref(false) // 写作生成状态
const streamController = ref<AbortController>() // 流式请求控制器
const settingsVisible = ref(false) // 写作参数弹窗
const formData = reactive({
  type: AiWriteTypeEnum.WRITING,
  prompt: '',
  originalContent: '',
  ...AiWriteDefaultOptions,
}) // 写作表单数据
const formSchema = createFormSchema({
  type: [{ required: true, message: '请选择写作类型' }],
  prompt: [{ required: true, message: '请输入写作要求' }],
  originalContent: [{ required: () => formData.type === AiWriteTypeEnum.REPLY, message: '请输入需要回复的原文' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询历史记录 */
async function queryHistory(pageNo: number, pageSize: number) {
  try {
    const data = await getWritePage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 提交写作 */
async function handleSubmit() {
  if (isWriting.value) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  writeResult.value = ''
  isWriting.value = true
  streamController.value = new AbortController()
  void writeStream({
    data: { ...formData },
    ctrl: streamController.value,
    onMessage: (res) => {
      const data = parseStreamData(res.data)
      if (data !== undefined) {
        writeResult.value += data
      }
    },
    onError: (error) => {
      console.error('AI 写作异常', error)
      toast.error('写作生成失败')
      isWriting.value = false
    },
    onClose: () => {
      isWriting.value = false
      streamController.value = undefined
      pagingRef.value?.reload()
    },
  })
}

/** 停止生成 */
function stopStream() {
  streamController.value?.abort()
  isWriting.value = false
}

/** 重置表单 */
function handleReset() {
  formData.type = AiWriteTypeEnum.WRITING
  formData.prompt = ''
  formData.originalContent = ''
  formData.length = AiWriteDefaultOptions.length
  formData.format = AiWriteDefaultOptions.format
  formData.tone = AiWriteDefaultOptions.tone
  formData.language = AiWriteDefaultOptions.language
  writeResult.value = ''
}

/** 删除历史 */
async function handleDeleteHistory(id: number) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该写作记录吗？' })
  } catch {
    return
  }
  await deleteWrite(id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 解析流式消息 */
function parseStreamData(raw: string) {
  try {
    const result = JSON.parse(raw)
    if (result.code !== 0 && result.code !== 200) {
      toast.error(result.msg || result.message || '生成失败')
      stopStream()
      return undefined
    }
    return result.data
  } catch {
    return raw
  }
}

/** 卸载 */
onUnmounted(() => {
  stopStream()
})
</script>
