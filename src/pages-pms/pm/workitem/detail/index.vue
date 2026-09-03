<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="事项详情"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <scroll-view v-if="formData.id" scroll-y class="min-h-0 flex-1">
      <!-- 标题摘要 -->
      <view class="bg-white p-24rpx">
        <view class="mb-8rpx text-24rpx text-[#999]">
          创建于 {{ formatDateTime(formData.createTime) || "-" }}
        </view>
        <view class="mb-12rpx text-36rpx text-[#333] font-semibold">
          #{{ formData.serialNumber }} {{ formData.name }}
        </view>
        <view class="flex flex-wrap items-center gap-12rpx">
          <wd-tag type="primary" plain>
            {{ workItemTypeName }}
          </wd-tag>
          <wd-tag
            v-for="label in formData.labels || []"
            :key="label.id"
            :custom-style="getColorTagStyle(label.color)"
          >
            {{ label.name }}
          </wd-tag>
          <text
            v-if="formData.memberUserNames?.length"
            class="text-24rpx text-[#999]"
          >
            参与人：{{ formData.memberUserNames.join("、") }}
          </text>
        </view>
      </view>

      <!-- 属性信息 -->
      <wd-cell-group border title="基础信息">
        <wd-cell title="状态">
          <view
            class="flex items-center justify-end gap-8rpx"
            @click="handleOpenStatusSheet"
          >
            <text :class="canUpdate ? 'text-[#1677ff]' : ''">{{
              formData.statusName || "-"
            }}</text>
            <wd-icon
              v-if="canUpdate"
              name="arrow-right"
              size="28rpx"
              color="#1677ff"
            />
          </view>
        </wd-cell>
        <wd-cell
          title="负责人"
          :value="formData.assigneeUserName || '未分配'"
          :is-link="canUpdate"
          @click="openInlineEditor('assigneeUserId')"
        />
        <wd-cell
          title="优先级"
          :value="getPriorityName(formData.priority)"
          :is-link="canUpdate"
          @click="openInlineEditor('priority')"
        />
        <wd-cell
          v-if="projectType === PmsProjectType.AGILE"
          title="所属迭代"
          :value="formData.iterationName || '待规划'"
          :is-link="canUpdate"
          @click="openInlineEditor('iterationId')"
        />
        <wd-cell
          v-if="
            projectType === PmsProjectType.AGILE &&
            formData.type !== PmsWorkItemType.REQUIREMENT
          "
          title="关联需求"
          :value="formData.relatedRequirementName || '未关联'"
          :is-link="canUpdate"
          @click="openInlineEditor('relatedRequirementId')"
        />
        <wd-cell
          v-if="formData.type === PmsWorkItemType.DEFECT"
          title="缺陷类型"
          :value="getWorkItemDefectTypeName(formData.defectType)"
        />
        <wd-cell
          title="完成进度"
          :value="`${formData.progress ?? 0}%`"
          :is-link="canUpdate"
          @click="openInlineEditor('progress')"
        />
        <wd-cell
          title="预估工时"
          :value="formatWorkHours(formData.estimatedHours)"
          :is-link="canUpdate"
          @click="openInlineEditor('estimatedHours')"
        />
        <wd-cell
          title="开始时间"
          :value="formatDateTime(formData.startTime) || '-'"
          :is-link="canUpdate"
          @click="openInlineEditor('startTime')"
        />
        <wd-cell
          title="截止时间"
          :value="formatDateTime(formData.endTime) || '-'"
          :is-link="canUpdate"
          @click="openInlineEditor('endTime')"
        />
      </wd-cell-group>

      <!-- 描述 -->
      <view class="mt-16rpx bg-white p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          {{ workItemTypeName }}描述
        </view>
        <!-- 富文本消毒后渲染；纯文本（移动端自产）用 pre-wrap 保留换行 -->
        <rich-text
          v-if="formData.description && isHtmlContent(formData.description)"
          :nodes="sanitizeRichText(formData.description)"
        />
        <view
          v-else-if="formData.description"
          class="whitespace-pre-wrap break-all text-28rpx text-[#333]"
        >
          {{ formData.description }}
        </view>
        <view v-else class="text-28rpx text-[#999]"> 暂无描述 </view>
      </view>

      <!-- 附件 -->
      <view v-if="formData.fileUrls?.length" class="mt-16rpx bg-white p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          附件
        </view>
        <view
          v-for="(url, index) in formData.fileUrls"
          :key="`${url}-${index}`"
          class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-20rpx"
          @click="openAttachment(url)"
        >
          <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
            {{ getFileNameFromUrl(url) || `附件 ${index + 1}` }}
          </text>
          <text class="ml-16rpx shrink-0 text-28rpx text-[#1677ff]">查看</text>
        </view>
      </view>

      <!-- 协作信息 -->
      <view class="mt-16rpx bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>
        <view class="p-24rpx pb-200rpx">
          <WorkItemComment
            v-if="activeTab === 'comment'"
            :work-item-id="formData.id"
            :editable="editable"
            @changed="handleExtensionChanged"
          />
          <WorkItemActivity
            v-else-if="activeTab === 'activity'"
            ref="activityRef"
            :work-item-id="formData.id"
          />
          <WorkItemSubtaskList
            v-else-if="activeTab === 'subtask'"
            :parent-work-item="formData"
            :editable="editable"
            @changed="handleExtensionChanged"
          />
          <WorkItemWorkLogList
            v-else-if="activeTab === 'worklog'"
            :work-item-id="formData.id"
            :editable="editable"
            @changed="handleExtensionChanged"
          />
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作 -->
    <view v-if="formData.id && editable" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdate"
          type="primary"
          class="flex-1"
          @click="handleOpenStatusSheet"
        >
          变更状态
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['pms:pm:work-item:update'])"
          class="flex-1"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="moreActions.length"
          variant="plain"
          class="flex-1"
          @click="moreVisible = true"
        >
          更多
        </wd-button>
      </view>
    </view>

    <!-- 属性行内编辑弹窗 -->
    <wd-popup
      v-model="inlineVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          编辑{{ inlineFieldTitle }}
        </view>
        <wd-cell-group border>
          <ProjectMemberFormPicker
            v-if="inlineField === 'assigneeUserId'"
            v-model="editValue"
            :project-id="formData.projectId"
            label="负责人"
            clearable
          />
          <yd-form-picker
            v-else-if="inlineField === 'priority'"
            v-model="editValue"
            label="优先级"
            :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
            placeholder="请选择优先级"
          />
          <IterationFormPicker
            v-else-if="inlineField === 'iterationId'"
            v-model="editValue"
            :project-id="formData.projectId"
          />
          <WorkItemFormPicker
            v-else-if="inlineField === 'relatedRequirementId'"
            v-model="editValue"
            :project-id="formData.projectId"
            :type="PmsWorkItemType.REQUIREMENT"
            label="关联需求"
            placeholder="请选择关联需求"
          />
          <wd-cell
            v-else-if="inlineField === 'progress'"
            title="完成进度"
            title-width="220rpx"
          >
            <wd-input-number v-model="editValue" :min="0" :max="100" />
          </wd-cell>
          <wd-cell
            v-else-if="inlineField === 'estimatedHours'"
            title="预估工时"
            title-width="220rpx"
          >
            <wd-input-number
              v-model="editValue"
              allow-null
              :min="0"
              :precision="1"
            />
          </wd-cell>
          <wd-cell v-else :title="inlineFieldTitle" title-width="220rpx">
            <view
              class="flex items-center justify-end gap-12rpx"
              @click="editTimeVisible = true"
            >
              <text
                class="text-28rpx"
                :class="editTime === '' ? 'text-[#999]' : 'text-[#333]'"
              >
                {{
                  editTime === ""
                    ? `请选择${inlineFieldTitle}`
                    : formatDateTime(editTime)
                }}
              </text>
              <text
                v-if="editTime !== ''"
                class="shrink-0 text-26rpx text-[#1677ff]"
                @click.stop="editTime = ''"
              >
                清空
              </text>
            </view>
          </wd-cell>
        </wd-cell-group>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="inlineVisible = false"
          >
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="inlineSaving"
            @click="saveInlineField"
          >
            保存
          </wd-button>
        </view>
      </view>
      <wd-datetime-picker
        v-model="editTime"
        v-model:visible="editTimeVisible"
        type="datetime"
        :title="inlineFieldTitle"
      />
    </wd-popup>

    <!-- 变更状态 -->
    <wd-action-sheet
      v-model="statusVisible"
      :actions="statusActions"
      @select="handleStatusSelect"
    />

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="moreVisible"
      :actions="moreActions"
      @select="handleMoreSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WorkItem } from "@/api/pms/pm/workitem";
