<template>
  <view class="min-h-screen bg-[#f5f5f5]">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="p-24rpx">
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group custom-class="cell-group" border>
          <wd-input
            v-model="formData.username"
            label="用户名称"
            label-width="180rpx"
            prop="username"
            clearable
            placeholder="请输入用户名称"
          />
          <wd-input
            v-if="!props.id"
            v-model="formData.password"
            label="用户密码"
            label-width="180rpx"
            prop="password"
            show-password
            clearable
            placeholder="请输入用户密码"
          />
          <wd-input
            v-model="formData.nickname"
            label="用户昵称"
            label-width="180rpx"
            prop="nickname"
            clearable
            placeholder="请输入用户昵称"
          />
          <DeptPicker v-model="formData.deptId" />
          <PostPicker v-model="formData.postIds" />
          <wd-input
            v-model="formData.email"
            label="邮箱"
            label-width="180rpx"
            prop="email"
            clearable
            placeholder="请输入邮箱"
          />
          <wd-input
            v-model="formData.mobile"
            label="手机号码"
            label-width="180rpx"
            prop="mobile"
            clearable
            placeholder="请输入手机号码"
          />
          <wd-cell title="性别" title-width="180rpx" center prop="sex">
            <wd-radio-group v-model="formData.sex" shape="button" size="medium">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-cell title="状态" title-width="180rpx" center prop="status">
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-cell>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="180rpx"
            placeholder="请输入备注"
            :maxlength="200"
            show-word-limit
            clearable
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="safe-area-inset-bottom fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createUser, getUser, updateUser } from '@/api/system/user'
import { getIntDictOptions } from '@/hooks/useDict'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { isEmail, isMobile } from '@/utils/validator'
import DeptPicker from './components/dept-picker.vue'
import PostPicker from './components/post-picker.vue'
import { navigateBackPlus } from '@/utils';

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
const getTitle = computed(() => props.id ? '编辑用户' : '新增用户')
const formLoading = ref(false) // 提交中状态
const formData = ref<User>({
  id: undefined,
  username: '',
  nickname: '',
  password: '',
  mobile: '',
  email: '',
  sex: undefined,
  deptId: undefined,
  postIds: [],
  status: CommonStatusEnum.ENABLE,
  remark: '',
})
const formRules = {
  username: [{ required: true, message: '用户名称不能为空' }],
  password: [{ required: true, message: '用户密码不能为空' }],
  nickname: [{ required: true, message: '用户昵称不能为空' }],
  email: [{ required: false, validator: (value: string) => !value || isEmail(value), message: '请输入正确的邮箱地址' }],
  mobile: [{ required: false, validator: (value: string) => !value || isMobile(value), message: '请输入正确的手机号码' }],
  sex: [{ required: true, message: '性别不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/user/index')
}

/** 加载用户详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getUser(Number(props.id))
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
      await updateUser(formData.value)
      toast.success('修改成功')
    } else {
      await createUser(formData.value)
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
:deep(.cell-group) {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}

.safe-area-inset-bottom {
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
