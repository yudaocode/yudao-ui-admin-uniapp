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
          <ModelFormPicker v-model="formData.modelId" label="绑定模型" label-width="210rpx" prop="modelId" placeholder="请选择模型" :model-type="AiModelTypeEnum.CHAT" />
          <wd-form-item title="角色名称" title-width="210rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入角色名称" />
          </wd-form-item>
          <wd-form-item title="头像" title-width="210rpx" prop="avatar">
            <yd-upload-img v-model="formData.avatar" directory="ai/chat-role" />
          </wd-form-item>
          <wd-form-item title="角色类别" title-width="210rpx" prop="category">
            <wd-input v-model="formData.category" clearable placeholder="请输入角色类别" />
          </wd-form-item>
          <wd-form-item title="角色描述" title-width="210rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入角色描述" clearable />
          </wd-form-item>
          <wd-form-item title="角色设定" title-width="210rpx" prop="systemMessage">
            <wd-textarea v-model="formData.systemMessage" placeholder="请输入角色设定" clearable />
          </wd-form-item>
          <KnowledgeFormPicker v-model="formData.knowledgeIds" label="引用知识库" label-width="210rpx" type="checkbox" filterable />
          <ToolFormPicker v-model="formData.toolIds" label="引用工具" label-width="210rpx" type="checkbox" filterable />
          <yd-form-picker
            v-model="formData.mcpClientNames"
            label="引用 MCP"
            label-width="210rpx"
            :dict-type="DICT_TYPE.AI_MCP_CLIENT_NAME"
            dict-kind="str"
            type="checkbox"
            filterable
            placeholder="请选择 MCP"
          />
          <wd-form-item title="是否公开" title-width="210rpx" prop="publicStatus" center>
            <wd-switch v-model="formData.publicStatus" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="210rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="210rpx" prop="status" center>
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
import type { ChatRoleVO } from '@/api/ai/model/chatRole'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createChatRole, getChatRole, updateChatRole } from '@/api/ai/model/chatRole'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { AiModelTypeEnum, CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import KnowledgeFormPicker from '@/pages-ai/knowledge/components/knowledge-form-picker.vue'
import ModelFormPicker from '../../model/components/model-form-picker.vue'
import ToolFormPicker from '../../tool/components/tool-form-picker.vue'

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
const getTitle = computed(() => props.id ? '编辑聊天角色' : '新增聊天角色')
const formLoading = ref(false) // 表单提交状态
const formData = ref<ChatRoleVO>({
  modelId: undefined,
  name: '',
  avatar: '',
  category: '',
  sort: 0,
  description: '',
  systemMessage: '',
  publicStatus: true,
  status: CommonStatusEnum.ENABLE,
  knowledgeIds: [],
  toolIds: [],
  mcpClientNames: [],
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '角色名称不能为空' }],
  avatar: [
    { required: true, message: '角色头像不能为空' },
    { pattern: /^https?:\/\//, message: '角色头像必须是 URL 格式' },
  ],
  category: [{ required: true, message: '角色类别不能为空' }],
  sort: [{ required: true, message: '角色排序不能为空' }],
  description: [{ required: true, message: '角色描述不能为空' }],
  systemMessage: [{ required: true, message: '角色设定不能为空' }],
  publicStatus: [{ required: true, message: '是否公开不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/chatRole/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getChatRole(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateChatRole(data)
      toast.success('修改成功')
    } else {
      await createChatRole(data)
      toast.success('新增成功')
    }
    uni.$emit('ai:chat-role:reload')
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
