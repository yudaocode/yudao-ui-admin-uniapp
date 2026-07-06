<template>
  <view class="mt-24rpx bg-white">
    <!-- 成员标题 -->
    <view class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        班组成员
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openForm">
        添加成员
      </wd-button>
    </view>

    <!-- 成员列表 -->
    <view class="px-24rpx pb-8rpx">
      <wd-loading v-if="loading" />
      <view v-else-if="list.length === 0" class="py-48rpx text-center text-26rpx text-[#999]">
        暂无班组成员
      </view>
      <template v-else>
        <view
          v-for="item in list"
          :key="item.id || item.userId"
          class="mb-20rpx rounded-12rpx bg-[#f8fafc] p-20rpx"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.nickname || `用户 #${item.userId}` }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                用户编号：{{ item.userId }}
              </view>
            </view>
            <wd-button v-if="editable && item.id" size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
          <view class="text-26rpx text-[#666] space-y-8rpx">
            <view>手机号：{{ item.telephone || '-' }}</view>
            <view>备注：{{ item.remark || '-' }}</view>
          </view>
        </view>
      </template>
    </view>

    <!-- 添加成员弹层 -->
    <wd-popup v-model="formVisible" position="bottom" :safe-area-inset-bottom="true">
      <view class="max-h-[80vh] flex flex-col bg-white">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">
            添加成员
          </text>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <UserPicker
              v-model="formData.userId"
              label="用户"
              prop="userId"
              type="radio"
              placeholder="请选择用户"
            />
            <wd-form-item title="备注" title-width="180rpx" prop="remark">
              <wd-textarea
                v-model="formData.remark"
                placeholder="请输入备注"
                :maxlength="200"
                show-word-limit
                clearable
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="formLoading" @click="handleCreateMember">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalTeamMember } from '@/api/mes/cal/team/member'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref, watch } from 'vue'
import { createTeamMember, deleteTeamMember, getTeamMemberListByTeam } from '@/api/mes/cal/team/member'
import UserPicker from '@/components/system-select/user-picker.vue'
import { createFormSchema } from '@/utils/wot'

const props = withDefaults(defineProps<{
  teamId?: number
  editable?: boolean
}>(), {
  teamId: undefined,
  editable: false,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 成员加载状态
const list = ref<CalTeamMember[]>([]) // 成员列表
const formVisible = ref(false) // 表单弹层显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 添加表单引用
const formData = reactive<CalTeamMember>({
  teamId: undefined,
  userId: undefined,
  remark: undefined,
}) // 添加成员表单
const formSchema = createFormSchema({
  userId: [{ required: true, message: '用户不能为空' }],
})

/** 查询成员列表 */
async function getList() {
  if (!props.teamId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getTeamMemberListByTeam(props.teamId)
  } finally {
    loading.value = false
  }
}

/** 打开添加成员表单 */
function openForm() {
  if (!props.teamId) {
    toast.warning('请先保存班组后再添加成员')
    return
  }
  formData.teamId = props.teamId
  formData.userId = undefined
  formData.remark = undefined
  formRef.value?.reset()
  formVisible.value = true
}

/** 新增成员 */
async function handleCreateMember() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!formData.teamId || !formData.userId) {
    return
  }

  formLoading.value = true
  try {
    await createTeamMember(formData)
    toast.success('添加成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除成员 */
async function handleDelete(item: CalTeamMember) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要移除「${item.nickname || item.userId}」成员吗？`,
    })
  } catch {
    return
  }
  await deleteTeamMember(item.id)
  toast.success('删除成功')
  await getList()
}

/** 监听班组编号变化 */
watch(
  () => props.teamId,
  () => getList(),
  { immediate: true },
)
</script>
