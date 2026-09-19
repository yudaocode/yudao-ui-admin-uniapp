<template>
  <!-- 共享设置弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">共享设置</text>
        <wd-button size="small" type="primary" :disabled="loading" @click="openForm('create')">
          新增
        </wd-button>
      </view>

      <!-- 共享权限列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-16rpx rounded-12rpx bg-white p-24rpx"
          >
            <view class="mb-8rpx flex items-center justify-between">
              <text class="text-28rpx text-[#333] font-medium">{{ getSubjectName(item) }}</text>
              <wd-tag size="small">
                {{ getDictLabel(DICT_TYPE.OA_FILE_SUBJECT_TYPE, item.subjectType) }}
              </wd-tag>
            </view>
            <view class="text-24rpx text-[#666]">
              权限：{{ getDictLabel(DICT_TYPE.OA_FILE_PERMISSION_LEVEL, item.level) }} · 继承：{{ item.inherit ? '是' : '否' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              到期时间：{{ item.expireTime ? formatDateTime(item.expireTime) : '长期有效' }}
            </view>
            <view class="mt-12rpx flex gap-16rpx">
              <wd-button size="small" variant="plain" :disabled="loading" @click="openForm('update', item)">
                修改
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" :disabled="loading" @click="handleDelete(item.id!)">
                取消共享
              </wd-button>
            </view>
          </view>
          <view v-if="!loading && !list.length" class="py-60rpx text-center text-28rpx text-[#999]">
            暂无共享权限
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 新增、修改共享权限 -->
    <PermissionForm
      ref="permissionFormRef"
      v-model="formVisible"
      v-model:expire-time="expireTime"
      v-model:form-data="formData"
      :form-schema="formSchema"
      :loading="formLoading"
      @submit="handleSubmit"
    />
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FilePermission } from '@/api/oa/file'
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteFilePermission, getFilePermissionList, saveFilePermission } from '@/api/oa/file'
import { getSimpleDeptList } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_FILE_PERMISSION_LEVEL, OA_FILE_SUBJECT_TYPE } from '../../utils/constants'
import PermissionForm from './permission-form.vue'

const emit = defineEmits<{
  success: []
}>()
const dialog = useDialog()
const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 列表加载中
const nodeId = ref(0) // 文件节点编号
const list = ref<FilePermission[]>([]) // 共享权限列表
const userList = ref<User[]>([]) // 用户列表
const deptList = ref<Dept[]>([]) // 部门列表
const formVisible = ref(false) // 共享表单显示状态
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<FilePermission>>({}) // 共享表单数据
const expireTime = ref<number | ''>('') // 到期时间选择器值，空字符串承接长期有效
const formSchema = createFormSchema({
  subjectType: [{ required: true, message: '共享类型不能为空' }],
  subjectId: [{ required: true, message: '共享对象不能为空' }],
  level: [{ required: true, message: '权限不能为空' }],
}) // 表单校验规则
const permissionFormRef = ref<InstanceType<typeof PermissionForm>>() // 共享表单引用

/** 打开弹窗 */
async function open(id: number) {
  visible.value = true
  nodeId.value = id
  list.value = []
  loading.value = true
  try {
    const [permissions, users, depts] = await Promise.all([
      getFilePermissionList(id),
      getSimpleUserList(),
      getSimpleDeptList(),
    ])
    list.value = permissions
    userList.value = users
    deptList.value = depts
  } finally {
    loading.value = false
  }
}
defineExpose({ open })
/** 查询共享权限列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await getFilePermissionList(nodeId.value)
  } finally {
    loading.value = false
  }
}

/** 获得共享对象名称 */
function getSubjectName(row: FilePermission) {
  return row.subjectType === OA_FILE_SUBJECT_TYPE.USER
    ? userList.value.find(item => item.id === row.subjectId)?.nickname || '-'
    : deptList.value.find(item => item.id === row.subjectId)?.name || '-'
}

/** 打开新增、修改表单，修改时仅调整权限、继承和到期时间 */
function openForm(type: string, row?: FilePermission) {
  formData.value = row
    ? { ...row }
    : {
        nodeId: nodeId.value,
        subjectType: OA_FILE_SUBJECT_TYPE.USER,
        subjectId: undefined,
        level: OA_FILE_PERMISSION_LEVEL.READ,
        inherit: true,
      }
  expireTime.value = row?.expireTime ? toTimestamp(row.expireTime) : ''
  formVisible.value = true
}

/** 提交共享表单 */
async function handleSubmit() {
  const { valid } = await permissionFormRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    await saveFilePermission({
      ...formData.value,
      nodeId: nodeId.value,
      expireTime: expireTime.value === '' ? undefined : expireTime.value,
    } as FilePermission)
    toast.success(formData.value.id ? '修改成功' : '新增成功')
    formVisible.value = false
    await getList()
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 取消共享 */
async function handleDelete(id: number) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '是否取消该共享权限？',
    })
  } catch {
    return
  }
  loading.value = true
  try {
    await deleteFilePermission(id)
    toast.success('取消成功')
    await getList()
    emit('success')
  } finally {
    loading.value = false
  }
}
</script>
