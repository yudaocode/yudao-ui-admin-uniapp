<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-input
            v-model="formData.title"
            label="公告标题"
            label-width="180rpx"
            prop="title"
            clearable
            placeholder="请输入公告标题"
          />
          <wd-input
            v-model="formData.content"
            label="公告内容"
            label-width="180rpx"
            prop="content"
            clearable
            placeholder="请输入公告内容"
          />
          <wd-cell title="公告类型" title-width="180rpx" prop="type" center>
            <wd-radio-group v-model="formData.type" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-cell title="公告状态" title-width="180rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { Notice } from '@/api/system/notice'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createNotice, getNotice, updateNotice } from '@/api/system/notice'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑通知公告' : '新增通知公告')
const formLoading = ref(false)
const formData = ref<Notice>({
  id: undefined,
  title: '',
  content: '',
  type: 0,
  status: 0,
})
const formRules = {
  title: [{ required: true, message: '公告标题不能为空' }],
  content: [{ required: true, message: '公告内容不能为空' }],
  type: [{ required: true, message: '公告类型不能为空' }],
  status: [{ required: true, message: '公告状态不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/notice/index')
}

/** 加载通知公告详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getNotice(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateNotice(formData.value)
      toast.success('修改成功')
    } else {
      await createNotice(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
