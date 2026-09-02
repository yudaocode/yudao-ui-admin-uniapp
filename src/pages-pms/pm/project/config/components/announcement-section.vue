<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view class="p-24rpx pb-60rpx">
      <!-- 公告列表标题与操作 -->
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold">项目公告（{{ list.length }}）</text>
        <wd-button
          v-if="editable && hasAccessByCodes(['pms:pm:project:update'])"
          size="small" type="primary"
          @click="handleAdd"
        >
          发布公告
        </wd-button>
      </view>

      <!-- 公告列表 -->
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="line-clamp-3 mb-12rpx whitespace-pre-wrap text-28rpx text-[#333] leading-40rpx">
          {{ item.content }}
        </view>
        <view v-if="item.fileUrls?.length" class="mb-12rpx flex flex-wrap gap-16rpx">
          <text
            v-for="(url, index) in item.fileUrls"
            :key="url"
            class="text-26rpx text-[#1677ff]"
            @click="openAttachment(url)"
          >
            附件 {{ index + 1 }}
          </text>
        </view>
        <view class="flex items-center justify-between text-24rpx text-[#999]">
          <text>{{ item.creatorUserName || '-' }} 发布于 {{ formatDateTime(item.createTime) }}</text>
          <view v-if="editable && hasAccessByCodes(['pms:pm:project:update'])" class="flex shrink-0 gap-16rpx">
            <text class="text-26rpx text-[#1677ff]" @click="handleEdit(item)">编辑</text>
            <text class="text-26rpx text-[#f5222d]" @click="handleDelete(item)">删除</text>
          </view>
        </view>
      </view>
      <wd-empty v-if="!list.length" description="暂无公告" />
    </view>

    <!-- 公告表单弹窗 -->
    <wd-popup v-model="formVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formData.id ? '编辑公告' : '发布公告' }}
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="公告内容" title-width="200rpx" prop="content">
              <wd-textarea
                v-model="formData.content"
                placeholder="请输入公告内容"
                :maxlength="5000"
                show-word-limit
              />
            </wd-form-item>
            <wd-form-item title="附件" title-width="200rpx" prop="fileUrls">
              <yd-upload-file v-model="formData.fileUrls" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="formVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProjectAnnouncement } from '@/api/pms/pm/project/announcement'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createProjectAnnouncement,
  deleteProjectAnnouncement,
  getProjectAnnouncement,
  getProjectAnnouncementList,
  updateProjectAnnouncement,
} from '@/api/pms/pm/project/announcement'
import { useAccess } from '@/hooks/useAccess'
import { formatDateTime } from '@/utils/date'
import { openAttachment } from '@/utils/download'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  projectId: number
  editable: boolean
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<ProjectAnnouncement[]>([]) // 公告列表
const formVisible = ref(false) // 公告表单弹窗显示状态
const formLoading = ref(false) // 表单提交中
const formData = ref({
  id: undefined as number | undefined,
  content: '',
  fileUrls: [] as string[],
}) // 公告表单数据
const formSchema = createFormSchema({
  content: [{ required: true, message: '公告内容不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 查询公告列表 */
async function getList() {
  list.value = await getProjectAnnouncementList(props.projectId)
}

/** 发布公告 */
function handleAdd() {
  formData.value = { id: undefined, content: '', fileUrls: [] }
  formVisible.value = true
}

/** 编辑公告 */
async function handleEdit(item: ProjectAnnouncement) {
  const data = await getProjectAnnouncement(item.id)
  formData.value = { id: data.id, content: data.content, fileUrls: data.fileUrls || [] }
  formVisible.value = true
}

/** 提交公告表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateProjectAnnouncement({ ...formData.value, projectId: props.projectId } as Partial<ProjectAnnouncement>)
      toast.success('修改成功')
    } else {
      await createProjectAnnouncement({ ...formData.value, projectId: props.projectId } as Partial<ProjectAnnouncement>)
      toast.success('新增成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除公告 */
async function handleDelete(item: ProjectAnnouncement) {
  try {
    await dialog.confirm({ title: '提示', msg: '确认删除这条公告吗？' })
  } catch {
    return
  }
  await deleteProjectAnnouncement(item.id)
  toast.success('删除成功')
  await getList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
