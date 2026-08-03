<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          候选人
        </view>
        <wd-input v-model="formData.search" placeholder="姓名、手机号或邮箱" clearable />
      </view>
      <PostSearchPicker v-model="formData.postId" />
      <EmployeeSearchPicker
        v-model="formData.ownerEmployeeId"
        label="招聘负责人"
        placeholder="请选择招聘负责人"
        :entry-status="HrmEmployeeEntryStatus.ACTIVE"
      />
      <ChannelSearchPicker v-model="formData.channelId" />
      <yd-search-picker
        v-model="formData.sex"
        label="性别"
        :dict-type="DICT_TYPE.SYSTEM_USER_SEX"
        all-option
      />
      <yd-search-picker
        v-model="formData.education"
        label="学历"
        :dict-type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION"
        all-option
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          毕业院校
        </view>
        <wd-input v-model="formData.graduateSchool" placeholder="请输入毕业院校" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          最近单位
        </view>
        <wd-input v-model="formData.latestWorkPlace" placeholder="请输入最近工作单位" clearable />
      </view>
      <EmployeeSearchPicker
        v-model="formData.interviewEmployeeId"
        label="面试官"
        placeholder="请选择面试官"
        :entry-status="HrmEmployeeEntryStatus.ACTIVE"
      />
      <yd-search-date-range
        v-model="formData.interviewTime"
        label="面试时间"
      />
      <yd-search-date-range
        v-model="formData.createTime"
        label="创建时间"
      />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateRange } from '@/utils/date'
import { DICT_TYPE } from '@/utils/constants'
import { HrmEmployeeEntryStatus } from '@/pages-hrm/utils/constants'
import ChannelSearchPicker from '@/pages-hrm/recruit/channel/components/channel-search-picker.vue'
import PostSearchPicker from '@/pages-hrm/recruit/post/components/post-search-picker.vue'
import EmployeeSearchPicker from '@/pages-hrm/employee/components/employee-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  search: undefined as string | undefined,
  postId: undefined as number | undefined,
  ownerEmployeeId: undefined as number | undefined,
  channelId: undefined as number | undefined,
  sex: undefined as number | undefined,
  education: undefined as number | undefined,
  graduateSchool: undefined as string | undefined,
  latestWorkPlace: undefined as string | undefined,
  interviewEmployeeId: undefined as number | undefined,
  interviewTime: [undefined, undefined] as [number | undefined, number | undefined],
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.search) {
    conditions.push(`关键词:${formData.search}`)
  }
  if (formData.postId !== undefined) {
    conditions.push('职位已选')
  }
  if (formData.ownerEmployeeId !== undefined) {
    conditions.push('负责人已选')
  }
  if (formData.channelId !== undefined) {
    conditions.push('渠道已选')
  }
  if (formData.sex !== undefined) {
    conditions.push(`性别:${getDictLabel(DICT_TYPE.SYSTEM_USER_SEX, formData.sex)}`)
  }
  if (formData.education !== undefined) {
    conditions.push(`学历:${getDictLabel(DICT_TYPE.HRM_RECRUIT_CANDIDATE_EDUCATION, formData.education)}`)
  }
  if (formData.graduateSchool) {
    conditions.push(`院校:${formData.graduateSchool}`)
  }
  if (formData.latestWorkPlace) {
    conditions.push(`单位:${formData.latestWorkPlace}`)
  }
  if (formData.interviewEmployeeId !== undefined) {
    conditions.push('面试官已选')
  }
  if (formData.interviewTime[0] || formData.interviewTime[1]) {
    conditions.push('面试时间已选')
  }
  if (formData.createTime[0] || formData.createTime[1]) {
    conditions.push('创建时间已选')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索候选人'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    search: formData.search || undefined,
    postId: formData.postId,
    ownerEmployeeId: formData.ownerEmployeeId,
    channelId: formData.channelId,
    sex: formData.sex,
    education: formData.education,
    graduateSchool: formData.graduateSchool || undefined,
    latestWorkPlace: formData.latestWorkPlace || undefined,
    interviewEmployeeId: formData.interviewEmployeeId,
    interviewTime: formatDateRange(formData.interviewTime),
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.search = undefined
  formData.postId = undefined
  formData.ownerEmployeeId = undefined
  formData.channelId = undefined
  formData.sex = undefined
  formData.education = undefined
  formData.graduateSchool = undefined
  formData.latestWorkPlace = undefined
  formData.interviewEmployeeId = undefined
  formData.interviewTime = [undefined, undefined]
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
