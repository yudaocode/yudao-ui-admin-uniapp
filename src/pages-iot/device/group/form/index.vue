<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="分组名字" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入分组名字" clearable />
          </wd-form-item>
          <wd-form-item title="分组状态" title-width="200rpx" center prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :name="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="分组描述" title-width="200rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入分组描述" :maxlength="200" show-word-limit />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DeviceGroup } from '@/api/iot/device/group'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDeviceGroup, getDeviceGroup, updateDeviceGroup } from '@/api/iot/device/group'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑设备分组' : '新增设备分组')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DeviceGroup>({ id: undefined, name: '', status: CommonStatusEnum.ENABLE, description: '' }) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '分组名字不能为空' }],
  status: [{ required: true, message: '分组状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/device/group/index')
}

/** 加载设备分组详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDeviceGroup(Number(props.id))
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
      await updateDeviceGroup(formData.value)
      toast.success('修改成功')
    } else {
      await createDeviceGroup(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('iot:device-group:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
