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
          <wd-form-item title="渠道名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              :disabled="formData.systemFlag"
              clearable
              placeholder="请输入渠道名称"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="显示顺序" title-width="180rpx" prop="sort">
            <wd-input-number v-model="formData.sort" allow-null :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { RecruitChannel } from '@/api/hrm/recruit/channel'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createRecruitChannel,
  getRecruitChannel,
  updateRecruitChannel,
} from '@/api/hrm/recruit/channel'
import { delay, navigateBackPlus } from '@/utils'
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
const getTitle = computed(() => props.id ? '编辑招聘渠道' : '新增招聘渠道')
const formLoading = ref(false) // 表单提交状态
const formData = ref<RecruitChannel>({ // 表单数据
  id: undefined,
  name: '',
  sort: 0,
  remark: '',
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '渠道名称不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/recruit/channel/index')
}

/** 加载招聘渠道详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getRecruitChannel(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data: RecruitChannel = {
      id: formData.value.id,
      name: formData.value.name,
      sort: formData.value.sort,
      remark: formData.value.remark,
    }
    if (props.id) {
      await updateRecruitChannel(data)
      toast.success('修改成功')
    } else {
      await createRecruitChannel(data)
      toast.success('新增成功')
    }
    uni.$emit('hrm:recruit:channel:reload')
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
