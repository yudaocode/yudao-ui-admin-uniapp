<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 安灯呼叫设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无安灯配置"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
                {{ item.reason || '-' }}
              </view>
              <dict-tag v-if="item.level != null" :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="item.level" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>处置角色：{{ item.handlerRoleName || '-' }}</view>
              <view>处置人：{{ item.handlerUserNickname || '-' }}</view>
              <view>备注：{{ item.remark || '-' }}</view>
              <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
            </view>
          </view>
          <view
            v-if="hasAccessByCodes(['mes:pro-andon-config:update']) || hasAccessByCodes(['mes:pro-andon-config:delete'])"
            class="flex gap-16rpx border-t border-[#f0f0f0] px-24rpx py-16rpx"
            @click.stop
          >
            <wd-button v-if="hasAccessByCodes(['mes:pro-andon-config:update'])" class="flex-1" size="small" type="warning" variant="plain" @click="handleEdit(item)">
              编辑
            </wd-button>
            <wd-button v-if="hasAccessByCodes(['mes:pro-andon-config:delete'])" class="flex-1" size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="hasAccessByCodes(['mes:pro-andon-config:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />

    <!-- 新增编辑弹层 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 82vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="handleCancelForm">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formData.id ? '编辑配置' : '新增配置' }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <view class="my-24rpx px-24rpx text-28rpx text-[#333] font-semibold">
              呼叫规则
            </view>
            <wd-cell-group border>
              <wd-form-item title="呼叫原因" title-width="220rpx" prop="reason">
                <wd-textarea
                  v-model="formData.reason"
                  placeholder="请输入呼叫原因"
                  :maxlength="200"
                  show-word-limit
                  clearable
                />
              </wd-form-item>
              <yd-form-picker v-model="formData.level" label="级别" label-width="220rpx" prop="level" :columns="levelOptions" placeholder="请选择级别" />
              <yd-form-picker
                v-model="formData.handlerRoleId"
                label="处置角色"
                label-width="220rpx"
                prop="handlerRoleId"
                :columns="roleOptions"
                label-key="name"
                value-key="id"
                placeholder="请选择处置角色"
              />
              <UserPicker
                v-model="formData.handlerUserId"
                label="处置人"
                label-width="220rpx"
                prop="handlerUserId"
                type="radio"
                placeholder="请选择处置人"
                @confirm="handleUserConfirm"
              />
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-input v-model="formData.remark" placeholder="请输入备注" clearable />
              </wd-form-item>
            </wd-cell-group>

            <view class="mx-24rpx mt-20rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-24rpx text-[#ad6800]">
              处置角色和处置人至少选择一个；保存前会再次确认，避免误维护安灯处置规则。
            </view>
          </wd-form>
          <view class="h-80rpx" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProAndonConfig } from '@/api/mes/pro/andon/config'
import type { Role } from '@/api/system/role'
import type { User } from '@/api/system/user'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createAndonConfig, deleteAndonConfig, getAndonConfigPage, updateAndonConfig } from '@/api/mes/pro/andon/config'
import { getSimpleRoleList } from '@/api/system/role'
import { useAccess } from '@/hooks/useAccess'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { MesProAndonLevelEnum } from '@/utils/constants/biz-mes-enum'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

interface ZPagingRef<T> {
  reload: () => void
  completeByTotal: (data: T[], total: number) => void
  complete: (success: boolean) => void
}

type AndonConfigFormData = ProAndonConfig

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProAndonConfig[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<ProAndonConfig>>() // 分页组件引用
const formRef = ref<FormInstance>() // 表单组件引用
const formVisible = ref(false) // 表单弹层
const formLoading = ref(false) // 表单提交状态
const roleOptions = ref<Role[]>([]) // 角色列表
const selectedUser = ref<User>() // 当前选择用户
const formData = ref<AndonConfigFormData>(getDefaultFormData()) // 表单数据
const levelOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_PRO_ANDON_LEVEL))
const formSchema = createFormSchema({
  reason: [{ required: true, message: '呼叫原因不能为空' }],
  level: [{ required: true, message: '级别不能为空' }],
  handlerRoleId: [{
    validator: () => Boolean(formData.value.handlerRoleId || formData.value.handlerUserId),
    message: '处置角色和处置人至少选择一个',
  }],
  handlerUserId: [{
    validator: () => Boolean(formData.value.handlerRoleId || formData.value.handlerUserId),
    message: '处置角色和处置人至少选择一个',
  }],
})

/** 默认表单数据 */
function getDefaultFormData(): AndonConfigFormData {
  return {
    reason: '',
    level: MesProAndonLevelEnum.LEVEL3,
    handlerRoleId: null,
    handlerUserId: null,
    remark: null,
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/andon/record/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  const params = {
    pageNo,
    pageSize,
  }
  try {
    const data = await getAndonConfigPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 新增配置 */
function handleAdd() {
  formData.value = getDefaultFormData()
  selectedUser.value = undefined
  formVisible.value = true
}

/** 编辑配置 */
function handleEdit(item: ProAndonConfig) {
  formData.value = { ...item }
  selectedUser.value = undefined
  formVisible.value = true
}

/** 取消表单 */
function handleCancelForm() {
  formVisible.value = false
}

/** 选择处置人 */
function handleUserConfirm(users: User[]) {
  selectedUser.value = users[0]
  formData.value.handlerUserNickname = users[0]?.nickname
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: formData.value.id ? '确定要保存该安灯配置吗？' : '确定要新增该安灯配置吗？',
    })
  } catch {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateAndonConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createAndonConfig(formData.value)
      toast.success('新增成功')
    }
    formVisible.value = false
    pagingRef.value?.reload()
  } finally {
    formLoading.value = false
  }
}

/** 删除配置 */
async function handleDelete(item: ProAndonConfig) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.reason || item.id}」安灯配置吗？` })
  } catch {
    return
  }
  await deleteAndonConfig(item.id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 初始化角色 */
async function loadRoleOptions() {
  roleOptions.value = await getSimpleRoleList()
}

/** 初始化 */
onMounted(() => {
  loadRoleOptions()
})
</script>
