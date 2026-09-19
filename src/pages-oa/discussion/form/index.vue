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
          <yd-form-picker
            v-model="formData.type"
            label="讨论类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_DISCUSSION_TYPE"
            placeholder="请选择讨论类型"
            :disabled="isUpdate"
          />
          <wd-form-item title="标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入讨论标题"
            />
          </wd-form-item>
          <wd-form-item title="正文" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入讨论内容"
              :maxlength="2000"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="180rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="10" directory="oa/discussion" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 投票配置 -->
        <template v-if="formData.type === OA_DISCUSSION_TYPE.VOTE">
          <wd-cell-group border>
            <wd-form-item title="允许多选" title-width="180rpx" prop="voteMultiple" center>
              <wd-switch v-model="formData.voteMultiple" :disabled="isUpdate" />
            </wd-form-item>
            <wd-form-item title="开始时间" title-width="180rpx" prop="voteStartTime">
              <view class="flex items-center justify-end" @click="!isUpdate && (startTimeVisible = true)">
                <text class="text-28rpx" :class="voteStartTime === '' ? 'text-[#999]' : 'text-[#333]'">
                  {{ voteStartTime === '' ? '请选择开始时间' : formatDateTime(voteStartTime) }}
                </text>
              </view>
            </wd-form-item>
            <wd-form-item title="结束时间" title-width="180rpx" prop="voteEndTime">
              <view class="flex items-center justify-end" @click="endTimeVisible = true">
                <text class="text-28rpx" :class="voteEndTime === '' ? 'text-[#999]' : 'text-[#333]'">
                  {{ voteEndTime === '' ? '请选择结束时间' : formatDateTime(voteEndTime) }}
                </text>
              </view>
            </wd-form-item>
          </wd-cell-group>

          <!-- 投票选项 -->
          <view class="mt-20rpx bg-white p-24rpx">
            <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
              投票选项
            </view>
            <view
              v-for="(option, index) in formData.voteOptions"
              :key="index"
              class="mb-16rpx"
            >
              <view class="flex items-center gap-12rpx">
                <wd-input
                  v-model="option.title"
                  class="flex-1"
                  :placeholder="`选项 ${index + 1}`"
                  :maxlength="200"
                  :disabled="isUpdate"
                />
                <text
                  v-if="!isUpdate"
                  class="shrink-0 text-26rpx text-[#f5222d]"
                  :class="{ 'opacity-40': formData.voteOptions!.length <= 2 }"
                  @click="handleDeleteVoteOption(index)"
                >
                  删除
                </text>
              </view>
              <!-- 选项颜色：预设色板 -->
              <view class="mt-8rpx flex items-center gap-12rpx">
                <view
                  v-for="color in colorPalette"
                  :key="color"
                  class="h-36rpx w-36rpx rounded-full"
                  :class="option.color === color ? 'ring-2rpx ring-offset-2rpx ring-[#333]' : ''"
                  :style="{ backgroundColor: color }"
                  @click="!isUpdate && (option.color = color)"
                />
              </view>
            </view>
            <wd-button
              v-if="!isUpdate"
              variant="plain"
              size="small"
              @click="handleAddVoteOption"
            >
              新增选项
            </wd-button>
          </view>
        </template>
      </wd-form>
      <wd-datetime-picker v-model="voteStartTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="voteEndTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        {{ isUpdate ? '保存' : '发布' }}
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Discussion } from '@/api/oa/discussion'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createDiscussion, getDiscussion, updateDiscussion } from '@/api/oa/discussion'
import { delay, navigateBackPlus } from '@/utils'
import { isHtmlContent } from '@/utils/format'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_DISCUSSION_TYPE } from '../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const isUpdate = computed(() => !!props.id) // 是否修改
const getTitle = computed(() => props.id ? '修改讨论' : '发布讨论')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Discussion>>(createDefaultFormData()) // 表单数据；正文为纯文本编辑
const voteStartTime = ref<number | ''>('') // 投票开始时间选择器值，空字符串承接未选择
const voteEndTime = ref<number | ''>('') // 投票结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const colorPalette = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6'] // 投票选项预设颜色
const formSchema = createFormSchema({ // 表单校验规则
  type: [{ required: true, message: '讨论类型不能为空' }],
  title: [{ required: true, message: '标题不能为空' }, { max: 255 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/discussion/manage/index')
}

/** 创建讨论默认表单数据 */
function createDefaultFormData(): Partial<Discussion> {
  return {
    type: OA_DISCUSSION_TYPE.DISCUSSION,
    title: '',
    content: '',
    fileUrls: [],
    voteMultiple: false,
    voteOptions: [
      { title: '', color: '#409EFF', sort: 0 },
      { title: '', color: '#67C23A', sort: 1 },
    ],
  }
}

/** 加载讨论详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getDiscussion(Number(props.id))
  formData.value = data
  voteStartTime.value = data.voteStartTime ? toTimestamp(data.voteStartTime) : ''
  voteEndTime.value = data.voteEndTime ? toTimestamp(data.voteEndTime) : ''
  // 富文本讨论用纯文本编辑器保存会把 HTML 标签写成正文，阻止编辑并返回
  if (isHtmlContent(data.content)) {
    toast.warning('富文本讨论请到 PC 端编辑')
    delay(handleBack)
  }
}

/** 新增投票选项 */
function handleAddVoteOption() {
  formData.value.voteOptions!.push({
    title: '',
    color: colorPalette[formData.value.voteOptions!.length % colorPalette.length],
    sort: formData.value.voteOptions!.length,
  })
}

/** 删除投票选项 */
function handleDeleteVoteOption(index: number) {
  if (formData.value.voteOptions!.length <= 2) {
    return
  }
  formData.value.voteOptions!.splice(index, 1)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 投票类型校验选项和时间
  const isVote = formData.value.type === OA_DISCUSSION_TYPE.VOTE
  if (isVote) {
    const options = formData.value.voteOptions || []
    if (options.length < 2 || options.some(item => !item.title.trim())) {
      toast.warning('请至少填写两个投票选项')
      return
    }
    if (voteStartTime.value === '' || voteEndTime.value === '') {
      toast.warning('请选择投票开始时间和结束时间')
      return
    }
    if (Number(voteEndTime.value) <= Number(voteStartTime.value)) {
      toast.warning('投票结束时间必须晚于开始时间')
      return
    }
    options.forEach((item, index) => (item.sort = index))
  }

  formLoading.value = true
  try {
    // 非投票类型清空投票配置，时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      voteMultiple: isVote ? formData.value.voteMultiple : undefined,
      voteStartTime: isVote ? voteStartTime.value : undefined,
      voteEndTime: isVote ? voteEndTime.value : undefined,
      voteOptions: isVote ? formData.value.voteOptions : [],
    } as unknown as Discussion
    if (props.id) {
      await updateDiscussion(data)
      toast.success('修改成功')
    } else {
      await createDiscussion(data)
      toast.success('发布成功')
    }
    uni.$emit('oa:discussion:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
