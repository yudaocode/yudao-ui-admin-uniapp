<template>
  <scroll-view scroll-y class="min-h-0 flex-1">
    <view class="p-24rpx pb-60rpx">
      <!-- 成员列表标题与操作 -->
      <view class="mb-16rpx flex items-center justify-between">
        <text class="text-30rpx text-[#333] font-semibold"
          >项目成员（{{ list.length }}）</text
        >
        <wd-button
          v-if="
            project.adminStatus &&
            editable &&
            hasAccessByCodes(['pms:pm:project-member:update'])
          "
          size="small"
          type="primary"
          @click="handleAdd"
        >
          新增成员
        </wd-button>
      </view>

      <!-- 成员列表 -->
      <view
        v-for="item in list"
        :key="item.userId"
        class="mb-16rpx flex items-center justify-between rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="min-w-0 flex flex-1 items-center gap-16rpx">
          <view
            class="h-64rpx w-64rpx flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1677ff] text-28rpx text-white"
          >
            <wd-img
              v-if="item.avatar"
              :src="item.avatar"
              width="64rpx"
              height="64rpx"
              radius="50%"
            />
            <text v-else>{{ item.nickname?.slice(0, 1) || "-" }}</text>
          </view>
          <view class="min-w-0">
            <view class="flex items-center gap-12rpx text-28rpx text-[#333]">
              <text class="truncate">{{
                item.nickname || `用户 #${item.userId}`
              }}</text>
              <wd-tag v-if="item.creatorStatus" type="success" plain>
                创建人
              </wd-tag>
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ formatProjectMemberLevel(item.level) }}
            </view>
          </view>
        </view>
        <view
          v-if="
            project.adminStatus &&
            editable &&
            hasAccessByCodes(['pms:pm:project-member:update']) &&
            !item.creatorStatus
          "
          class="flex shrink-0 gap-16rpx"
        >
          <text class="text-26rpx text-[#1677ff]" @click="handleEdit(item)"
            >修改</text
          >
          <text class="text-26rpx text-[#f5222d]" @click="handleDelete(item)"
            >删除</text
          >
        </view>
      </view>
      <wd-empty v-if="!list.length" description="暂无成员" />
    </view>

    <!-- 成员表单弹窗 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ project.name }} - {{ currentMember ? "修改成员" : "新增成员" }}
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-cell
              v-if="currentMember"
              title="项目成员"
              title-width="200rpx"
              :value="currentMember.nickname || `用户 #${currentMember.userId}`"
            />
            <UserFormPicker
              v-else
              v-model="formData.userIds"
              type="checkbox"
              label="项目成员"
              label-width="200rpx"
              prop="userIds"
              placeholder="请选择需要加入项目的用户"
              :hide-ids="existingUserIds"
            />
            <yd-form-picker
              v-model="formData.level"
              label="权限级别"
              label-width="200rpx"
              prop="level"
              :columns="assignableLevelOptions"
              placeholder="请选择权限级别"
            />
          </wd-cell-group>
        </wd-form>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="formVisible = false"
          >
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="formLoading"
            @click="handleSubmit"
          >
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { FormInstance } from "@wot-ui/ui/components/wd-form/types";
import type { Project } from "@/api/pms/pm/project";
import type { ProjectMember } from "@/api/pms/pm/project/member";
import { useDialog } from "@wot-ui/ui/components/wd-dialog";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import {
  deleteProjectMember,
  getProjectMemberList,
  updateProjectMemberList,
} from "@/api/pms/pm/project/member";
import UserFormPicker from "@/components/system-select/user-form-picker.vue";
import { useAccess } from "@/hooks/useAccess";
import { PmsProjectMemberLevel } from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import { formatProjectMemberLevel } from "@/pages-pms/pm/utils/format";
import { createFormSchema } from "@/utils/wot";

const props = defineProps<{
  project: Project;
  editable: boolean;
}>();

const { hasAccessByCodes } = useAccess();
const toast = useToast();
const dialog = useDialog();
const list = ref<ProjectMember[]>([]); // 成员列表
const formVisible = ref(false); // 成员表单弹窗显示状态
const formLoading = ref(false); // 表单提交中
const currentMember = ref<ProjectMember>(); // 当前编辑成员
const formData = ref({
  userIds: [] as number[],
  level: PmsProjectMemberLevel.WRITE as number,
}); // 成员表单数据
const formSchema = createFormSchema({
  userIds: [
    { required: () => !currentMember.value, message: "请选择项目成员" },
  ],
  level: [{ required: true, message: "请选择权限级别" }],
});
const formRef = ref<FormInstance>(); // 表单组件引用

const assignableLevelOptions = getIntDictOptions(
  DICT_TYPE.PMS_PROJECT_MEMBER_LEVEL,
)
  .filter((option) => option.value !== PmsProjectMemberLevel.OWNER)
  .map((option) => ({ ...option })); // 可以分配的成员权限级别
const existingUserIds = computed(() => list.value.map((item) => item.userId)); // 已加入项目的用户编号

/** 查询项目成员列表 */
async function getList() {
  list.value = await getProjectMemberList(props.project.id);
}

/** 新增成员 */
function handleAdd() {
  currentMember.value = undefined;
  formData.value = { userIds: [], level: PmsProjectMemberLevel.WRITE };
  formVisible.value = true;
}

/** 修改成员 */
function handleEdit(item: ProjectMember) {
  currentMember.value = item;
  formData.value = { userIds: [item.userId], level: item.level };
  formVisible.value = true;
}

/** 提交成员表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    await updateProjectMemberList(
      props.project.id,
      formData.value.userIds.map((userId) => ({
        userId,
        level: formData.value.level,
      })),
    );
    toast.success(currentMember.value ? "成员修改成功" : "成员添加成功");
    formVisible.value = false;
    await getList();
    uni.$emit("pms:pm:project:reload");
  } finally {
    formLoading.value = false;
  }
}

/** 删除项目成员 */
async function handleDelete(item: ProjectMember) {
  try {
    await dialog.confirm({
      title: "提示",
      msg: `确认将“${item.nickname}”移出项目吗？`,
    });
  } catch {
    return;
  }
  await deleteProjectMember(props.project.id, item.userId);
  toast.success("成员已移出项目");
  await getList();
  uni.$emit("pms:pm:project:reload");
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>
