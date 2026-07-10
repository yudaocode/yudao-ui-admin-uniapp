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
          <wd-form-item title="组名" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入组名"
            />
          </wd-form-item>
          <wd-form-item title="描述" title-width="180rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              clearable
              placeholder="请输入描述"
            />
          </wd-form-item>
          <UserFormPicker
            v-model="formData.userIds"
            label="成员"
            prop="userIds"
            placeholder="请选择成员"
            type="checkbox"
          />
          <wd-form-item title="状态" title-width="180rpx" prop="status" center>
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
import type { UserGroup } from '@/api/bpm/user-group'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createUserGroup, getUserGroup, updateUserGroup } from '@/api/bpm/user-group'
import { UserFormPicker } from '@/components/system-select'
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
const getTitle = computed(() => props.id ? '编辑用户分组' : '新增用户分组')
const formLoading = ref(false) // 表单提交状态
const formData = ref<UserGroup>({
  id: undefined,
  name: '',
  description: '',
  userIds: [],
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '组名不能为空' }],
  userIds: [{ required: true, message: '成员不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/user-group/index')
}

/** 加载用户分组详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getUserGroup(Number(props.id))
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
      await updateUserGroup(formData.value)
      toast.success('修改成功')
    } else {
      await createUserGroup(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('bpm:user-group:reload')
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
