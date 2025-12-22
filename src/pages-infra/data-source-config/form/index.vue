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
            label="数据源名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入数据源名称"
          />
          <wd-input
            v-model="formData.url"
            label="数据源连接"
            label-width="200rpx"
            prop="url"
            clearable
            placeholder="请输入数据源连接"
          />
          <wd-input
            v-model="formData.username"
            label="用户名"
            label-width="200rpx"
            prop="username"
            clearable
            placeholder="请输入用户名"
          />
          <wd-input
            v-model="formData.password"
            label="密码"
            label-width="200rpx"
            prop="password"
            show-password
            clearable
            placeholder="请输入密码"
          />
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
import type { DataSourceConfig } from '@/api/infra/data-source-config'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createDataSourceConfig, getDataSourceConfig, updateDataSourceConfig } from '@/api/infra/data-source-config'
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
const getTitle = computed(() => props.id ? '编辑数据源' : '新增数据源')
const formLoading = ref(false)
const formData = ref<DataSourceConfig>({
  id: undefined,
  name: '',
  url: '',
  username: '',
  password: '',
})
const formRules = {
  name: [{ required: true, message: '数据源名称不能为空' }],
  url: [{ required: true, message: '数据源连接不能为空' }],
  username: [{ required: true, message: '用户名不能为空' }],
  password: [{ required: true, message: '密码不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/data-source-config/index')
}

/** 加载数据源详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDataSourceConfig(props.id)
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
      await updateDataSourceConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createDataSourceConfig(formData.value)
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
