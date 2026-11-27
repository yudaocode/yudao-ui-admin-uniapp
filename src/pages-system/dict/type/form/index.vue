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
          <wd-form-item title="字典名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入字典名称"
            />
          </wd-form-item>
          <wd-form-item title="字典类型" title-width="200rpx" prop="type">
            <wd-input
              v-model="formData.type"
              clearable
              :disabled="!!formData.id"
              placeholder="请输入字典类型"
            />
          </wd-form-item>
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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DictType } from '@/api/system/dict/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDictType, getDictType, updateDictType } from '@/api/system/dict/type'
import { getIntDictOptions } from '@/hooks/useDict'
import { useDictStore } from '@/store/dict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const dictStore = useDictStore()
const getTitle = computed(() => props.id ? '编辑字典类型' : '新增字典类型')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DictType>({
  id: undefined,
  name: '',
  type: '',
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '字典名称不能为空' }],
  type: [{ required: true, message: '字典类型不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dict/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDictType(props.id)
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
      await updateDictType(formData.value)
      toast.success('修改成功')
    } else {
      await createDictType(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:dict-type:reload')
    void dictStore.refreshDictCache() // 同步字典缓存，供 BPM 表单等页面使用最新字典
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