import type { WorkItemStatus } from "@/api/pms/pm/workitem/status";
import { useDialog } from "@wot-ui/ui/components/wd-dialog";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import { getProject } from "@/api/pms/pm/project";
import {
  archiveWorkItem,
  getWorkItem,
  recycleWorkItem,
  updateWorkItem,
  updateWorkItemStatus,
} from "@/api/pms/pm/workitem";
import { getWorkItemStatusList } from "@/api/pms/pm/workitem/status";
import { useAccess } from "@/hooks/useAccess";
import IterationFormPicker from "@/pages-pms/pm/iteration/components/iteration-form-picker.vue";
import ProjectMemberFormPicker from "@/pages-pms/pm/project/components/project-member-form-picker.vue";
import WorkItemFormPicker from "@/pages-pms/pm/workitem/components/work-item-form-picker.vue";
import {
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemType,
} from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import {
  formatWorkHours,
  getPriorityName,
  getWorkItemDefectTypeName,
  getWorkItemTypeName,
} from "@/pages-pms/pm/utils/format";
import { navigateBackPlus } from "@/utils";
import { formatDateTime, toTimestamp } from "@/utils/date";
import { getFileNameFromUrl, openAttachment } from "@/utils/download";
import {
  getColorTagStyle,
  isHtmlContent,
  sanitizeRichText,
} from "@/utils/format";
import WorkItemActivity from "./components/work-item-activity.vue";
import WorkItemComment from "./components/work-item-comment.vue";
import WorkItemSubtaskList from "./components/work-item-subtask-list.vue";
import WorkItemWorkLogList from "./components/work-item-worklog-list.vue";

