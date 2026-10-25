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
          <wd-form-item title="签到天数" title-width="190rpx" prop="day">
            <wd-input-number v-model="formData.day" :min="1" :max="7" :precision="0" />
          </wd-form-item>
          <wd-form-item title="奖励积分" title-width="190rpx" prop="point">
            <wd-input-number v-model="formData.point" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="奖励经验" title-width="190rpx" prop="experience">
            <wd-input-number v-model="formData.experience" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="190rpx" prop="status" center>
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
        </wd-cell-group>
      </wd-form>
      <view class="p-24rpx text-24rpx text-[#999]">
        默认 7 天为一个签到周期；奖励积分和奖励经验至少配置一个。
      </view>
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
import type { MemberSignInConfig } from '@/api/member/signin/config'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createMemberSignInConfig,
  getMemberSignInConfig,
  updateMemberSignInConfig,
} from '@/api/member/signin/config'
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
const getTitle = computed(() => props.id ? '编辑签到规则' : '新增签到规则')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MemberSignInConfig>({
  id: undefined,
  day: 1,
  point: 0,
  experience: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  day: [{ required: true, message: '签到天数不能为空' }],
  point: [
    { required: true, message: '奖励积分不能为空' },
    { validator: (_value, model) => Number(model.point || 0) > 0 || Number(model.experience || 0) > 0 || '奖励积分与奖励经验至少配置一个' },
  ],
  experience: [{ required: true, message: '奖励经验不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-member/signin/config/index')
}

/** 加载签到规则详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMemberSignInConfig(props.id)
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
      await updateMemberSignInConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createMemberSignInConfig(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('member:signin-config:reload')
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
