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
            label="笔记类型"
            label-width="180rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_NOTE_TYPE"
            placeholder="请选择笔记类型"
          />
          <yd-form-picker
            v-model="formData.priority"
            label="优先级"
            label-width="180rpx"
            prop="priority"
            :columns="priorityOptions"
            placeholder="请选择优先级"
          />
          <yd-form-picker
            v-model="formData.categoryId"
            label="笔记目录"
            label-width="180rpx"
            prop="categoryId"
            :columns="categoryOptions"
            placeholder="请选择笔记目录"
            clearable
          />
          <wd-form-item title="笔记标题" title-width="180rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入笔记标题"
            />
          </wd-form-item>
          <wd-form-item title="笔记内容" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入笔记内容"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="180rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/note" />
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
import type { Note } from '@/api/oa/note'
import type { NoteCategory } from '@/api/oa/note/category'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createNote, getNote, updateNote } from '@/api/oa/note'
import { getSimpleNoteCategoryList } from '@/api/oa/note/category'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { isHtmlContent } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import { OA_NOTE_TYPE, OA_PRIORITY } from '../../utils/constants'

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
const getTitle = computed(() => props.id ? '编辑笔记' : '新增笔记')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Note>>({ // 表单数据；笔记内容为纯文本编辑
  id: undefined,
  type: OA_NOTE_TYPE.PRIVATE,
  priority: OA_PRIORITY.NORMAL,
  categoryId: undefined,
  title: '',
  content: '',
  fileUrls: [],
})
const formSchema = createFormSchema({ // 表单校验规则
  type: [{ required: true, message: '笔记类型不能为空' }],
  priority: [{ required: true, message: '优先级不能为空' }],
  title: [{ required: true, message: '笔记标题不能为空' }],
  content: [
    { required: true, message: '笔记内容不能为空' },
    { validator: value => String(value ?? '').trim().length >= 10 || '笔记内容不能少于 10 个字' },
  ],
})
const formRef = ref<FormInstance>() // 表单组件引用
const categoryList = ref<NoteCategory[]>([]) // 目录选项
const categoryOptions = computed(() => // 目录选择器选项
  categoryList.value.map(item => ({ label: item.name, value: item.id })))
const priorityOptions = computed(() => // 笔记优先级只允许一般/重要，对齐后端 @Max(2)
  getIntDictOptions(DICT_TYPE.OA_PRIORITY).filter(item => Number(item.value) <= OA_PRIORITY.IMPORTANT))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/note/index')
}

/** 加载笔记详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getNote(Number(props.id))
  // 富文本笔记用纯文本编辑器保存会破坏正文，阻止编辑并返回
  if (isHtmlContent(formData.value.content)) {
    toast.warning('富文本笔记请到 PC 端编辑')
    delay(handleBack)
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = formData.value as Note
    if (props.id) {
      await updateNote(data)
      toast.success('修改成功')
    } else {
      await createNote(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:note:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  categoryList.value = await getSimpleNoteCategoryList()
  getDetail()
})
</script>
