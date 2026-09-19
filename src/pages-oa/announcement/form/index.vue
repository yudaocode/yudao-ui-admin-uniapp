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
            label="公告类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_ANNOUNCEMENT_TYPE"
            placeholder="请选择公告类型"
          />
          <yd-form-picker
            v-model="formData.priority"
            label="优先级"
            label-width="180rpx"
            prop="priority"
            :dict-type="DICT_TYPE.OA_PRIORITY"
            placeholder="请选择优先级"
          />
          <wd-form-item title="置顶" title-width="180rpx" prop="top" center>
            <wd-switch v-model="formData.top" />
          </wd-form-item>
          <wd-form-item title="公告标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入公告标题"
            />
          </wd-form-item>
          <wd-form-item title="相关链接" title-width="180rpx" prop="url">
            <wd-input
              v-model="formData.url"
              clearable
              :maxlength="512"
              placeholder="请输入相关链接（可选）"
            />
          </wd-form-item>
          <wd-form-item title="公告内容" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入公告内容"
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
import type { Announcement } from '@/api/oa/announcement'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createAnnouncement, getAnnouncement, updateAnnouncement } from '@/api/oa/announcement'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { OA_ANNOUNCEMENT_TYPE, OA_PRIORITY } from '../../utils/constants'

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
const getTitle = computed(() => props.id ? '编辑公告' : '新增公告')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Announcement>>({ // 表单数据；公告内容为纯文本编辑
  id: undefined,
  type: OA_ANNOUNCEMENT_TYPE.ANNOUNCEMENT,
  priority: OA_PRIORITY.NORMAL,
  title: '',
  content: '',
  url: '',
  top: false,
})
const formSchema = createFormSchema({ // 表单校验规则
  type: [{ required: true, message: '公告类型不能为空' }],
  priority: [{ required: true, message: '优先级不能为空' }],
  title: [{ required: true, message: '公告标题不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/announcement/list/index')
}

/** 加载公告详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAnnouncement(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = formData.value as Announcement
    if (props.id) {
      await updateAnnouncement(data)
      toast.success('修改成功')
    } else {
      await createAnnouncement(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:announcement:reload')
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
