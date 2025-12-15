<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="菜单详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="p-24rpx pb-200rpx">
      <wd-cell-group custom-class="cell-group" border>
        <wd-cell title="菜单名称" :value="formData?.name || '-'" />
        <wd-cell title="菜单类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_MENU_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="上级菜单" :value="parentMenuName" />
        <wd-cell title="显示排序" :value="String(formData?.sort ?? '-')" />
        <wd-cell title="路由地址" :value="formData?.path || '-'" />
        <wd-cell v-if="formData?.type === SystemMenuTypeEnum.MENU" title="组件路径" :value="formData?.component || '-'" />
        <wd-cell v-if="formData?.type === SystemMenuTypeEnum.MENU" title="组件名称" :value="formData?.componentName || '-'" />
        <wd-cell v-if="formData?.type !== SystemMenuTypeEnum.DIR" title="权限标识" :value="formData?.permission || '-'" />
        <wd-cell title="菜单状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell v-if="formData?.type !== SystemMenuTypeEnum.BUTTON" title="显示状态">
          <wd-tag v-if="formData?.visible" type="success" plain>
            显示
          </wd-tag>
          <wd-tag v-else type="warning" plain>
            隐藏
          </wd-tag>
        </wd-cell>
        <wd-cell v-if="formData?.type === SystemMenuTypeEnum.MENU" title="缓存状态">
          <wd-tag v-if="formData?.keepAlive" type="success" plain>
            缓存
          </wd-tag>
          <wd-tag v-else type="default" plain>
            不缓存
          </wd-tag>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="safe-area-inset-bottom fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button class="flex-1" type="error" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Menu } from '@/api/system/menu'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteMenu, getMenu, getSimpleMenuList } from '@/api/system/menu'
import { DICT_TYPE, SystemMenuTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id: number
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<Menu>() // 详情数据
const deleting = ref(false) // 删除中
const parentMenuName = ref('-') // 上级菜单名称

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 加载菜单详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMenu(props.id)
  // 获取上级菜单名称
  if (formData.value?.parentId === 0) {
    parentMenuName.value = '主类目'
  } else if (formData.value?.parentId) {
    // TODO @芋艿：后续这里可以优化，由后端返回 menuName；
    const menuList = await getSimpleMenuList()
    const parent = menuList.find(item => item.id === formData.value?.parentId)
    parentMenuName.value = parent?.name || '-'
  }
}

/** 编辑菜单 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/menu/form/index?id=${props.id}`,
  })
}

/** 删除菜单 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该菜单吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteMenu(props.id)
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
:deep(.cell-group) {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}

.safe-area-inset-bottom {
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
