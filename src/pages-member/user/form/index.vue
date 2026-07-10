<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑会员"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="手机号" title-width="180rpx" prop="mobile">
            <wd-input
              v-model="formData.mobile"
              clearable
              placeholder="请输入手机号"
            />
          </wd-form-item>
          <wd-form-item title="邮箱" title-width="180rpx" prop="email">
            <wd-input
              v-model="formData.email"
              clearable
              :maxlength="50"
              placeholder="请输入邮箱"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="180rpx" prop="status" center>
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
          <wd-form-item title="用户昵称" title-width="180rpx" prop="nickname">
            <wd-input
              v-model="formData.nickname"
              clearable
              placeholder="请输入用户昵称"
            />
          </wd-form-item>
          <wd-form-item title="头像" title-width="180rpx" prop="avatar">
            <yd-upload-img v-model="formData.avatar" directory="avatar" />
          </wd-form-item>
          <wd-form-item title="真实名字" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入真实名字"
            />
          </wd-form-item>
          <wd-form-item title="用户性别" title-width="180rpx" prop="sex" center>
            <wd-radio-group v-model="formData.sex" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            title="出生日期"
            title-width="180rpx"
            prop="birthday"
            is-link
            :value="formatDate(formData.birthday)"
            placeholder="请选择出生日期"
            @click="birthdayVisible = true"
          />
          <wd-datetime-picker
            v-model="formData.birthday"
            v-model:visible="birthdayVisible"
            type="date"
          />
          <yd-tree-select
            v-model="formData.areaId"
            label="所在地"
            prop="areaId"
            :data="areaList"
            placeholder="请选择所在地"
            title="请选择所在地"
          />
          <TagFormPicker v-model="formData.tagIds" label="用户标签" prop="tagIds" />
          <GroupFormPicker v-model="formData.groupId" label="用户分组" prop="groupId" />
          <wd-form-item title="会员备注" title-width="180rpx" prop="mark">
            <wd-textarea
              v-model="formData.mark"
              clearable
              placeholder="请输入会员备注"
              :maxlength="200"
              show-word-limit
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
import type { MemberUser } from '@/api/member/user'
import type { Area } from '@/api/system/area'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getMemberUser, updateMemberUser } from '@/api/member/user'
import { getAreaTree } from '@/api/system/area'
import { getIntDictOptions } from '@/hooks/useDict'
import GroupFormPicker from '@/pages-member/group/components/group-form-picker.vue'
import TagFormPicker from '@/pages-member/tag/components/tag-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
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
const formLoading = ref(false) // 表单提交状态
const birthdayVisible = ref(false) // 出生日期选择器状态
const areaList = ref<Area[]>([]) // 地区树
const formData = ref<MemberUser>({
  id: undefined,
  mobile: '',
  email: '',
  status: CommonStatusEnum.ENABLE,
  nickname: '',
  avatar: '',
  name: '',
  sex: undefined,
  areaId: undefined,
  birthday: '',
  mark: '',
  tagIds: [],
  groupId: undefined,
}) // 表单数据
const formSchema = createFormSchema({
  mobile: [{ required: true, message: '手机号不能为空' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-member/user/index')
}

/** 加载会员详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getMemberUser(Number(props.id))
  formData.value = {
    ...data,
    birthday: data.birthday || '',
    tagIds: data.tagIds || [],
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
    const data = {
      ...formData.value,
      birthday: formData.value.birthday || undefined,
    }
    await updateMemberUser(data)
    toast.success('修改成功')
    uni.$emit('member:user:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getAreaTree().then((list) => {
      areaList.value = list
    }),
  ])
})
</script>
