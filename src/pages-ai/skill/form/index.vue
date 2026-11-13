<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 新增提示 -->
    <view v-if="!props.id" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-16rpx text-24rpx text-[#1677ff] leading-36rpx">
      创建后将自动生成 SKILL.md、scripts/、reference/，可在「文件管理」中继续编辑
    </view>

    <!-- 表单区域 -->
    <view :class="props.id ? '' : 'mt-24rpx'">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="技能名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              :disabled="!!props.id"
              :maxlength="64"
              clearable
              placeholder="小写字母/数字/中划线，如 order-analysis"
            />
          </wd-form-item>
          <wd-form-item title="技能描述" title-width="200rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              :disabled="!!props.id"
              :maxlength="1024"
              show-word-limit
              clearable
              placeholder="请输入技能描述"
            />
            <view v-if="props.id" class="mt-8rpx text-24rpx text-[#999]">
              以 SKILL.md 为准
            </view>
          </wd-form-item>
          <wd-form-item title="版本" title-width="200rpx" prop="version">
            <wd-input v-model="formData.version" :maxlength="32" clearable placeholder="请输入版本" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-input v-model="formData.remark" :maxlength="255" clearable placeholder="请输入备注" />
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
import type { Skill } from '@/api/ai/skill'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createSkill, getSkill, updateSkill } from '@/api/ai/skill'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑技能' : '新增技能')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Skill>({
  name: '',
  description: '',
  version: '1.0.0',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [
    { required: true, message: '技能名称不能为空' },
    { max: 64, message: '技能名称长度不能超过 64 个字符' },
    { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: '仅支持小写字母、数字、中划线，且不能以中划线开头或结尾' },
  ],
  description: [
    { required: true, message: '技能描述不能为空' },
    { max: 1024, message: '技能描述长度不能超过 1024 个字符' },
  ],
  version: [{ required: true, message: '版本不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/skill/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSkill(Number(props.id))
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
      await updateSkill(formData.value)
      toast.success('修改成功')
    } else {
      await createSkill(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('ai:skill:reload')
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
