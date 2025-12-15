<template>
  <view class="page-container">
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
          <wd-cell
            title="上级部门"
            title-width="180rpx"
            prop="parentId"
            is-link
            :value="getParentName()"
            @click="showDeptPicker = true"
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
          <wd-cell
            title="负责人"
            title-width="180rpx"
            prop="leaderUserId"
            is-link
            :value="getLeaderName()"
            @click="showUserPicker = true"
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

    <!-- 上级部门选择器 -->
    <wd-picker
      :model-value="showDeptPicker"
      :columns="deptPickerColumns"
      title="选择上级部门"
      @confirm="handleDeptConfirm"
      @close="showDeptPicker = false"
    />

    <!-- 负责人选择器 -->
    <wd-picker
      :model-value="showUserPicker"
      :columns="userPickerColumns"
      title="选择负责人"
      @confirm="handleUserConfirm"
      @close="showUserPicker = false"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createDept, getDept, getSimpleDeptList, updateDept } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { CommonStatusEnum } from '@/utils/constants'

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
const formLoading = ref(false) // 提交中状态
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

const deptList = ref<Dept[]>([]) // 部门列表
const userList = ref<User[]>([]) // 用户列表
const showDeptPicker = ref(false) // 部门选择器
const showUserPicker = ref(false) // 负责人选择器

/** 部门选择器列 */
const deptPickerColumns = computed(() => {
  const items = [{ label: '顶级部门', value: 0 }]
  deptList.value.forEach((dept) => {
    // 编辑时排除自己和子部门
    if (props.id && dept.id === props.id) {
      return
    }
    items.push({ label: dept.name, value: dept.id! })
  })
  return items
})

/** 用户选择器列 */
const userPickerColumns = computed(() => {
  const items = [{ label: '不设置', value: 0 }]
  userList.value.forEach((user) => {
    items.push({ label: user.nickname, value: user.id! })
  })
  return items
})

/** 获取上级部门名称 */
function getParentName(): string {
  if (!formData.value.parentId || formData.value.parentId === 0) {
    return '顶级部门'
  }
  const parent = deptList.value.find(d => d.id === formData.value.parentId)
  return parent?.name || '请选择'
}

/** 获取负责人名称 */
function getLeaderName(): string {
  if (!formData.value.leaderUserId) {
    return '请选择'
  }
  const user = userList.value.find(u => u.id === formData.value.leaderUserId)
  return user?.nickname || '请选择'
}

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 加载部门详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDept(props.id)
}

/** 部门选择确认 */
function handleDeptConfirm({ value }: { value: number }) {
  formData.value.parentId = value
}

/** 负责人选择确认 */
function handleUserConfirm({ value }: { value: number }) {
  formData.value.leaderUserId = value || undefined
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
  // 获取部门列表
  deptList.value = await getSimpleDeptList()
  // 获取用户列表
  userList.value = await getSimpleUserList()
  // 获取详情
  await getDetail()
})
</script>

<style lang="scss" scoped>
</style>
