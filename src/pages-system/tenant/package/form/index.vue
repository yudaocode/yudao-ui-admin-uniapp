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
          <wd-form-item title="套餐名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入套餐名称"
            />
          </wd-form-item>
          <yd-tree-select
            ref="menuTreeRef"
            v-model="formData.menuIds"
            label="菜单权限"
            title="菜单权限"
            prop="menuIds"
            label-width="200rpx"
            placeholder="请选择菜单权限"
            :data="menuOptions"
            :props="menuTreeProps"
            :check-strictly="false"
            show-checkbox
            show-toolbar
            filterable
          />
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
            />
          </wd-form-item>
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
import { isIdType, parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Menu } from '@/api/system/menu'
import type { TenantPackage } from '@/api/system/tenant/package'
import type YdTreeSelect from '@/components/yudao-ui/yd-tree-select/yd-tree-select.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSimpleMenuList } from '@/api/system/menu'
import { createTenantPackage, getTenantPackage, updateTenantPackage } from '@/api/system/tenant/package'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑租户套餐' : '新增租户套餐')
const formLoading = ref(false) // 表单提交状态
const formData = ref<TenantPackage>({
  id: undefined,
  name: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
  menuIds: [],
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '套餐名称不能为空' }],
  menuIds: [{ required: true, message: '菜单权限不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const menuTreeRef = ref<InstanceType<typeof YdTreeSelect>>() // 菜单树组件引用
const menuOptions = ref<Menu[]>([]) // 菜单树形结构
const menuTreeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/tenant/index')
}

/** 加载租户套餐详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getTenantPackage(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const checkedKeys = menuTreeRef.value?.getCheckedKeys(false) || formData.value.menuIds // 获得当前选中节点
    const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || [] // 获得半选中的父节点
    const data = {
      ...formData.value,
      menuIds: Array.from(new Set([...checkedKeys, ...halfCheckedKeys])).map(parseId).filter(isIdType),
    }
    if (props.id) {
      await updateTenantPackage(data)
      toast.success('修改成功')
    } else {
      await createTenantPackage(data)
      toast.success('新增成功')
    }
    uni.$emit('system:tenant-package:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  // 加载菜单树，便于编辑页回显权限名称
  menuOptions.value = handleTree(await getSimpleMenuList())
  // 加载详情数据
  await getDetail()
})
</script>
