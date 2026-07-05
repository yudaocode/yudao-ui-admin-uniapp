<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="车间编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" :disabled="!!props.id" clearable>
              <template v-if="!props.id" #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="车间名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入车间名称" clearable />
          </wd-form-item>
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number
              :model-value="formData.area ?? ''"
              allow-null
              :min="0"
              :precision="2"
              @update:model-value="value => formData.area = toFiniteNumber(value)"
            />
          </wd-form-item>
          <UserPicker v-model="formData.chargeUserId" label="负责人" label-width="220rpx" type="radio" placeholder="请选择负责人" />
          <yd-form-picker
            v-model="formData.status"
            label="状态"
            label-width="220rpx"
            prop="status"
            :dict-type="DICT_TYPE.COMMON_STATUS"
            placeholder="请选择状态"
          />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdWorkshop } from '@/api/mes/md/workstation/workshop'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWorkshop, getWorkshop, updateWorkshop } from '@/api/mes/md/workstation/workshop'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import UserPicker from '@/components/system-select/user-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑车间' : '新增车间')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<MdWorkshop>({
  id: undefined,
  code: '',
  name: '',
  area: undefined,
  chargeUserId: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '车间编码不能为空' }],
  name: [{ required: true, message: '车间名称不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/workshop/index')
}

/** 加载车间详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getWorkshop(Number(props.id))
}

/** 生成车间编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode('MD_WORKSHOP_CODE')
    toast.success('生成成功')
  } finally {
    codeLoading.value = false
  }
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
      await updateWorkshop(formData.value)
      toast.success('修改成功')
    } else {
      await createWorkshop(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:workshop:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getDetail()
})
</script>
