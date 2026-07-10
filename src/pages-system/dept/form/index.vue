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
          <DeptFormPicker
            v-model="formData.parentId"
            label="上级部门"
            prop="parentId"
            :show-root="true"
          />
          <wd-form-item title="部门名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入部门名称"
            />
          </wd-form-item>
          <wd-form-item title="显示顺序" title-width="180rpx" prop="sort" center>
            <wd-input-number
              v-model="formData.sort"
              :min="0"
            />
          </wd-form-item>
          <UserFormPicker
            v-model="formData.leaderUserId"
            label="负责人"
            prop="leaderUserId"
          />
          <wd-form-item title="联系电话" title-width="180rpx" prop="phone">
            <wd-input
              v-model="formData.phone"
              clearable
              placeholder="请输入联系电话"
            />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="180rpx" prop="email">
            <wd-input
              v-model="formData.email"
              clearable
              placeholder="请输入邮箱"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
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
import type { Dept } from '@/api/system/dept'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDept, getDept, updateDept } from '@/api/system/dept'
import { DeptFormPicker, UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  parentId?: number
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑部门' : '新增部门')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Dept>({
  id: undefined,
  name: '',
  parentId: props.parentId || 0,
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  leaderUserId: undefined,
  phone: '',
  email: '',
}) // 表单数据
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '上级部门不能为空' }],
  name: [{ required: true, message: '部门名称不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  phone: [{ type: 'mobile', message: '请输入正确的手机号码' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dept/index')
}

/** 加载部门详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDept(props.id)
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
      await updateDept(formData.value)
      toast.success('修改成功')
    } else {
      await createDept(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:dept:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  // 获取详情
  await getDetail()
})
</script>
