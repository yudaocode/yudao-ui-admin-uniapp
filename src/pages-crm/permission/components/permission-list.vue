<template>
  <view :class="embedded ? '' : 'mt-24rpx'">
    <!-- 团队成员（嵌入模式由外层底部操作触发新增/退出） -->
    <view v-if="!embedded" class="mb-16rpx flex items-center justify-between px-24rpx">
      <text class="text-30rpx text-[#333] font-semibold">团队成员</text>
      <view class="flex gap-12rpx">
        <wd-button v-if="canQuitTeam" size="small" type="danger" variant="plain" @click="handleQuit">
          退出
        </wd-button>
        <wd-button v-if="showAction && validateOwnerUser" size="small" type="primary" @click="handleAdd">
          新增
        </wd-button>
      </view>
    </view>
    <view class="p-24rpx pb-160rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <text class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
            {{ item.nickname || '-' }}
          </text>
          <dict-tag :type="DICT_TYPE.CRM_PERMISSION_LEVEL" :value="item.level" />
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          部门：{{ item.deptName || '-' }}
        </view>
        <view class="mb-12rpx text-26rpx text-[#666]">
          岗位：{{ item.postNames?.length ? item.postNames.join('、') : '-' }}
        </view>
        <view class="mb-16rpx text-26rpx text-[#999]">
          加入时间：{{ formatDateTime(item.createTime) || '-' }}
        </view>
        <view v-if="showAction && validateOwnerUser && item.level !== PermissionLevelEnum.OWNER" class="flex justify-end gap-12rpx">
          <wd-button size="small" type="primary" variant="plain" @click="handleEdit(item)">
            编辑
          </wd-button>
          <wd-button
            size="small"
            type="danger"
            variant="plain"
            :loading="deletingId === item.id"
            @click="handleDelete(item)"
          >
            移除
          </wd-button>
        </view>
      </view>
      <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无团队成员" />
      <view v-if="loading" class="p-24rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>
    </view>

    <!-- 成员表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="max-h-[80vh] overflow-y-auto bg-white pb-32rpx">
        <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-24rpx">
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formMode === 'create' ? '新增团队成员' : '编辑团队成员' }}
          </view>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <UserFormPicker
              v-if="formMode === 'create'"
              v-model="formData.userId"
              label="选择人员"
              label-width="220rpx"
              prop="userId"
              placeholder="请选择人员"
            />
            <wd-form-item title="权限级别" title-width="220rpx" prop="level" center>
              <wd-radio-group v-model="formData.level" type="button">
                <wd-radio
                  v-for="dict in permissionLevelOptions"
                  :key="dict.value"
                  :value="dict.value"
                >
                  {{ dict.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item
              v-if="formMode === 'create' && bizType === BizTypeEnum.CRM_CUSTOMER"
              title="同时添加至"
              title-width="220rpx"
              center
            >
              <wd-checkbox-group v-model="formData.toBizTypes" type="button">
                <wd-checkbox :name="BizTypeEnum.CRM_CONTACT">
                  联系人
                </wd-checkbox>
                <wd-checkbox :name="BizTypeEnum.CRM_BUSINESS">
                  商机
                </wd-checkbox>
                <wd-checkbox :name="BizTypeEnum.CRM_CONTRACT">
                  合同
                </wd-checkbox>
              </wd-checkbox-group>
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="p-24rpx">
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
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Permission } from '@/api/crm/permission'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  BizTypeEnum,
  createPermission,
  deletePermissionBatch,
  deleteSelfPermission,
  getPermissionList,
  PermissionLevelEnum,
  updatePermission,
} from '@/api/crm/permission'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { useUserStore } from '@/store/user'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = withDefaults(defineProps<{
  bizId: number
  bizType: number
  showAction?: boolean
  embedded?: boolean // 嵌入模式：隐藏头部，由外层底部操作触发新增/退出
}>(), {
  showAction: true,
  embedded: false,
})

const emit = defineEmits<{
  quitTeam: []
  canQuitChange: [boolean]
}>()

