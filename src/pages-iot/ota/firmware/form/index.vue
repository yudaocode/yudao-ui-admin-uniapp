<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="固件名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入固件名称" clearable />
          </wd-form-item>
          <wd-form-item title="固件描述" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入固件描述" :maxlength="500" show-word-limit />
          </wd-form-item>
          <ProductFormPicker v-if="!editId" v-model="formData.productId" label="所属产品" label-width="220rpx" prop="productId" />
          <wd-cell v-else title="所属产品" :value="formData.productName || String(formData.productId || '-')" />
          <wd-form-item v-if="!editId" title="版本号" title-width="220rpx" prop="version">
            <wd-input v-model="formData.version" placeholder="请输入版本号" clearable />
          </wd-form-item>
          <wd-cell v-else title="版本号" :value="formData.version || '-'" />
          <wd-form-item v-if="!editId" title="固件文件" title-width="220rpx" prop="fileUrl">
            <yd-upload-file
              v-model="formData.fileUrl"
              directory="iot/ota"
              :limit="1"
              :file-size="50"
              :file-type="['bin', 'zip', 'pdf']"
            />
          </wd-form-item>
          <wd-cell v-else title="固件文件" :value="formData.fileUrl || '-'" />
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
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createOtaFirmware, getOtaFirmware, updateOtaFirmware } from '@/api/iot/ota/firmware'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import ProductFormPicker from '@/pages-iot/product/product/components/product-form-picker.vue'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const editId = computed(() => props.id ? Number(props.id) : undefined)
const getTitle = computed(() => editId.value ? '编辑固件' : '新增固件')
const formLoading = ref(false) // 表单提交状态
const formData = ref<OtaFirmware>({
  id: undefined,
  name: '',
  description: '',
  productId: undefined,
  version: '',
  fileUrl: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '固件名称不能为空' }],
  productId: [{ required: () => !editId.value, message: '所属产品不能为空' }],
  version: [{ required: () => !editId.value, message: '版本号不能为空' }],
  fileUrl: [{ required: () => !editId.value, message: '固件文件不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-iot/ota/firmware/index')
}

/** 加载固件详情 */
async function getDetail() {
  if (!editId.value) {
    return
  }
  formData.value = await getOtaFirmware(editId.value)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (editId.value) {
      await updateOtaFirmware({
        id: editId.value,
        name: formData.value.name,
        description: formData.value.description,
      })
      toast.success('修改成功')
    } else {
      await createOtaFirmware({
        name: formData.value.name,
        description: formData.value.description,
        productId: formData.value.productId,
        version: formData.value.version,
        fileUrl: formData.value.fileUrl,
      })
      toast.success('新增成功')
    }
    uni.$emit('iot:ota-firmware:reload')
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
