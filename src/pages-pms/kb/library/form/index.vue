<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="templateSelecting ? '选择知识库模板' : getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 知识库模板选择（新建第一步） -->
    <scroll-view v-if="templateSelecting" scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <view
          class="mb-16rpx flex items-center gap-16rpx rounded-12rpx p-24rpx"
          :class="selectedTemplateId === 0 ? 'bg-[#e6f4ff] b-2rpx b-solid b-[#1677ff]' : 'bg-white shadow-sm'"
          @click="selectedTemplateId = 0"
        >
          <view class="h-96rpx w-108rpx flex shrink-0 items-center justify-center b-2rpx b-[#1677ff] rounded-8rpx b-dashed">
            <wd-icon name="plus" size="40rpx" color="#1677ff" />
          </view>
          <view class="min-w-0 flex-1">
            <view class="text-30rpx text-[#333] font-semibold">
              空白知识库
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              邀请团队成员一起创作和交流知识
            </view>
          </view>
        </view>
        <view
          v-for="item in templateList"
          :key="item.id"
          class="mb-16rpx flex items-center gap-16rpx rounded-12rpx p-24rpx"
          :class="selectedTemplateId === item.id ? 'bg-[#e6f4ff] b-2rpx b-solid b-[#1677ff]' : 'bg-white shadow-sm'"
          @click="selectedTemplateId = item.id"
        >
          <view class="h-96rpx w-108rpx flex shrink-0 items-center justify-center overflow-hidden rounded-8rpx bg-[#e6f4ff]">
            <wd-img v-if="item.coverUrl" :src="item.coverUrl" width="108rpx" height="96rpx" mode="aspectFill" />
            <wd-icon v-else name="book" size="44rpx" color="#1677ff" />
          </view>
          <view class="min-w-0 flex-1">
            <view class="text-30rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="mt-4rpx truncate text-24rpx text-[#999]">
              {{ item.description || '暂无简介' }}
            </view>
            <view v-if="item.documents?.length" class="mt-4rpx truncate text-24rpx text-[#999]">
              含 {{ item.documents.length }} 篇文档：{{ item.documents.map(doc => doc.title).join('、') }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 表单区域 -->
    <scroll-view v-else scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="知识库名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入知识库名称"
              :maxlength="50"
            />
          </wd-form-item>
          <wd-form-item title="知识库封面" title-width="220rpx" prop="coverUrl">
            <yd-upload-img v-model="formData.coverUrl" :limit="1" />
          </wd-form-item>
          <wd-form-item title="知识库简介" title-width="220rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入知识库简介"
              :maxlength="300"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="可见范围" title-width="220rpx" prop="openStatus">
            <wd-radio-group v-model="formData.openStatus" type="button" :disabled="openStatusDisabled">
              <wd-radio :value="false">
                私有
              </wd-radio>
              <wd-radio :value="true">
                公开
              </wd-radio>
            </wd-radio-group>
            <view class="mt-12rpx text-24rpx text-[#999]">
              {{ formData.openStatus ? '公开：所有人可以查看，成员可以协作' : '私有：只有知识库成员可以查看' }}
            </view>
          </wd-form-item>
          <template v-if="!props.id">
            <UserFormPicker
              v-model="initialAdminUserIds"
              type="checkbox"
              label="初始管理员"
              label-width="220rpx"
              placeholder="请选择初始管理员"
              :hide-ids="[currentUserId]"
            />
            <UserFormPicker
              v-model="initialMemberUserIds"
              type="checkbox"
              label="普通成员"
              label-width="220rpx"
              placeholder="请选择普通成员"
              :hide-ids="[currentUserId]"
            />
          </template>
        </wd-cell-group>
      </wd-form>
      <view class="p-24rpx text-24rpx text-[#999]">
        创建人由系统自动加入；初始管理员可管理知识库信息和成员，普通成员可参与内容协作
      </view>
    </scroll-view>

    <!-- 底部操作 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="templateSelecting">
          <wd-button class="flex-1" type="primary" @click="handleTemplateNext">
            下一步
          </wd-button>
        </template>
        <template v-else>
          <wd-button v-if="!props.id" variant="plain" class="flex-1" @click="templateSelecting = true">
            上一步
          </wd-button>
          <wd-button type="primary" class="flex-1" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </template>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { KnowledgeLibrary, KnowledgeLibraryTemplateOption } from '@/api/pms/kb/library'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createKnowledgeLibrary,
  getKnowledgeLibrary,
  getKnowledgeLibraryTemplateList,
  updateKnowledgeLibrary,
} from '@/api/pms/kb/library'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import { useUserStore } from '@/store/user'

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
const getTitle = computed(() => props.id ? '编辑知识库' : '新建知识库')
const currentUserId = computed(() => useUserStore().userInfo.userId) // 当前登录用户编号
const templateSelecting = ref(false) // 是否正在选择知识库模板
const templateList = ref<KnowledgeLibraryTemplateOption[]>([]) // 知识库模板列表
const selectedTemplateId = ref(0) // 0 表示空白知识库
const formLoading = ref(false) // 表单提交状态
const initialAdminUserIds = ref<number[]>([]) // 创建时的初始管理员
const initialMemberUserIds = ref<number[]>([]) // 创建时的普通成员
const formData = ref<Partial<KnowledgeLibrary>>({ // 表单数据
  name: '',
  description: '',
  openStatus: false,
  coverUrl: undefined,
})
const formSchema = createFormSchema({
  name: [{ required: true, message: '请输入知识库名称' }],
  openStatus: [{ required: true, message: '请选择可见范围' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

const openStatusDisabled = computed(() =>
  Boolean(props.id && formData.value.creatorUserId && formData.value.creatorUserId !== currentUserId.value),
) // 编辑时仅创建人可以调整可见范围

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-pms/kb/library/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const library = await getKnowledgeLibrary(Number(props.id))
  formData.value = {
    ...library,
    adminUserIds: [],
    memberUserIds: [],
    templateId: undefined,
  }
}

/** 进入知识库基本信息表单 */
function handleTemplateNext() {
  const selected = templateList.value.find(item => item.id === selectedTemplateId.value)
  if (selected) {
    formData.value = {
      ...formData.value,
      name: selected.name,
      description: selected.description,
      coverUrl: selected.coverUrl,
      templateId: selected.id,
    }
  }
  templateSelecting.value = false
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 校验初始管理员和普通成员不能重复
  if (!props.id) {
    const memberUserIdSet = new Set(initialMemberUserIds.value)
    if (initialAdminUserIds.value.some(userId => memberUserIdSet.has(userId))) {
      toast.warning('同一用户不能同时设置为初始管理员和普通成员')
      return
    }
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateKnowledgeLibrary(formData.value)
      toast.success('修改成功')
    } else {
      await createKnowledgeLibrary({
        ...formData.value,
        adminUserIds: [...initialAdminUserIds.value],
        memberUserIds: [...initialMemberUserIds.value],
      })
      toast.success('新增成功')
    }
    uni.$emit('pms:kb:library:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (props.id) {
    await getDetail()
    return
  }
  templateSelecting.value = true
  templateList.value = await getKnowledgeLibraryTemplateList()
})
</script>
