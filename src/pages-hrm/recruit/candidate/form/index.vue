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
          <wd-form-item title="候选人姓名" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入候选人姓名" :maxlength="255" />
          </wd-form-item>
          <wd-form-item title="手机号码" title-width="180rpx" prop="mobile">
            <wd-input v-model="formData.mobile" clearable placeholder="请输入手机号码" :maxlength="18" />
          </wd-form-item>
          <wd-form-item title="性别" title-width="180rpx" prop="sex" vertical>
            <wd-radio-group v-model="formData.sex" type="button">
              <wd-radio
                v-for="dict in sexOptions"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="年龄" title-width="180rpx" prop="age">
            <wd-input-number
              v-model="formData.age"
              allow-null
              :min="0"
              :max="99"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="180rpx" prop="email">
            <wd-input v-model="formData.email" clearable placeholder="请输入邮箱" :maxlength="255" />
          </wd-form-item>
          <PostFormPicker
            v-model="formData.postId"
            prop="postId"
            :clearable="false"
          />
          <wd-form-item title="工作年限" title-width="180rpx" prop="workTime">
            <wd-input-number
              v-model="formData.workTime"
              allow-null
              :min="0"
              :max="60"
              :precision="0"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.education"
            label="学历"
            label-width="180rpx"
            prop="education"
            :dict-type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION"
            placeholder="请选择学历"
          />
          <wd-form-item title="毕业院校" title-width="180rpx" prop="graduateSchool">
            <wd-input
              v-model="formData.graduateSchool"
              clearable
              placeholder="请输入毕业院校"
              :maxlength="255"
            />
          </wd-form-item>
          <wd-form-item title="最近工作单位" title-width="180rpx" prop="latestWorkPlace">
            <wd-input
              v-model="formData.latestWorkPlace"
              clearable
              placeholder="请输入最近工作单位"
              :maxlength="255"
            />
          </wd-form-item>
          <ChannelFormPicker v-model="formData.channelId" prop="channelId" />
          <wd-form-item title="简历附件" title-width="180rpx" prop="resumeUrls" vertical>
            <yd-upload-file
              v-model="formData.resumeUrls"
              directory="hrm/recruit/candidate/resume"
              :limit="5"
              :file-size="20"
              :file-type="['doc', 'docx', 'pdf']"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark" vertical>
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
              :maxlength="255"
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
import type { RecruitCandidate } from '@/api/hrm/recruit/candidate'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createRecruitCandidate,
  getRecruitCandidate,
  updateRecruitCandidate,
} from '@/api/hrm/recruit/candidate'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { SYSTEM_USER_SEX_MALE, SYSTEM_USER_SEX_UNKNOWN } from '@/pages-hrm/utils/constants'
import ChannelFormPicker from '@/pages-hrm/recruit/channel/components/channel-form-picker.vue'
import PostFormPicker from '@/pages-hrm/recruit/post/components/post-form-picker.vue'

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
const getTitle = computed(() => props.id ? '编辑候选人' : '新增候选人')
const formLoading = ref(false) // 表单提交状态
const formData = ref<RecruitCandidate>({
  id: undefined,
  name: '',
  mobile: '',
  sex: SYSTEM_USER_SEX_MALE,
  age: undefined,
  email: '',
  postId: undefined,
  workTime: undefined,
  education: undefined,
  graduateSchool: '',
  latestWorkPlace: '',
  channelId: undefined,
  remark: '',
  resumeUrls: [],
}) // 表单数据
const sexOptions = computed(() => // 性别选项，过滤未知
  getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX).filter(item => item.value !== SYSTEM_USER_SEX_UNKNOWN),
)
const formSchema = createFormSchema({
  name: [{ required: true, message: '候选人姓名不能为空' }],
  mobile: [
    { required: true, message: '手机号码不能为空' },
    {
      pattern: /^(\+?0?\d{2,4}-?)?\d{6,11}$/,
      message: '请输入正确的手机号码',
    },
  ],
  sex: [{ required: true, message: '性别不能为空' }],
  postId: [{ required: true, message: '应聘职位不能为空' }],
  education: [{ required: true, message: '学历不能为空' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/recruit/candidate/index')
}

/** 加载候选人详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getRecruitCandidate(Number(props.id))
  formData.value = {
    ...data,
    resumeUrls: data.resumeUrls ?? [],
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
      await updateRecruitCandidate(formData.value)
      toast.success('修改成功')
    } else {
      await createRecruitCandidate(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('hrm:recruit:candidate:reload')
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
