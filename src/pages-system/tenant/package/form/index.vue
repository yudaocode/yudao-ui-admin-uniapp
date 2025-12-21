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
          <wd-input
            v-model="formData.name"
            label="套餐名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入套餐名称"
          />
          <wd-cell title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            prop="remark"
            clearable
            placeholder="请输入备注"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { TenantPackage } from '@/api/system/tenant/package'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createTenantPackage, getTenantPackage, updateTenantPackage } from '@/api/system/tenant/package'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'

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
const formLoading = ref(false)
const formData = ref<TenantPackage>({
  id: undefined,
  name: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
  menuIds: [],
})
const formRules = {
  name: [{ required: true, message: '套餐名称不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

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
    if (props.id) {
      await updateTenantPackage(formData.value)
      toast.success('修改成功')
    } else {
      await createTenantPackage(formData.value)
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
// TODO @芋艿：这里有个租户套餐的设置；只支持 pc 操作；
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
