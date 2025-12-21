<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文件配置详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="配置编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="配置名" :value="String(formData?.name ?? '-')" />
        <wd-cell title="存储器">
          <dict-tag :type="DICT_TYPE.INFRA_FILE_STORAGE" :value="formData?.storage" />
        </wd-cell>
        <wd-cell title="主配置">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData?.master" />
        </wd-cell>
        <wd-cell title="备注" :value="String(formData?.remark ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 存储配置详情 -->
      <wd-cell-group v-if="formData?.config" border title="存储配置">
        <!-- DB / Local / FTP / SFTP 配置 -->
        <template v-if="formData.storage && formData.storage >= 10 && formData.storage <= 12">
          <wd-cell title="基础路径" :value="String(formData.config.basePath ?? '-')" />
          <template v-if="formData.storage >= 11 && formData.storage <= 12">
            <wd-cell title="主机地址" :value="String(formData.config.host ?? '-')" />
            <wd-cell title="主机端口" :value="String(formData.config.port ?? '-')" />
            <wd-cell title="用户名" :value="String(formData.config.username ?? '-')" />
            <wd-cell title="密码" :value="String(formData.config.password ?? '-')" />
          </template>
          <wd-cell v-if="formData.storage === 11" title="连接模式" :value="formData.config.mode === 'Active' ? '主动模式' : '被动模式'" />
        </template>
        <!-- S3 配置 -->
        <template v-if="formData.storage === 20">
          <wd-cell title="节点地址" :value="String(formData.config.endpoint ?? '-')" />
          <wd-cell title="存储 bucket" :value="String(formData.config.bucket ?? '-')" />
          <wd-cell title="accessKey" :value="String(formData.config.accessKey ?? '-')" />
          <wd-cell title="accessSecret" :value="String(formData.config.accessSecret ?? '-')" />
          <wd-cell title="Path Style" :value="formData.config.enablePathStyleAccess ? '启用' : '禁用'" />
          <wd-cell title="公开访问" :value="formData.config.enablePublicAccess ? '公开' : '私有'" />
          <wd-cell title="区域" :value="String(formData.config.region ?? '-')" />
        </template>
        <!-- 通用配置 -->
        <wd-cell title="自定义域名" :value="String(formData.config.domain ?? '-')" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['infra:file-config:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:file-config:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FileConfig } from '@/api/infra/file-config'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteFileConfig, getFileConfig } from '@/api/infra/file-config'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const toast = useToast()
const formData = ref<FileConfig>()
const deleting = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/file/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getFileConfig(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-infra/file/config/form/index?id=${props.id}`,
  })
}

/** 删除 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该文件配置吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteFileConfig(props.id)
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
</style>