const props = defineProps<{
  id?: number | any;
}>();

definePage({
  style: {
    navigationBarTitleText: "",
    navigationStyle: "custom",
  },
});

const { hasAccessByCodes } = useAccess();
const toast = useToast();
const dialog = useDialog();
const formData = ref<WorkItem>({} as WorkItem); // 工作项详情
const projectType = ref<number>(PmsProjectType.GENERAL); // 项目类型
const editable = ref(false); // 是否允许编辑
const tabIndex = ref(0); // 当前协作信息页签下标
const statusVisible = ref(false); // 变更状态弹窗显示状态
const moreVisible = ref(false); // 更多操作弹窗显示状态
const statusOptions = ref<WorkItemStatus[]>([]); // 可变更的状态选项
const activityRef = ref<InstanceType<typeof WorkItemActivity>>(); // 动态列表引用

const tabs = [
  // 协作信息页签
  { key: "comment", title: "评论" },
  { key: "activity", title: "活动" },
  { key: "subtask", title: "子工作项" },
  { key: "worklog", title: "工时记录" },
];
const activeTab = computed(() => tabs[tabIndex.value].key); // 当前协作信息页签
const workItemTypeName = computed(() =>
  getWorkItemTypeName(formData.value.type || 0),
); // 工作项业务名称
const canUpdate = computed(
  () => editable.value && hasAccessByCodes(["pms:pm:work-item:update"]),
); // 允许更新工作项
const statusActions = computed(() =>
  statusOptions.value.map((item) => ({ name: item.name })),
); // 变更状态操作项
const moreActions = computed(() => {
  // 更多操作项
  if (!canUpdate.value) {
    return [];
  }
  return [{ name: "归档" }, { name: "移入回收站" }];
});

type InlineField =
  | "assigneeUserId"
  | "priority"
  | "iterationId"
  | "relatedRequirementId"
  | "progress"
  | "estimatedHours"
  | "startTime"
  | "endTime";

