<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="内容协作权限"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <view class="mb-24rpx text-24rpx text-[#999]">
          子文件夹和子文档默认继承同一套权限；知识库创建人和管理员始终拥有管理权限。
        </view>

        <!-- 访问范围 -->
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx text-28rpx text-[#666]">
            访问范围
          </view>
          <wd-radio-group v-model="formData.openStatus" type="button">
            <wd-radio :value="true">
              知识库内公开
            </wd-radio>
            <wd-radio :value="false">
              仅协作者可见
            </wd-radio>
          </wd-radio-group>
          <view v-if="formData.openStatus" class="mt-16rpx">
            <yd-form-picker
              v-model="formData.openLevel"
              label="公开权限"
              :columns="getIntDictOptions(DICT_TYPE.PMS_KNOWLEDGE_CONTENT_LEVEL)"
              placeholder="请选择公开权限"
            />
          </view>
        </view>

        <!-- 协作者 -->
        <view class="mb-16rpx mt-32rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">协作者</text>
          <wd-button size="small" type="primary" variant="plain" @click="handleAdd">
            添加协作者
          </wd-button>
        </view>
        <view
          v-for="(item, index) in memberList"
          :key="index"
          class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <template v-if="item.ownerStatus">
            <view class="flex items-center justify-between">
              <text class="text-28rpx text-[#333]">{{ item.userName || '-' }}</text>
              <wd-tag type="success" plain>
                拥有者
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
              <!-- 私有知识库只可选择库内成员/部门 -->
              <yd-form-picker
                v-if="item.identityType === 'user' && !libraryOpenStatus"
                v-model="item.userId"
                label="协作者"
                label-width="160rpx"
                :columns="userMemberColumns"
                placeholder="请选择知识库成员"
              />
              <UserFormPicker
                v-else-if="item.identityType === 'user'"
                v-model="item.userId"
                label="协作者"
                label-width="160rpx"
                placeholder="请选择成员"
              />
              <yd-form-picker
                v-else-if="!libraryOpenStatus"
                v-model="item.deptId"
                label="协作部门"
                label-width="160rpx"
                :columns="deptMemberColumns"
                placeholder="请选择知识库部门"
              />
              <DeptFormPicker
                v-else
                v-model="item.deptId"
                label="协作部门"
                label-width="160rpx"
                placeholder="请选择部门"
              />
            </view>
            <yd-form-picker
              v-model="item.level"
              label="权限"
              label-width="160rpx"
              :columns="getIntDictOptions(DICT_TYPE.PMS_KNOWLEDGE_CONTENT_LEVEL)"
              placeholder="请选择权限"
            />
          </template>
        </view>
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
import type { KnowledgeContentPermission, KnowledgeContentPermissionMember } from '@/api/pms/kb/content/permission'
import type { KnowledgeLibraryMember } from '@/api/pms/kb/library/member'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getKnowledgeContentPermission, updateKnowledgeContentPermission } from '@/api/pms/kb/content/permission'
import { getKnowledgeLibrary } from '@/api/pms/kb/library'
import { getKnowledgeLibraryMemberList } from '@/api/pms/kb/library/member'
import DeptFormPicker from '@/components/system-select/dept-form-picker.vue'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import {
  PmsKnowledgeContentLevel,
} from '@/pages-pms/kb/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/constants'
import { navigateBackPlus } from '@/utils'

interface EditableMember extends KnowledgeContentPermissionMember {
  identityType: 'user' | 'dept' // 协作者身份类型
  ownerStatus?: boolean // 是否权限拥有者
}

const props = defineProps<{
  id?: number | any // 协作权限编号
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const creatorUserId = ref(0) // 权限拥有者用户编号
const libraryOpenStatus = ref(true) // 知识库是否公开
const libraryMembers = ref<KnowledgeLibraryMember[]>([]) // 私有知识库可选成员
const memberList = ref<EditableMember[]>([]) // 协作者列表
const formData = ref<Partial<KnowledgeContentPermission>>({
  openStatus: true,
  openLevel: PmsKnowledgeContentLevel.PREVIEW,
}) // 表单数据

const userMemberColumns = computed(() => // 私有知识库可选用户成员
  libraryMembers.value
    .filter(item => item.userId !== undefined && item.userId !== creatorUserId.value)
    .map(item => ({ label: item.nickname || `用户 ${item.userId}`, value: item.userId! })),
)
const deptMemberColumns = computed(() => // 私有知识库可选部门成员
  libraryMembers.value
    .filter(item => item.deptId !== undefined)
    .map(item => ({ label: item.deptName || `部门 ${item.deptId}`, value: item.deptId! })),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载协作权限 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getKnowledgeContentPermission(Number(props.id))
  const [library, members] = await Promise.all([
    getKnowledgeLibrary(data.libraryId),
    getKnowledgeLibraryMemberList(data.libraryId),
  ])
  formData.value = data
  creatorUserId.value = data.creatorUserId
  libraryOpenStatus.value = library.openStatus
  libraryMembers.value = members
  memberList.value = data.members.map(member => ({
    ...member,
    identityType: member.userId ? 'user' : 'dept',
    ownerStatus: member.userId === data.creatorUserId,
  }))
}

/** 添加协作者 */
function handleAdd() {
  memberList.value.push({
    identityType: 'user',
    level: PmsKnowledgeContentLevel.PREVIEW,
  })
}

/** 处理协作者身份变化 */
function handleIdentityTypeChange(member: EditableMember) {
  member.userId = undefined
  member.deptId = undefined
}

/** 提交表单 */
async function handleSubmit() {
  const editableMembers = memberList.value.filter(item => !item.ownerStatus)
  // 校验协作者已选择用户或部门
  if (editableMembers.some(item => (item.identityType === 'user' && !item.userId) || (item.identityType === 'dept' && !item.deptId))) {
    toast.warning('请选择协作成员或部门')
    return
  }
  // 校验用户和部门不能重复
  const userIds = editableMembers.filter(item => item.identityType === 'user').map(item => item.userId)
  const deptIds = editableMembers.filter(item => item.identityType === 'dept').map(item => item.deptId)
  if (new Set(userIds).size !== userIds.length || new Set(deptIds).size !== deptIds.length) {
    toast.warning('协作成员或部门不能重复')
    return
  }

  formLoading.value = true
  try {
    await updateKnowledgeContentPermission({
      ...formData.value,
      members: editableMembers.map(item => ({
        id: item.id,
        userId: item.identityType === 'user' ? item.userId : undefined,
        deptId: item.identityType === 'dept' ? item.deptId : undefined,
        level: item.level,
      })),
    })
    toast.success('协作权限更新成功')
    uni.$emit('pms:kb:content:reload')
    navigateBackPlus()
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
