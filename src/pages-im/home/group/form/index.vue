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
          <wd-form-item title="群名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入群名称"
            />
          </wd-form-item>
          <wd-form-item title="群头像" title-width="180rpx" prop="avatar">
            <yd-upload-img v-model="formData.avatar" directory="im/group" />
          </wd-form-item>
          <wd-form-item title="群公告" title-width="180rpx" prop="notice">
            <wd-textarea
              v-model="formData.notice"
              clearable
              placeholder="请输入群公告"
              :maxlength="500"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="进群审批" title-width="180rpx" prop="joinApproval" center>
            <wd-switch v-model="formData.joinApproval" />
          </wd-form-item>
          <UserFormPicker
            v-if="!props.id"
            v-model="formData.memberUserIds"
            label="群成员"
            prop="memberUserIds"
            placeholder="请选择初始成员"
            type="checkbox"
          />
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
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createGroup, getGroup, updateGroup } from '@/api/im/group'
import { UserFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formData = ref({
  id: undefined as number | undefined,
  name: '',
  avatar: '',
  notice: '',
  joinApproval: false,
  memberUserIds: [] as number[],
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '群名称不能为空' }],
})

/** 表单标题 */
const getTitle = computed(() => props.id ? '编辑群资料' : '创建群聊')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/friend/index?tab=group')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getGroup(props.id)
  formData.value = {
    id: detail.id,
    name: detail.name,
    avatar: detail.avatar || '',
    notice: detail.notice || '',
    joinApproval: !!detail.joinApproval,
    memberUserIds: [],
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id && formData.value.id) {
      await updateGroup({
        id: formData.value.id,
        name: formData.value.name,
        avatar: formData.value.avatar,
        notice: formData.value.notice,
        joinApproval: formData.value.joinApproval,
      })
      toast.success('修改成功')
    } else {
      const group = await createGroup({
        name: formData.value.name,
        memberUserIds: formData.value.memberUserIds,
        joinApproval: formData.value.joinApproval,
      })
      if (group?.id && (formData.value.avatar || formData.value.notice)) {
        await updateGroup({
          id: group.id,
          name: formData.value.name,
          avatar: formData.value.avatar,
          notice: formData.value.notice,
          joinApproval: formData.value.joinApproval,
        })
      }
      toast.success('创建成功')
    }
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
