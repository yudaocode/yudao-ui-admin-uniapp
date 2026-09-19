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
          <yd-form-picker
            v-model="formData.templateId"
            label="套红模板"
            label-width="220rpx"
            prop="templateId"
            :columns="templateOptions"
            placeholder="请选择套红模板"
            @confirm="handleTemplateChange"
          />
          <wd-form-item title="公文标题" title-width="220rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入公文标题"
            />
          </wd-form-item>
          <wd-form-item title="字号前缀" title-width="220rpx" prop="noPrefix">
            <wd-input
              v-model="formData.noPrefix"
              clearable
              :maxlength="64"
              placeholder="请输入字号前缀"
            />
          </wd-form-item>
          <wd-form-item title="年份" title-width="220rpx" prop="year">
            <wd-input-number
              v-model="formData.year"
              allow-null
              :min="1"
              :precision="0"
              placeholder="请输入年份"
            />
          </wd-form-item>
          <wd-form-item title="第几号文" title-width="220rpx" prop="sequence">
            <wd-input-number
              v-model="formData.sequence"
              allow-null
              :min="1"
              :precision="0"
              placeholder="请输入第几号文"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.secrecyLevel"
            label="密级"
            label-width="220rpx"
            prop="secrecyLevel"
            :dict-type="DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL"
            placeholder="请选择密级"
          />
          <yd-form-picker
            v-model="formData.urgencyLevel"
            label="紧急程度"
            label-width="220rpx"
            prop="urgencyLevel"
            :dict-type="DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL"
            placeholder="请选择紧急程度"
          />
          <yd-form-picker
            v-model="formData.disclosureType"
            label="公开类别"
            label-width="220rpx"
            prop="disclosureType"
            :dict-type="DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY"
            placeholder="请选择公开类别"
          />
          <wd-form-item title="发文日期" title-width="220rpx" prop="issueTime">
            <view class="flex items-center justify-end gap-12rpx" @click="issueTimeVisible = true">
              <text class="text-28rpx" :class="issueTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ issueTime === '' ? '请选择发文日期' : formatDateTime(issueTime) }}
              </text>
              <text v-if="issueTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="issueTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <DeptFormPicker v-model="formData.sendDeptId" label="发文部门" label-width="220rpx" prop="sendDeptId" placeholder="请选择发文部门" />
          <yd-tree-select
            v-model="formData.mainDeptIds"
            :data="deptTree"
            multiple
            label="主送部门"
            label-width="220rpx"
            placeholder="请选择主送部门"
          />
          <yd-tree-select
            v-model="formData.copyDeptIds"
            :data="deptTree"
            multiple
            label="抄送部门"
            label-width="220rpx"
            placeholder="请选择抄送部门"
          />
          <wd-form-item title="公文正文" title-width="220rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              clearable
              placeholder="请输入公文正文"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="10" directory="oa/officialdoc-send" />
          </wd-form-item>
          <wd-form-item title="正式公文" title-width="220rpx" prop="formalFileUrl">
            <yd-upload-file v-model="formData.formalFileUrl" :limit="1" :file-type="['pdf']" directory="oa/officialdoc-send" />
          </wd-form-item>
          <wd-form-item title="附注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入附注"
            />
          </wd-form-item>
          <!-- 签发人由签发环节写入，表单内只读回显 -->
          <wd-form-item v-if="formData.signerName" title="签发人" title-width="220rpx">
            <view class="py-12rpx text-right text-28rpx text-[#666]">
              {{ formData.signerName }}
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="issueTime" v-model:visible="issueTimeVisible" type="datetime" title="发文日期" />
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存草稿
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { OfficialDocSend } from '@/api/oa/officialdoc-send'
import type { OfficialDocTemplate } from '@/api/oa/officialdoc-template'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createOfficialDocSend, getOfficialDocSend, updateOfficialDocSend } from '@/api/oa/officialdoc-send'
import { getOfficialDocTemplate, getSimpleOfficialDocTemplateList } from '@/api/oa/officialdoc-template'
import { getSimpleDeptList } from '@/api/system/dept'
import { DeptFormPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑公文发文' : '新增公文发文')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<OfficialDocSend>>({
  id: undefined,
  templateId: undefined,
  title: '',
  noPrefix: '',
  year: new Date().getFullYear(),
  sequence: undefined,
  secrecyLevel: undefined,
  urgencyLevel: undefined,
  disclosureType: undefined,
  sendDeptId: undefined,
  mainDeptIds: [],
  copyDeptIds: [],
  content: '',
  fileUrls: [],
  formalFileUrl: '',
  remark: '',
}) // 表单数据
const issueTime = ref<number | ''>('') // 发文日期选择器值，空字符串承接未选择
const issueTimeVisible = ref(false) // 发文日期选择器显示状态
const templateOptions = ref<{ label: string, value: number }[]>([]) // 套红模板选项
const deptTree = ref<any[]>([]) // 部门树数据
const formSchema = createFormSchema({ // 表单校验规则
  templateId: [{ required: true, message: '套红模板不能为空' }],
  title: [{ required: true, message: '公文标题不能为空' }, { max: 255 }],
  noPrefix: [{ max: 64 }],
  secrecyLevel: [{ required: true, message: '密级不能为空' }],
  urgencyLevel: [{ required: true, message: '紧急程度不能为空' }],
  disclosureType: [{ required: true, message: '公开类别不能为空' }],
  sendDeptId: [{ required: true, message: '发文部门不能为空' }],
  remark: [{ max: 500 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/officialdoc/send/index')
}

/** 选择套红模板：带出模板的字号前缀，模板无前缀时清空旧值 */
async function handleTemplateChange() {
  if (!formData.value.templateId) {
    return
  }
  const template = await getOfficialDocTemplate(Number(formData.value.templateId))
  formData.value.noPrefix = template.noPrefix || ''
}

/** 加载发文详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getOfficialDocSend(Number(props.id))
  formData.value = data
  issueTime.value = data.issueTime ? toTimestamp(data.issueTime) : ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (issueTime.value === '') {
    toast.warning('请选择发文日期')
    return
  }
  if (!formData.value.mainDeptIds?.length) {
    toast.warning('请选择主送部门')
    return
  }

  formLoading.value = true
  try {
    // 日期取当天零点时间戳，由后端 Jackson 反序列化为 LocalDateTime
    const data = { ...formData.value, issueTime: issueTime.value } as unknown as OfficialDocSend
    if (props.id) {
      await updateOfficialDocSend(data)
      toast.success('修改成功')
    } else {
      await createOfficialDocSend(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:officialdoc-send:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  templateOptions.value = (await getSimpleOfficialDocTemplateList())
    .map((item: OfficialDocTemplate) => ({ label: item.name || '', value: item.id }))
  deptTree.value = handleTree(await getSimpleDeptList())
  getDetail()
})
</script>
