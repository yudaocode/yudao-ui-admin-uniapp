<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="知识库成员"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <view class="mb-24rpx text-24rpx text-[#999]">
          创建人固定保留；管理员可维护知识库信息和成员，普通成员可新增内容，具体操作受内容协作权限控制。
        </view>

        <!-- 成员列表 -->
        <view
          v-for="(item, index) in memberList"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <template v-if="item.level === PmsKnowledgeLibraryMemberLevel.CREATOR">
            <view class="flex items-center gap-16rpx">
              <view class="h-64rpx w-64rpx flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1677ff] text-28rpx text-white">
                <wd-img v-if="item.avatar" :src="item.avatar" width="64rpx" height="64rpx" radius="50%" />
                <text v-else>{{ (item.nickname || '-').slice(0, 1) }}</text>
              </view>
              <view class="min-w-0 flex-1">
                <view class="text-28rpx text-[#333]">
                  {{ item.nickname || `用户 ${item.userId}` }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  创建人
                </view>
              </view>
              <wd-tag type="success" plain>
                创建人
              </wd-tag>
            </view>
          </template>
          <template v-else>
            <view class="mb-12rpx flex items-center justify-between">
              <wd-radio-group v-model="item.identityType" type="button" @change="handleIdentityTypeChange(item)">
                <wd-radio value="user">
                  成员
                </wd-radio>
                <wd-radio value="dept">
                  部门
                </wd-radio>
              </wd-radio-group>
              <text class="shrink-0 text-26rpx text-[#f5222d]" @click="memberList.splice(index, 1)">移除</text>
            </view>
            <view class="mb-12rpx">
              <UserFormPicker
                v-if="item.identityType === 'user'"
                v-model="item.userId"
                label="成员"
                label-width="160rpx"
                placeholder="请选择成员"
              />
              <DeptFormPicker
                v-else
                v-model="item.deptId"
                label="部门"
                label-width="160rpx"
                placeholder="请选择部门"
              />
              <view v-if="item.identityType === 'dept' && item.deptName" class="mt-8rpx text-24rpx text-[#999]">
                {{ item.parentDeptName ? `${item.parentDeptName} / ` : '' }}{{ item.deptName }}
              </view>
            </view>
            <view class="flex items-center justify-between">
              <text class="text-28rpx text-[#666]">角色</text>
              <wd-radio-group v-model="item.level" type="button">
                <wd-radio :value="PmsKnowledgeLibraryMemberLevel.ADMIN">
                  管理员
                </wd-radio>
                <wd-radio :value="PmsKnowledgeLibraryMemberLevel.MEMBER">
                  普通成员
                </wd-radio>
              </wd-radio-group>
            </view>
          </template>
        </view>
        <wd-empty v-if="!memberList.length" description="暂无成员" />

        <wd-button block variant="plain" @click="handleAdd">
          添加成员
        </wd-button>
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeLibraryMember } from '@/api/pms/kb/library/member'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getKnowledgeLibraryMemberList, updateKnowledgeLibraryMemberList } from '@/api/pms/kb/library/member'
import DeptFormPicker from '@/components/system-select/dept-form-picker.vue'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { PmsKnowledgeLibraryMemberLevel } from '@/pages-pms/kb/utils/constants'
import { navigateBackPlus } from '@/utils'

interface EditableMember extends Partial<KnowledgeLibraryMember> {
  identityType: 'user' | 'dept' // 成员身份类型
}

const props = defineProps<{
  libraryId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const memberList = ref<EditableMember[]>([]) // 成员列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询知识库成员列表 */
async function getList() {
  const data = await getKnowledgeLibraryMemberList(Number(props.libraryId))
  memberList.value = data.map(member => ({
    ...member,
    identityType: member.userId ? 'user' : 'dept',
  }))
}

/** 添加成员 */
function handleAdd() {
  memberList.value.push({
    identityType: 'user',
    level: PmsKnowledgeLibraryMemberLevel.MEMBER,
  })
}

/** 处理成员身份变化 */
function handleIdentityTypeChange(member: EditableMember) {
  member.userId = undefined
  member.deptId = undefined
}

/** 提交表单 */
async function handleSubmit() {
  const editableMembers = memberList.value.filter(item => item.level !== PmsKnowledgeLibraryMemberLevel.CREATOR)
  // 校验成员或部门是否已选择
  if (editableMembers.some(item => (item.identityType === 'user' && !item.userId) || (item.identityType === 'dept' && !item.deptId))) {
    toast.warning('请选择成员或部门')
    return
  }
  // 校验成员或部门是否重复
  const userIds = editableMembers.filter(item => item.identityType === 'user').map(item => item.userId)
  const deptIds = editableMembers.filter(item => item.identityType === 'dept').map(item => item.deptId)
  if (new Set(userIds).size !== userIds.length || new Set(deptIds).size !== deptIds.length) {
    toast.warning('成员或部门不能重复')
    return
  }

  formLoading.value = true
  try {
    await updateKnowledgeLibraryMemberList({
      libraryId: Number(props.libraryId),
      members: editableMembers.map(item => ({
        userId: item.identityType === 'user' ? item.userId : undefined,
        deptId: item.identityType === 'dept' ? item.deptId : undefined,
        level: item.level!,
      })),
    })
    toast.success('成员更新成功')
    uni.$emit('pms:kb:library:reload')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
