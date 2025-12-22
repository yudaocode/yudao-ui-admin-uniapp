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
            v-model="formData.category"
            label="参数分类"
            label-width="200rpx"
            prop="category"
            clearable
            placeholder="请输入参数分类"
          />
          <wd-input
            v-model="formData.name"
            label="参数名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入参数名称"
          />
          <wd-input
            v-model="formData.key"
            label="参数键名"
            label-width="200rpx"
            prop="key"
            clearable
            placeholder="请输入参数键名"
          />
          <wd-input
            v-model="formData.value"
            label="参数键值"
            label-width="200rpx"
            prop="value"
            clearable
            placeholder="请输入参数键值"
          />
          <wd-cell title="是否可见" title-width="200rpx" prop="visible" center>
            <wd-radio-group v-model="formData.visible" shape="button">
              <wd-radio :value="true">
                是
              </wd-radio>
              <wd-radio :value="false">
                否
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            prop="remark"
            clearable
            placeholder="请输入备注"
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
import type { Config } from '@/api/infra/config'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createConfig, getConfig, updateConfig } from '@/api/infra/config'
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
const getTitle = computed(() => props.id ? '编辑参数配置' : '新增参数配置')
const formLoading = ref(false)
const formData = ref<Config>({
  id: undefined,
  category: '',
  name: '',
  key: '',
  value: '',
  type: undefined,
  visible: true,
  remark: '',
})
const formRules = {
  category: [{ required: true, message: '参数分类不能为空' }],
  name: [{ required: true, message: '参数名称不能为空' }],
  key: [{ required: true, message: '参数键名不能为空' }],
  value: [{ required: true, message: '参数键值不能为空' }],
  visible: [{ required: true, message: '是否可见不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/config/index')
}

/** 加载参数配置详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getConfig(props.id)
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
      await updateConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createConfig(formData.value)
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
