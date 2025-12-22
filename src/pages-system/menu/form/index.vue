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
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <MenuPicker v-model="formData.parentId" />
          <wd-cell title="菜单类型" title-width="180rpx" prop="type">
            <wd-radio-group v-model="formData.type" shape="button" @change="handleTypeChange">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-input
            v-model="formData.name"
            label="菜单名称"
            label-width="180rpx"
            prop="name"
            clearable
            placeholder="请输入菜单名称"
          />
          <wd-input
            v-if="formData.type !== SystemMenuTypeEnum.BUTTON"
            v-model="formData.icon"
            label="菜单图标"
            label-width="180rpx"
            clearable
            placeholder="请输入菜单图标"
          />
          <wd-input
            v-if="formData.type !== SystemMenuTypeEnum.BUTTON"
            v-model="formData.path"
            label="路由地址"
            label-width="180rpx"
            prop="path"
            clearable
            placeholder="请输入路由地址"
          />
          <wd-input
            v-if="formData.type === SystemMenuTypeEnum.MENU"
            v-model="formData.component"
            label="组件路径"
            label-width="180rpx"
            clearable
            placeholder="例如：system/user/index"
          />
          <wd-input
            v-if="formData.type === SystemMenuTypeEnum.MENU"
            v-model="formData.componentName"
            label="组件名称"
            label-width="180rpx"
            clearable
            placeholder="例如：SystemUser"
          />
          <wd-input
            v-if="formData.type !== SystemMenuTypeEnum.DIR"
            v-model="formData.permission"
            label="权限标识"
            label-width="180rpx"
            clearable
            placeholder="请输入权限标识"
          />
          <wd-cell title="显示排序" title-width="180rpx" prop="sort" center>
            <wd-input-number
              v-model="formData.sort"
              :min="0"
            />
          </wd-cell>
          <wd-cell title="菜单状态" title-width="180rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-cell>
          <wd-cell v-if="formData.type !== SystemMenuTypeEnum.BUTTON" title="显示状态" title-width="180rpx" center>
            <wd-switch
              v-model="formData.visible"
              :active-value="true"
              :inactive-value="false"
            />
          </wd-cell>
          <wd-cell v-if="formData.type !== SystemMenuTypeEnum.BUTTON" title="总是显示" title-width="180rpx" center>
            <wd-switch
              v-model="formData.alwaysShow"
              :active-value="true"
              :inactive-value="false"
            />
          </wd-cell>
          <wd-cell v-if="formData.type === SystemMenuTypeEnum.MENU" title="缓存状态" title-width="180rpx" center>
            <wd-switch
              v-model="formData.keepAlive"
              :active-value="true"
              :inactive-value="false"
            />
          </wd-cell>
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
import type { Menu } from '@/api/system/menu'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createMenu, getMenu, updateMenu } from '@/api/system/menu'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, SystemMenuTypeEnum } from '@/utils/constants'
import MenuPicker from './components/menu-picker.vue'

const props = defineProps<{
  id?: number | any
  parentId?: number
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑菜单' : '新增菜单')
const formLoading = ref(false)
const formData = ref<Menu>({
  id: undefined,
  name: '',
  permission: '',
  type: SystemMenuTypeEnum.DIR,
  sort: 0,
  parentId: 0,
  path: '',
  icon: '',
  component: '',
  componentName: '',
  status: CommonStatusEnum.ENABLE,
  visible: true,
  keepAlive: true,
  alwaysShow: true,
})
const formRules = {
  name: [{ required: true, message: '菜单名称不能为空' }],
  type: [{ required: true, message: '菜单类型不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/menu/index')
}

/** 菜单类型变更： */
function handleTypeChange() {
  // 切换类型时，清空不需要的字段
  if (formData.value.type === SystemMenuTypeEnum.BUTTON) {
    formData.value.path = ''
    formData.value.component = ''
    formData.value.componentName = ''
    formData.value.icon = ''
  } else if (formData.value.type === SystemMenuTypeEnum.DIR) {
    formData.value.component = ''
    formData.value.componentName = ''
    formData.value.permission = ''
  }
}

/** 加载菜单详情 */
async function getDetail() {
  if (!props.id) {
    // 新增时，设置默认的上级菜单
    if (props.parentId) {
      formData.value.parentId = props.parentId
    }
    return
  }
  formData.value = await getMenu(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 路由地址校验
  if (formData.value.type !== SystemMenuTypeEnum.BUTTON) {
    const path = formData.value.path
    const isExternal = /^(?:https?:|mailto:|tel:)/.test(path)
    if (!isExternal) {
      if (formData.value.parentId === 0 && path.charAt(0) !== '/') {
        toast.error('路径必须以 / 开头')
        return
      } else if (formData.value.parentId !== 0 && path.charAt(0) === '/') {
        toast.error('路径不能以 / 开头')
        return
      }
    }
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateMenu(formData.value)
      toast.success('修改成功')
    } else {
      await createMenu(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
