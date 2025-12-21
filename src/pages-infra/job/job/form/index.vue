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
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-input
            v-model="formData.name"
            label="任务名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入任务名称"
          />
          <wd-input
            v-model="formData.handlerName"
            label="处理器名称"
            label-width="200rpx"
            prop="handlerName"
            clearable
            placeholder="请输入处理器名称"
          />
          <wd-input
            v-model="formData.handlerParam"
            label="处理器参数"
            label-width="200rpx"
            prop="handlerParam"
            clearable
            placeholder="请输入处理器参数"
          />
          <wd-input
            v-model="formData.cronExpression"
            label="CRON 表达式"
            label-width="200rpx"
            prop="cronExpression"
            clearable
            placeholder="请输入 CRON 表达式"
          />
          <wd-input
            v-model.number="formData.retryCount"
            label="重试次数"
            label-width="200rpx"
            prop="retryCount"
            type="number"
            clearable
            placeholder="请输入重试次数"
          />
          <wd-input
            v-model.number="formData.retryInterval"
            label="重试间隔(ms)"
            label-width="200rpx"
            prop="retryInterval"
            type="number"
            clearable
            placeholder="请输入重试间隔"
          />
          <wd-input
            v-model.number="formData.monitorTimeout"
            label="监控超时(ms)"
            label-width="200rpx"
            prop="monitorTimeout"
            type="number"
            clearable
            placeholder="请输入监控超时时间"
          />
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
import type { Job } from '@/api/infra/job'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createJob, getJob, updateJob } from '@/api/infra/job'
import { navigateBackPlus } from '@/utils'

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
const getTitle = computed(() => props.id ? '编辑定时任务' : '新增定时任务')
const formLoading = ref(false)
const formData = ref<Job>({
  id: undefined,
  name: '',
  status: 0,
  handlerName: '',
  handlerParam: '',
  cronExpression: '',
  retryCount: 0,
  retryInterval: 0,
  monitorTimeout: 0,
})
const formRules = {
  name: [{ required: true, message: '任务名称不能为空' }],
  handlerName: [{ required: true, message: '处理器名称不能为空' }],
  cronExpression: [{ required: true, message: 'CRON 表达式不能为空' }],
  retryCount: [{ required: true, message: '重试次数不能为空' }],
  retryInterval: [{ required: true, message: '重试间隔不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/job/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getJob(props.id)
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
      await updateJob(formData.value)
      toast.success('修改成功')
    } else {
      await createJob(formData.value)
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
