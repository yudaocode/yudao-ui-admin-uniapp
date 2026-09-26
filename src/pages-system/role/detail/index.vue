<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="角色详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="角色名称" :value="formData?.name || '-'" />
        <wd-cell title="角色标识" :value="formData?.code || '-'" />
        <wd-cell title="显示顺序" :value="formData?.sort" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="formData?.type === SystemRoleTypeEnum.CUSTOM && hasAccessByCodes(['system:role:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="formData?.type === SystemRoleTypeEnum.CUSTOM && hasAccessByCodes(['system:role:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
        <wd-button
          v-if="hasMoreActions"
          class="flex-1" type="info" @click="moreActionVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 更多操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
    <!-- 菜单权限弹窗 -->
    <MenuPermissionForm v-model="menuPermissionVisible" :role="formData" @success="getDetail" />
    <!-- 数据权限弹窗 -->
    <DataPermissionForm v-model="dataPermissionVisible" :role="formData" @success="getDetail" />
  </view>
</template>

<script lang="ts" setup>
import type { Role } from '@/api/system/role'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { deleteRole, getRole } from '@/api/system/role'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, SystemRoleTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import DataPermissionForm from './components/data-permission-form.vue'
import MenuPermissionForm from './components/menu-permission-form.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Role>() // 详情数据
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 更多操作菜单
const menuPermissionVisible = ref(false) // 菜单权限弹窗
const dataPermissionVisible = ref(false) // 数据权限弹窗
const moreActions = computed(() => {
  const actions: Array<{ name: string, value: string }> = []
  // 分配菜单权限
  if (hasAccessByCodes(['system:permission:assign-role-menu'])) {
    actions.push({ name: '菜单权限', value: 'assignMenu' })
  }
  // 分配数据权限
  if (hasAccessByCodes(['system:permission:assign-role-data-scope'])) {
    actions.push({ name: '数据权限', value: 'assignDataScope' })
  }
  return actions
})
const hasMoreActions = computed(() => !!formData.value?.id && moreActions.value.length > 0)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/role/index')
}

/** 加载角色详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getRole(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑角色 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/role/form/index?id=${props.id}`,
  })
}

/** 删除角色 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该角色吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteRole(props.id)
    toast.success('删除成功')
    uni.$emit('system:role:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 更多操作 */
function handleMoreAction({ item }: { item: { value: string } }) {
  if (item.value === 'assignMenu') {
    menuPermissionVisible.value = true
  } else if (item.value === 'assignDataScope') {
    dataPermissionVisible.value = true
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:role:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('system:role:reload', getDetail)
})
</script>
