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
          <DeptPicker
            v-model="formData.parentId"
            label="上级部门"
            :show-root="true"
          />
          <wd-input
            v-model="formData.name"
            label="部门名称"
            label-width="180rpx"
            prop="name"
            clearable
            placeholder="请输入部门名称"
          />
          <wd-cell title="显示顺序" title-width="180rpx" prop="sort" center>
            <wd-input-number
              v-model="formData.sort"
              :min="0"
            />
          </wd-cell>
          <UserPicker
            v-model="formData.leaderUserId"
            type="radio"
          />
          <wd-input
            v-model="formData.phone"
            label="联系电话"
            label-width="180rpx"
            prop="phone"
            clearable
            placeholder="请输入联系电话"
          />
          <wd-input
            v-model="formData.email"
            label="邮箱"
            label-width="180rpx"
            prop="email"
            clearable
            placeholder="请输入邮箱"
          />
          <wd-cell title="状态" title-width="180rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-cell>
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
import type { Dept } from '@/api/system/dept'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createDept, getDept, updateDept } from '@/api/system/dept'
import UserPicker from '@/pages-system/user/form/components/user-picker.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import DeptPicker from './components/dept-picker.vue'

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
const formLoading = ref(false)
const formData = ref<Dept>({
  id: undefined,
  name: '',
  parentId: props.parentId || 0,
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  leaderUserId: undefined,
  phone: '',
  email: '',
})
const formRules = {
  parentId: [{ required: true, message: '上级部门不能为空' }],
  name: [{ required: true, message: '部门名称不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

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
    setTimeout(() => {
      handleBack()
    }, 500)
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

<style lang="scss" scoped>
</style>
