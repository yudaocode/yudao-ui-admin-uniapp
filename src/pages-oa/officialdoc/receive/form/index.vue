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
          <wd-form-item title="公文标题" title-width="220rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="255"
              placeholder="请输入公文标题"
            />
          </wd-form-item>
          <wd-form-item title="来文字号" title-width="220rpx" prop="documentNo">
            <wd-input
              v-model="formData.documentNo"
              clearable
              :maxlength="64"
              placeholder="请输入来文字号"
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
            v-model="formData.receiveType"
            label="收文类型"
            label-width="220rpx"
            prop="receiveType"
            :dict-type="DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE"
            placeholder="请选择收文类型"
            disabled
          />
          <wd-form-item title="收文时间" title-width="220rpx" prop="receiveTime">
            <view class="flex items-center justify-end gap-12rpx" @click="receiveTimeVisible = true">
              <text class="text-28rpx" :class="receiveTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ receiveTime === '' ? '请选择收文时间' : formatDateTime(receiveTime) }}
              </text>
              <text v-if="receiveTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="receiveTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <DeptFormPicker v-model="formData.receiveDeptId" label="收文部门" label-width="220rpx" prop="receiveDeptId" placeholder="请选择收文部门" :disabled="!formData.sendId" />
          <UserFormPicker v-model="formData.handlerUserId" label="主办人" label-width="220rpx" prop="handlerUserId" placeholder="请选择主办人" />
          <wd-form-item title="办理期限" title-width="220rpx" prop="deadlineTime">
            <view class="flex items-center justify-end gap-12rpx" @click="deadlineTimeVisible = true">
              <text class="text-28rpx" :class="deadlineTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ deadlineTime === '' ? '请选择办理期限' : formatDateTime(deadlineTime) }}
              </text>
              <text v-if="deadlineTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="deadlineTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="内容摘要" title-width="220rpx" prop="summary">
            <wd-textarea
              v-model="formData.summary"
              clearable
              :maxlength="2000"
              show-word-limit
              placeholder="请输入内容摘要"
            />
          </wd-form-item>
          <wd-form-item title="领导批示" title-width="220rpx" prop="instruction">
            <wd-textarea
              v-model="formData.instruction"
              clearable
              :maxlength="2000"
              show-word-limit
              placeholder="请输入领导批示"
            />
          </wd-form-item>
          <wd-form-item title="办理结果" title-width="220rpx" prop="result">
            <wd-textarea
              v-model="formData.result"
              clearable
              :maxlength="2000"
              show-word-limit
              placeholder="请输入办理结果"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="10" directory="oa/officialdoc-receive" :disabled="!!formData.sendId" />
          </wd-form-item>
          <wd-form-item title="正式公文" title-width="220rpx" prop="formalFileUrl">
            <yd-upload-file v-model="formData.formalFileUrl" :limit="1" :file-type="['pdf']" directory="oa/officialdoc-receive" :disabled="!!formData.sendId" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
          </wd-form-item>
          <!-- 签发人由发文签发环节写入，表单内只读回显 -->
          <wd-form-item v-if="formData.signerName" title="签发人" title-width="220rpx">
            <view class="py-12rpx text-right text-28rpx text-[#666]">
              {{ formData.signerName }}
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="receiveTime" v-model:visible="receiveTimeVisible" type="datetime" title="收文时间" />
      <wd-datetime-picker v-model="deadlineTime" v-model:visible="deadlineTimeVisible" type="datetime" title="办理期限" />
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
import type { OfficialDocReceive } from '@/api/oa/officialdoc-receive'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createOfficialDocReceive, getOfficialDocReceive, updateOfficialDocReceive } from '@/api/oa/officialdoc-receive'
import { DeptFormPicker, UserFormPicker } from '@/components/system-select'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import { OA_OFFICIAL_DOC_RECEIVE_TYPE } from '../../../utils/constants'

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
const getTitle = computed(() => props.id ? '编辑公文收文' : '新增公文收文')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<OfficialDocReceive>>({
  id: undefined,
  title: '',
  documentNo: '',
  secrecyLevel: 0, // 默认无密级，对齐 PC 新建默认值
  urgencyLevel: 0, // 默认一般紧急，对齐 PC 新建默认值
  receiveType: OA_OFFICIAL_DOC_RECEIVE_TYPE.MAIN, // 收文类型固定主送，后端创建强制主送（对齐 PC 禁用选择）
  receiveDeptId: undefined,
  handlerUserId: undefined,
  instruction: '',
  result: '',
  summary: '',
  remark: '',
  fileUrls: [],
  formalFileUrl: '',
}) // 表单数据
const receiveTime = ref<number | ''>('') // 收文时间选择器值，空字符串承接未选择
const deadlineTime = ref<number | ''>('') // 办理期限选择器值，空字符串承接未选择
const receiveTimeVisible = ref(false) // 收文时间选择器显示状态
const deadlineTimeVisible = ref(false) // 办理期限选择器显示状态
const formSchema = createFormSchema({ // 表单校验规则
  title: [{ required: true, message: '公文标题不能为空' }, { max: 255 }],
  documentNo: [{ max: 64 }],
  secrecyLevel: [{ required: true, message: '密级不能为空' }],
  urgencyLevel: [{ required: true, message: '紧急程度不能为空' }],
  receiveType: [{ required: true, message: '收文类型不能为空' }],
  receiveDeptId: [{ required: true, message: '收文部门不能为空' }],
  instruction: [{ max: 2000 }],
  result: [{ max: 2000 }],
  remark: [{ max: 500 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/officialdoc/receive/index')
}

/** 加载收文详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getOfficialDocReceive(Number(props.id))
  formData.value = data
  receiveTime.value = data.receiveTime ? toTimestamp(data.receiveTime) : ''
  deadlineTime.value = data.deadlineTime ? toTimestamp(data.deadlineTime) : ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (receiveTime.value === '') {
    toast.warning('请选择收文时间')
    return
  }

  formLoading.value = true
  try {
    // 日期取当天零点时间戳，由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      receiveTime: receiveTime.value,
      deadlineTime: deadlineTime.value === '' ? undefined : deadlineTime.value,
    } as unknown as OfficialDocReceive
    if (props.id) {
      await updateOfficialDocReceive(data)
      toast.success('修改成功')
    } else {
      await createOfficialDocReceive(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:officialdoc-receive:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  // 手工收文的收文部门固定为本人部门（对齐 PC，关联发文时由发文带入）
  if (!props.id) {
    formData.value.receiveDeptId = useUserStore().userInfo?.deptId
    receiveTime.value = Date.now() // 收文时间默认当前时间，对齐 PC 新建默认值
  }
  getDetail()
})
</script>
