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
          <wd-form-item v-if="props.id" title="群头像" title-width="180rpx" prop="avatar">
            <yd-upload-img v-model="formData.avatar" directory="im/group" />
          </wd-form-item>
          <wd-form-item v-if="props.id" title="群公告" title-width="180rpx" prop="notice">
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
          <FriendFormPicker
            v-if="!props.id"
            v-model="formData.memberUserIds"
            label="群成员"
            :locked-ids="lockedMemberUserIds"
            :max-size="GROUP_MAX_MEMBER - 1"
            @confirm="handleMembersConfirm"
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
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { createGroup, getGroup, updateGroup } from '@/api/im/group'
import { GROUP_MAX_MEMBER } from '@/pages-im/utils/config'
import { buildDefaultGroupName } from '@/pages-im/utils/group'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import { useImRuntimeStore } from '../../../store/runtimeStore'
import { useGroupStore } from '../../../store/groupStore'
import { useFriendStore } from '../../../store/friendStore'
import FriendFormPicker from '../../components/friend-form-picker.vue'

const props = defineProps<{
  id?: number | string
  memberUserIds?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const pageProxy = getCurrentInstance()?.proxy as {
  getOpenerEventChannel?: () => UniNamespace.EventChannel | undefined
} | null
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
const lockedMemberUserIds = computed(() => (props.memberUserIds || '') // 从好友资料进入时固定包含的成员
  .split(',')
  .map(Number)
  .filter(item => Number.isFinite(item) && item > 0))
let generatedName = '' // 最近一次自动生成的群名

/** 表单标题 */
const getTitle = computed(() => props.id ? '编辑群资料' : '创建群聊')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/home/contact/index')
}

/** 根据已选好友补充默认群名 */
function handleMembersConfirm(userIds: number[]) {
  const members = userIds
    .map(userId => useFriendStore().getActiveFriendLiteList.find(item => item.id === userId))
    .filter(item => !!item)
  const nextName = buildDefaultGroupName(members)
  if (!formData.value.name || formData.value.name === generatedName) {
    formData.value.name = nextName
  }
  generatedName = nextName
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const detail = await getGroup(Number(props.id))
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
  const memberUserIds = Array.from(new Set([...formData.value.memberUserIds, ...lockedMemberUserIds.value]))
  const lockedIdSet = new Set(lockedMemberUserIds.value)
  const selectedMemberUserIds = memberUserIds.filter(userId => !lockedIdSet.has(userId))
  if (!props.id && selectedMemberUserIds.length === 0) {
    toast.show('请至少选择一位好友')
    return
  }
  if (!props.id && memberUserIds.length > GROUP_MAX_MEMBER - 1) {
    toast.show(`群成员上限为 ${GROUP_MAX_MEMBER} 人`)
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
        memberUserIds,
        joinApproval: formData.value.joinApproval,
      })
      useGroupStore().upsertGroup({
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        notice: group.notice,
        ownerUserId: group.ownerUserId,
        joinApproval: group.joinApproval,
      })
      toast.success('创建成功')
      if (group?.id) {
        pageProxy?.getOpenerEventChannel?.()?.emit('created', {
          id: group.id,
          name: formData.value.name,
          avatar: group.avatar,
        })
      }
    }
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  void useImRuntimeStore().ensure()
  if (!props.id && props.memberUserIds) {
    formData.value.memberUserIds = lockedMemberUserIds.value
  }
  getDetail()
})
</script>