const inlineVisible = ref(false); // 行内编辑弹窗显示状态
const inlineSaving = ref(false); // 行内编辑保存中
const inlineField = ref<InlineField>("priority"); // 当前编辑的属性
const editValue = ref<any>(); // 当前编辑值（非时间字段）
const editTime = ref<number | "">(""); // 当前编辑值（时间字段），空字符串承接未选择
const editTimeVisible = ref(false); // 时间选择器显示状态

const inlineFieldTitle = computed(
  () =>
    ({
      // 当前编辑属性标题
      assigneeUserId: "负责人",
      priority: "优先级",
      iterationId: "所属迭代",
      relatedRequirementId: "关联需求",
      progress: "完成进度",
      estimatedHours: "预估工时",
      startTime: "开始时间",
      endTime: "截止时间",
    })[inlineField.value],
);

/** 打开属性行内编辑 */
function openInlineEditor(field: InlineField) {
  if (!canUpdate.value || !formData.value.id) {
    return;
  }
  inlineField.value = field;
  if (field === "startTime" || field === "endTime") {
    const raw = formData.value[field];
    editTime.value = raw ? toTimestamp(raw) : "";
  } else {
    editValue.value = formData.value[field];
  }
  inlineVisible.value = true;
}

/** 就地保存工作项属性（合并完整工作项提交，对齐 PC saveInlineWorkItem） */
async function saveInlineField() {
  if (!formData.value.id) {
    return;
  }
  inlineSaving.value = true;
  try {
    const field = inlineField.value;
    const value =
      field === "startTime" || field === "endTime"
        ? editTime.value || undefined
        : editValue.value;
    await updateWorkItem({ ...formData.value, [field]: value });
    toast.success("工作项已更新");
    inlineVisible.value = false;
    await getDetail();
    handleExtensionChanged();
  } finally {
    inlineSaving.value = false;
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus();
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return;
  }
  const workItem = await getWorkItem(Number(props.id));
  const project = await getProject(workItem.projectId);
  formData.value = workItem;
  projectType.value = project.type;
  editable.value = Boolean(
    project.writeStatus &&
      project.status === PmsProjectStatus.ACTIVE &&
      workItem.lifecycleStatus === PmsWorkItemLifecycleStatus.ACTIVE,
  );
}

/** 打开变更状态弹窗 */
async function handleOpenStatusSheet() {
  if (!canUpdate.value || !formData.value.id) {
    return;
  }
  statusOptions.value = await getWorkItemStatusList(
    formData.value.projectId,
    formData.value.type,
  );
  statusVisible.value = true;
}

/** 变更状态选择 */
async function handleStatusSelect({ index }: { index: number }) {
  const status = statusOptions.value[index];
  if (!status || !formData.value.id) {
    return;
  }
  try {
    await updateWorkItemStatus(formData.value.id, status.id);
    toast.success("状态已更新");
    await getDetail();
    handleExtensionChanged();
  } catch {}
}

/** 编辑工作项 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-pms/pm/workitem/form/index?id=${formData.value.id}`,
  });
}

/** 更多操作选择 */
async function handleMoreSelect({ item: action }: { item: { name: string } }) {
  if (!formData.value.id) {
    return;
  }
  try {
    if (action.name === "归档") {
      await dialog.confirm({
        title: "提示",
        msg: `确认归档${workItemTypeName.value}“${formData.value.name}”吗？`,
      });
      await archiveWorkItem(formData.value.id);
      toast.success("归档成功");
    } else if (action.name === "移入回收站") {
      await dialog.confirm({
        title: "提示",
        msg: `确认将${workItemTypeName.value}“${formData.value.name}”移入回收站吗？`,
      });
      await recycleWorkItem(formData.value.id);
      toast.success("已移入回收站");
    }
    uni.$emit("pms:pm:workitem:reload");
    handleBack();
  } catch {}
}

/** 协作信息变化后刷新动态并通知列表页 */
function handleExtensionChanged() {
  activityRef.value?.reload();
  uni.$emit("pms:pm:workitem:reload");
}

/** 初始化 */
onMounted(() => {
  getDetail();
  uni.$on("pms:pm:workitem:reload", getDetail);
});

/** 卸载 */
onUnload(() => {
  uni.$off("pms:pm:workitem:reload", getDetail);
});
</script>
