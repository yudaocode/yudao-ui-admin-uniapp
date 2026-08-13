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
          <wd-form-item title="摘要内容" title-width="180rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入摘要内容"
              :maxlength="500"
              show-word-limit
            />
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
import type { Digest } from '@/api/fms/config/digest'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createDigest,
  getDigestList,
  updateDigest,
} from '@/api/fms/config/digest'
import { useFmsStore } from '@/pages-fms/store/fms'
import { delay, navigateBackPlus } from '@/utils'
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
const fmsStore = useFmsStore()
const getTitle = computed(() => props.id ? '编辑摘要' : '新增摘要')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Digest>({ // 表单数据
  id: undefined,
  accountSetId: 0,
  content: '',
})
const formSchema = createFormSchema({
  content: [{ required: true, message: '摘要内容不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/digest/index')
}

/** 加载摘要详情（摘要库无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getDigestList(accountSetId)
  const digest = list.find(item => item.id === Number(props.id))
  if (digest) {
    formData.value = digest
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
      await updateDigest(formData.value)
      toast.success('修改成功')
    } else {
      await createDigest(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('fms:config:digest:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  formData.value.accountSetId = fmsStore.accountSet?.id || 0
  await getDetail()
})
</script>
