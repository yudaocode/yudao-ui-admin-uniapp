<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="账套授权"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 权限级别说明 -->
    <view class="m-24rpx rounded-12rpx bg-[#e6f4ff] p-24rpx text-26rpx text-[#1677ff] leading-40rpx">
      查看者可以查看账套数据，会计可以维护账套数据，主管可以管理账套及成员
    </view>

    <!-- 成员列表 -->
    <view class="flex-1 px-24rpx">
      <view
        v-for="(member, index) in memberList"
        :key="member.userId"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-16rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
            {{ member.nickname || `用户 #${member.userId}` }}
          </view>
          <view class="flex flex-shrink-0 gap-8rpx">
            <wd-tag v-if="member.founder" type="success" plain>
              创建人
            </wd-tag>
            <dict-tag v-if="member.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="member.status" />
          </view>
        </view>
        <view class="mb-12rpx text-28rpx text-[#666]">
          <text class="mr-8rpx text-[#999]">部门：</text>{{ member.deptName || '-' }}
        </view>
        <view class="mb-16rpx text-28rpx text-[#666]">
          <text class="mr-8rpx text-[#999]">手机号码：</text>{{ member.mobile || '-' }}
        </view>
        <view class="flex items-center justify-between gap-16rpx">
          <wd-radio-group
            v-model="member.level"
            type="button"
            :disabled="member.founder"
          >
            <wd-radio
              v-for="option in AccountUserLevelOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </wd-radio>
          </wd-radio-group>
          <wd-button
            size="small"
            type="error"
            variant="plain"
            :disabled="member.founder"
            @click="removeMember(index)"
          >
            移出
          </wd-button>
        </view>
      </view>

      <!-- 添加成员 -->
      <UserPicker
        v-model="addUserIds"
        type="checkbox"
        title="选择用户"
        :disabled-ids="memberUserIds"
        disabled-text="已在账套中"
        @confirm="handleAddConfirm"
      >
        <view class="mb-24rpx flex items-center justify-center rounded-12rpx bg-white p-24rpx text-28rpx text-[#1677ff] shadow-sm">
          + 添加成员
        </view>
      </UserPicker>
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
import type { AccountUser } from '@/api/fms/config/account-user'
import type { User } from '@/api/system/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  AccountUserLevel,
  AccountUserLevelOptions,
  getAccountUserList,
  updateAccountUserList,
} from '@/api/fms/config/account-user'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

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
const fmsStore = useFmsStore()
const memberList = ref<AccountUser[]>([]) // 账套成员列表
const addUserIds = ref<number[]>([]) // 添加成员选择器选中值
const formLoading = ref(false) // 表单提交状态

const memberUserIds = computed(() => memberList.value.map(member => member.userId)) // 已授权用户编号

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/account-set/index')
}

/** 加载账套成员列表 */
async function getList() {
  if (!props.id) {
    return
  }
  memberList.value = await getAccountUserList(Number(props.id))
}

/** 添加成员确认（默认查看者，可在列表中调整级别） */
function handleAddConfirm(users: User[]) {
  for (const user of users) {
    memberList.value.push({
      userId: user.id,
      nickname: user.nickname,
      deptName: user.deptName,
      status: user.status,
      defaultStatus: false,
      founder: false,
      level: AccountUserLevel.READ,
    })
  }
  addUserIds.value = []
}

/** 移出账套成员 */
function removeMember(index: number) {
  memberList.value.splice(index, 1)
}

/** 保存账套成员及其权限级别 */
async function handleSubmit() {
  if (!props.id) {
    return
  }
  formLoading.value = true
  try {
    await updateAccountUserList({
      accountSetId: Number(props.id),
      members: memberList.value.map(member => ({
        userId: member.userId,
        level: member.level,
      })),
    })
    toast.success('账套授权已保存')
    // 当前用户级别可能变化，强制刷新账套上下文
    await fmsStore.loadAccountSetList(true)
    uni.$emit('fms:config:account-set:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
