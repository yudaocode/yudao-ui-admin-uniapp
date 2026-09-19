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
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="bg-white p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formData.id ? '修改共享' : '新增共享' }}
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <yd-form-picker
              v-model="formData.subjectType"
              label="共享类型"
              label-width="180rpx"
              prop="subjectType"
              :dict-type="DICT_TYPE.OA_FILE_SUBJECT_TYPE"
              placeholder="请选择共享类型"
              :disabled="!!formData.id"
              @confirm="formData.subjectId = undefined"
            />
            <UserFormPicker
              v-if="formData.subjectType === OA_FILE_SUBJECT_TYPE.USER"
              v-model="formData.subjectId"
              label="共享对象"
              label-width="180rpx"
              prop="subjectId"
              :disabled="!!formData.id"
            />
            <DeptFormPicker
              v-else
              v-model="formData.subjectId"
              label="共享对象"
              label-width="180rpx"
              prop="subjectId"
              :disabled="!!formData.id"
            />
            <yd-form-picker
              v-model="formData.level"
              label="权限"
              label-width="180rpx"
              prop="level"
              :dict-type="DICT_TYPE.OA_FILE_PERMISSION_LEVEL"
              placeholder="请选择权限"
            />
            <wd-form-item title="继承权限" title-width="180rpx" prop="inherit" center>
              <wd-switch v-model="formData.inherit" />
            </wd-form-item>
            <wd-form-item title="到期时间" title-width="180rpx" prop="expireTime">
              <view class="flex items-center justify-end gap-12rpx" @click="expireTimeVisible = true">
                <text class="text-28rpx" :class="expireTime === '' ? 'text-[#999]' : 'text-[#333]'">
                  {{ expireTime === '' ? '不填则长期有效' : formatDateTime(expireTime) }}
                </text>
                <text v-if="expireTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="expireTime = ''">
                  清除
                </text>
              </view>
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-24rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="formVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
            确定
          </wd-button>
        </view>
      </view>
      <wd-datetime-picker v-model="expireTime" v-model:visible="expireTimeVisible" type="datetime" title="到期时间" />
    </wd-popup>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { FilePermission } from '@/api/oa/file'
import type { Dept } from '@/api/system/dept'
import type { User } from '@/api/system/user'
import { ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteFilePermission, getFilePermissionList, saveFilePermission } from '@/api/oa/file'
import { getSimpleDeptList } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { DeptFormPicker, UserFormPicker } from '@/components/system-select'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_FILE_PERMISSION_LEVEL, OA_FILE_SUBJECT_TYPE } from '../../utils/constants'

const emit = defineEmits<{
  success: []
}>() // 定义 success 事件，用于操作成功后的回调

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
const expireTimeVisible = ref(false) // 到期时间选择器显示状态
const formSchema = createFormSchema({ // 表单校验规则
  subjectType: [{ required: true, message: '共享类型不能为空' }],
  subjectId: [{ required: true, message: '共享对象不能为空' }],
  level: [{ required: true, message: '权限不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

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
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

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
  const { valid } = await formRef.value.validate()
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
