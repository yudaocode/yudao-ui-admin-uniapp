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
          <wd-form-item title="等级名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入等级名称" />
          </wd-form-item>
          <wd-form-item title="等级" title-width="200rpx" prop="level">
            <wd-input-number v-model="formData.level" :min="1" :precision="0" allow-null />
          </wd-form-item>
          <wd-form-item title="升级经验" title-width="200rpx" prop="experience">
            <wd-input-number v-model="formData.experience" :min="1" :precision="0" allow-null />
          </wd-form-item>
          <wd-form-item title="享受折扣" title-width="200rpx" prop="discountPercent">
            <wd-input-number v-model="formData.discountPercent" :min="0" :max="100" :precision="0" allow-null />
          </wd-form-item>
          <wd-form-item title="等级图标" title-width="200rpx" prop="icon">
            <yd-upload-img v-model="formData.icon" directory="member-level" />
          </wd-form-item>
          <wd-form-item title="背景图" title-width="200rpx" prop="backgroundUrl">
            <yd-upload-img v-model="formData.backgroundUrl" directory="member-level" />
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
import type { MemberLevel } from '@/api/member/level'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createMemberLevel, getMemberLevel, updateMemberLevel } from '@/api/member/level'
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
const getTitle = computed(() => props.id ? '编辑会员等级' : '新增会员等级')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MemberLevel>({
  id: undefined,
  name: '',
  level: undefined,
  experience: undefined,
  discountPercent: undefined,
  icon: '',
  backgroundUrl: '',
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '等级名称不能为空' }],
  level: [
    { required: true, message: '等级不能为空' },
    { validator: value => (Number.isInteger(Number(value)) && Number(value) > 0) || '等级必须是大于 0 的整数' },
  ],
  experience: [
    { required: true, message: '升级经验不能为空' },
    { validator: value => (Number.isInteger(Number(value)) && Number(value) > 0) || '升级经验必须是大于 0 的整数' },
  ],
  discountPercent: [
    { required: true, message: '享受折扣不能为空' },
    { validator: value => (Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 100) || '享受折扣为 0-100 的整数' },
  ],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-member/level/index')
}

/** 加载等级详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMemberLevel(props.id)
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
      await updateMemberLevel(formData.value)
      toast.success('修改成功')
    } else {
      await createMemberLevel(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('member:level:reload')
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
