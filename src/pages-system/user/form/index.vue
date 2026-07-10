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
          <wd-form-item title="用户名称" title-width="180rpx" prop="username">
            <wd-input
              v-model="formData.username"
              clearable
              placeholder="请输入用户名称"
            />
          </wd-form-item>
          <wd-form-item v-if="!props.id" title="用户密码" title-width="180rpx" prop="password">
            <wd-input
              v-model="formData.password"
              show-password
              clearable
              placeholder="请输入用户密码"
            />
          </wd-form-item>
          <wd-form-item title="用户昵称" title-width="180rpx" prop="nickname">
            <wd-input
              v-model="formData.nickname"
              clearable
              placeholder="请输入用户昵称"
            />
          </wd-form-item>
          <DeptFormPicker
            v-model="formData.deptId"
            label="归属部门"
          />
          <PostFormPicker v-model="formData.postIds" />
          <wd-form-item title="邮箱" title-width="180rpx" prop="email">
            <wd-input
              v-model="formData.email"
              clearable
              placeholder="请输入邮箱"
            />
          </wd-form-item>
          <wd-form-item title="手机号码" title-width="180rpx" prop="mobile">
            <wd-input
              v-model="formData.mobile"
              clearable
              placeholder="请输入手机号码"
            />
          </wd-form-item>
          <wd-form-item title="性别" title-width="180rpx" center prop="sex">
            <wd-radio-group v-model="formData.sex" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" center prop="status">
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
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
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createUser, getUser, updateUser } from '@/api/system/user'
import { getIntDictOptions } from '@/hooks/useDict'
import { DeptFormPicker } from '@/components/system-select'
import PostFormPicker from '@/pages-system/post/form/components/post-form-picker.vue'
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
const getTitle = computed(() => props.id ? '编辑用户' : '新增用户')
const formLoading = ref(false) // 表单提交状态
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
}) // 表单数据
const formSchema = createFormSchema({
  username: [{ required: true, message: '用户名称不能为空' }],
  nickname: [{ required: true, message: '用户昵称不能为空' }],
  password: [{ required: () => !props.id, message: '用户密码不能为空' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
  mobile: [{ type: 'mobile', message: '请输入正确的手机号码' }],
  sex: [{ required: true, message: '性别不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

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
    uni.$emit('system:user:reload')
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
