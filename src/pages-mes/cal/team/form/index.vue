<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="班组编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" :loading="codeLoading" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="班组名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入班组名称" clearable />
          </wd-form-item>
          <yd-form-picker v-model="formData.calendarType" label="班组类型" label-width="220rpx" prop="calendarType" :dict-type="DICT_TYPE.MES_CAL_CALENDAR_TYPE" placeholder="请选择班组类型" />
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="250" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <TeamMemberList v-if="props.id" :team-id="Number(props.id)" editable />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        新增班组保存后，可在编辑页维护班组成员。
      </view>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
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
import type { CalTeam } from '@/api/mes/cal/team'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createTeam, getTeam, updateTeam } from '@/api/mes/cal/team'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import TeamMemberList from '../components/team-member-list.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑班组' : '新增班组')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<CalTeam>({
  id: undefined,
  code: '',
  name: '',
  calendarType: undefined,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '班组编码不能为空' }],
  name: [{ required: true, message: '班组名称不能为空' }],
  calendarType: [{ required: true, message: '班组类型不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/team/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getTeam(Number(props.id))
}

/** 生成班组编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.CAL_TEAM_CODE)
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
      await updateTeam(formData.value)
      toast.success('修改成功')
    } else {
      await createTeam(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('mes:cal:team:reload')
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
