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
          <wd-input
            v-model="formData.name"
            label="角色名称"
            label-width="180rpx"
            prop="name"
            clearable
            placeholder="请输入角色名称"
          />
          <wd-input
            v-model="formData.code"
            label="角色标识"
            label-width="180rpx"
            prop="code"
            clearable
            placeholder="请输入角色标识"
          />
          <wd-cell title="显示顺序" title-width="180rpx" prop="sort" center>
            <wd-input-number
              v-model="formData.sort"
              :min="0"
            />
          </wd-cell>
          <wd-cell title="状态" title-width="180rpx" prop="status" center>
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
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { Role } from '@/api/system/role'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createRole, getRole, updateRole } from '@/api/system/role'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'

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
const getTitle = computed(() => props.id ? '编辑角色' : '新增角色')
const formLoading = ref(false) // 提交中状态
const formData = ref<Role>({
  id: undefined,
  name: '',
  code: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  remark: '',
  createTime: '',
})
const formRules = {
  name: [{ required: true, message: '角色名称不能为空' }],
  code: [{ required: true, message: '角色标识不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/role/index')
}

/** 加载角色详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getRole(props.id)
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
      await updateRole(formData.value)
      toast.success('修改成功')
    } else {
      await createRole(formData.value)
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