const dialog = useDialog()
const toast = useToast()
const userStore = useUserStore()
const loading = ref(false) // 成员加载状态
const list = ref<Permission[]>([]) // 团队成员
const deletingId = ref<number>() // 删除状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formMode = ref<'create' | 'update'>('create') // 表单模式
const formData = ref<Permission>({
  bizId: props.bizId,
  bizType: props.bizType,
  userId: undefined as unknown as number,
  level: PermissionLevelEnum.READ,
  toBizTypes: [],
}) // 表单数据
const permissionLevelOptions = computed(() => {
  return getIntDictOptions(DICT_TYPE.CRM_PERMISSION_LEVEL).filter(item => item.value !== PermissionLevelEnum.OWNER)
})
const canQuitTeam = computed(() => {
  const currentUserId = userStore.userInfo.userId
  return list.value.some(item => item.userId === currentUserId && item.level !== PermissionLevelEnum.OWNER)
})
const isPool = computed(() => !list.value.some(item => item.level === PermissionLevelEnum.OWNER)) // 是否公海数据
const validateOwnerUser = computed(() => {
  const currentUserId = userStore.userInfo.userId
  return list.value.some(item => item.userId === currentUserId && item.level === PermissionLevelEnum.OWNER)
}) // 负责人权限
const validateWrite = computed(() => {
  const currentUserId = userStore.userInfo.userId
  return list.value.some((item) => {
    return item.userId === currentUserId && [PermissionLevelEnum.OWNER, PermissionLevelEnum.WRITE].includes(item.level)
  })
}) // 编辑权限
const formSchema = createFormSchema({
  userId: [{ required: () => formMode.value === 'create', message: '人员不能为空' }],
  level: [{ required: true, message: '权限级别不能为空' }],
})

/** 加载团队成员 */
async function getList() {
  if (!props.bizId || !props.bizType) {
    return
  }
  loading.value = true
  try {
    list.value = await getPermissionList({
      bizId: props.bizId,
      bizType: props.bizType,
    })
  } finally {
    loading.value = false
  }
}

/** 新增团队成员 */
function handleAdd() {
  if (!validateOwnerUser.value) {
    toast.show('暂无操作权限')
    return
  }
  formMode.value = 'create'
  formData.value = {
    bizId: props.bizId,
    bizType: props.bizType,
    userId: undefined as unknown as number,
    level: PermissionLevelEnum.READ,
    toBizTypes: [],
  }
  formVisible.value = true
}

/** 编辑团队成员 */
function handleEdit(item: Permission) {
  if (!validateOwnerUser.value) {
    toast.show('暂无操作权限')
    return
  }
  formMode.value = 'update'
  formData.value = {
    ...item,
    ids: item.id ? [item.id] : [],
  }
  formVisible.value = true
}

/** 移除团队成员 */
async function handleDelete(item: Permission) {
  if (!validateOwnerUser.value) {
    toast.show('暂无操作权限')
    return
  }
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要移除该团队成员吗？',
    })
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    await deletePermissionBatch([item.id])
    toast.success('移除成功')
    await getList()
  } finally {
    deletingId.value = undefined
  }
}

/** 退出团队 */
async function handleQuit() {
  const currentUserId = userStore.userInfo.userId
  const permission = list.value.find(item => item.userId === currentUserId)
  if (!permission?.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要退出该团队吗？',
    })
  } catch {
    return
  }
  await deleteSelfPermission(permission.id)
  toast.success('退出成功')
  emit('quitTeam')
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formMode.value === 'create') {
      await createPermission({ ...formData.value })
      toast.success('新增成功')
    } else {
      await updatePermission({
        ids: formData.value.ids,
        bizId: props.bizId,
        bizType: props.bizType,
        level: formData.value.level,
      })
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

watch(
  () => [props.bizType, props.bizId],
  () => {
    getList()
  },
)

// 同步「可退出团队」状态，供外层底部操作显示退出按钮
watch(canQuitTeam, value => emit('canQuitChange', value), { immediate: true })

defineExpose({
  getList,
  openAdd: handleAdd,
  quit: handleQuit,
  isPool,
  validateOwnerUser,
  validateWrite,
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
