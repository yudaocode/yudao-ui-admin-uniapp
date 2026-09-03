<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            :title="`${workItemTypeName}标题`"
            title-width="220rpx"
            prop="name"
          >
            <wd-input
              v-model="formData.name"
              clearable
              :placeholder="`请输入${workItemTypeName}标题`"
              :maxlength="100"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.priority"
            label="优先级"
            prop="priority"
            :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
            placeholder="请选择优先级"
          />
          <ProjectMemberFormPicker
            v-model="formData.assigneeUserId"
            :project-id="projectId"
            label="负责人"
            prop="assigneeUserId"
            clearable
          />
          <wd-form-item title="开始时间" title-width="220rpx" prop="startTime">
            <view
              class="flex items-center justify-end gap-12rpx"
              @click="startTimeVisible = true"
            >
              <text
                class="text-28rpx"
                :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'"
              >
                {{
                  startTime === ""
                    ? "请选择开始时间"
                    : formatDateTime(startTime)
                }}
              </text>
              <text
                v-if="startTime !== ''"
                class="shrink-0 text-26rpx text-[#1677ff]"
                @click.stop="startTime = ''"
              >
                清空
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="截止时间" title-width="220rpx" prop="endTime">
            <view
              class="flex items-center justify-end gap-12rpx"
              @click="endTimeVisible = true"
            >
              <text
                class="text-28rpx"
                :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'"
              >
                {{
                  endTime === "" ? "请选择截止时间" : formatDateTime(endTime)
                }}
              </text>
              <text
                v-if="endTime !== ''"
                class="shrink-0 text-26rpx text-[#1677ff]"
                @click.stop="endTime = ''"
              >
                清空
              </text>
            </view>
          </wd-form-item>
          <IterationFormPicker
            v-if="projectType === PmsProjectType.AGILE"
            v-model="formData.iterationId"
            :project-id="projectId"
            prop="iterationId"
          />
          <WorkItemFormPicker
            v-model="formData.parentId"
            :project-id="projectId"
            :type="type"
            :exclude-id="formData.id"
            label="父级工作项"
            prop="parentId"
          />
          <WorkItemFormPicker
            v-if="
              projectType === PmsProjectType.AGILE &&
              type !== PmsWorkItemType.REQUIREMENT
            "
            v-model="formData.relatedRequirementId"
            :project-id="projectId"
            :type="PmsWorkItemType.REQUIREMENT"
            label="关联需求"
            prop="relatedRequirementId"
            placeholder="请选择关联需求"
          />
          <yd-form-picker
            v-if="type === PmsWorkItemType.DEFECT"
            v-model="formData.defectType"
            label="缺陷类型"
            prop="defectType"
            :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE)"
            placeholder="请选择缺陷类型"
          />
          <wd-form-item
            title="预估工时"
            title-width="220rpx"
            prop="estimatedHours"
          >
            <wd-input-number
              v-model="formData.estimatedHours"
              allow-null
              :min="0"
              :precision="1"
            />
          </wd-form-item>
          <wd-form-item title="完成进度" title-width="220rpx" prop="progress">
            <wd-input-number
              v-model="formData.progress"
              :min="0"
              :max="100"
              placeholder="0 ~ 100"
            />
          </wd-form-item>
          <ProjectMemberFormPicker
            v-model="formData.memberUserIds"
            :project-id="projectId"
            type="checkbox"
            label="参与人"
            prop="memberUserIds"
            placeholder="请选择参与人"
          />
          <WorkItemLabelFormPicker
            ref="labelPickerRef"
            v-model="formData.labelIds"
            prop="labelIds"
          />
          <wd-form-item title="标签管理" title-width="220rpx">
            <wd-button
              size="small"
              variant="plain"
              @click="labelManageRef?.open()"
            >
              管理标签
            </wd-button>
          </wd-form-item>
          <wd-form-item
            :title="`${workItemTypeName}描述`"
            title-width="220rpx"
            prop="description"
          >
            <wd-textarea
              v-model="formData.description"
              placeholder="请输入描述"
              :maxlength="2000"
              show-word-limit
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" />
          </wd-form-item>
          <template v-if="!props.id">
            <wd-form-item title="子工作项" title-width="220rpx">
              <view class="w-full">
                <view
                  v-for="(_, index) in formData.childWorkItemNames"
                  :key="index"
                  class="mb-12rpx flex items-center gap-12rpx"
                >
                  <wd-input
                    v-model="formData.childWorkItemNames![index]"
                    class="flex-1"
                    placeholder="请输入子工作项标题"
                    :maxlength="100"
                  />
                  <wd-button
                    size="small"
                    type="danger"
                    variant="plain"
                    @click="formData.childWorkItemNames?.splice(index, 1)"
                  >
                    删除
                  </wd-button>
                </view>
                <wd-button
                  size="small"
                  variant="plain"
                  @click="formData.childWorkItemNames?.push('')"
                >
                  添加子工作项
                </wd-button>
              </view>
            </wd-form-item>
            <wd-form-item
              title="实际投入"
              title-width="220rpx"
              prop="actualHours"
            >
              <wd-input-number
                v-model="formData.actualHours"
                allow-null
                :min="1"
                :precision="1"
              />
            </wd-form-item>
            <wd-form-item
              title="剩余工时"
              title-width="220rpx"
              prop="remainingHours"
            >
              <wd-input-number
                v-model="formData.remainingHours"
                allow-null
                :min="0"
                :precision="1"
              />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker
        v-model="startTime"
        v-model:visible="startTimeVisible"
        type="datetime"
        title="开始时间"
      />
      <wd-datetime-picker
        v-model="endTime"
        v-model:visible="endTimeVisible"
        type="datetime"
        title="截止时间"
      />
    </scroll-view>

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

    <!-- 标签管理 -->
    <WorkItemLabelManage
      ref="labelManageRef"
      @success="labelPickerRef?.reload()"
    />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from "@wot-ui/ui/components/wd-form/types";
import type { WorkItem } from "@/api/pms/pm/workitem";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import { getProject } from "@/api/pms/pm/project";
import {
  createWorkItem,
  getWorkItem,
  updateWorkItem,
} from "@/api/pms/pm/workitem";
import IterationFormPicker from "@/pages-pms/pm/iteration/components/iteration-form-picker.vue";
import ProjectMemberFormPicker from "@/pages-pms/pm/project/components/project-member-form-picker.vue";
import {
  PmsProjectType,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType,
} from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import { getWorkItemTypeName } from "@/pages-pms/pm/utils/format";
import { delay, navigateBackPlus } from "@/utils";
import { formatDateTime, toTimestamp } from "@/utils/date";
import { createFormSchema } from "@/utils/wot";
import WorkItemFormPicker from "../components/work-item-form-picker.vue";
import WorkItemLabelFormPicker from "../components/work-item-label-form-picker.vue";
import WorkItemLabelManage from "../components/work-item-label-manage.vue";

const props = defineProps<{
  id?: number | any;
  projectId?: number | any; // 新建时由入口传入
  projectType?: number | any; // 新建时由入口传入
  type?: number | any; // 新建时由入口传入
  iterationId?: number | any; // 新建时由入口传入
}>();

definePage({
  style: {
    navigationBarTitleText: "",
    navigationStyle: "custom",
  },
});

const toast = useToast();
const projectId = ref(0); // 项目编号
const projectType = ref<number>(PmsProjectType.GENERAL); // 项目类型
const type = ref<number>(PmsWorkItemType.TASK); // 工作项类型
const formLoading = ref(false); // 表单提交状态
const startTime = ref<number | "">(""); // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | "">(""); // 截止时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false); // 开始时间选择器显示状态
const endTimeVisible = ref(false); // 截止时间选择器显示状态
const labelPickerRef = ref<InstanceType<typeof WorkItemLabelFormPicker>>(); // 标签选择器引用
const labelManageRef = ref<InstanceType<typeof WorkItemLabelManage>>(); // 标签管理弹窗引用
const formData = ref<WorkItem>(getDefaultFormData()); // 表单数据
const formRef = ref<FormInstance>(); // 表单组件引用

const workItemTypeName = computed(() => getWorkItemTypeName(type.value)); // 工作项业务名称
const getTitle = computed(
  () => `${props.id ? "编辑" : "新建"}${workItemTypeName.value}`,
);
const formSchema = computed(() =>
  createFormSchema({
    name: [
      { required: true, message: `${workItemTypeName.value}标题不能为空` },
    ],
    priority: [{ required: true, message: "优先级不能为空" }],
    defectType:
      type.value === PmsWorkItemType.DEFECT
        ? [{ required: true, message: "缺陷类型不能为空" }]
        : [],
  }),
);

/** 返回上一页 */
function handleBack() {
  navigateBackPlus();
}

/** 加载详情 */
async function getDetail() {
  if (props.id) {
    // 修改场景通过工作项详情确定项目和事项类型
    const workItem = await getWorkItem(Number(props.id));
    projectId.value = workItem.projectId;
    type.value = workItem.type;
    projectType.value = (await getProject(workItem.projectId)).type;
    formData.value = {
      ...workItem,
      fileUrls: workItem.fileUrls ?? [],
      labelIds: workItem.labelIds ?? [],
    };
    // 后端返回日期字符串，转毫秒时间戳供 picker 回显
    startTime.value = workItem.startTime ? toTimestamp(workItem.startTime) : "";
    endTime.value = workItem.endTime ? toTimestamp(workItem.endTime) : "";
    return;
  }
  // 新建场景由业务入口提供项目和事项类型
  projectId.value = Number(props.projectId);
  projectType.value = Number(props.projectType);
  type.value = Number(props.type);
  formData.value = getDefaultFormData();
  formData.value.iterationId = props.iterationId
    ? Number(props.iterationId)
    : undefined;
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  // 工作项时间范围校验：开始时间必须早于截止时间
  if (
    startTime.value &&
    endTime.value &&
    Number(startTime.value) >= Number(endTime.value)
  ) {
    toast.warning("开始时间必须早于截止时间");
    return;
  }

  formLoading.value = true;
  try {
    const data = {
      ...formData.value,
      startTime: startTime.value || undefined,
      endTime: endTime.value || undefined,
    };
    if (props.id) {
      await updateWorkItem(data);
      toast.success("更新成功");
    } else {
      await createWorkItem(data);
      toast.success("创建成功");
    }
    uni.$emit("pms:pm:workitem:reload");
    delay(handleBack);
  } finally {
    formLoading.value = false;
  }
}

/** 获得表单默认值 */
function getDefaultFormData(): WorkItem {
  return {
    projectId: projectId.value,
    type: type.value,
    name: "",
    priority: PmsWorkItemPriority.MEDIUM,
    memberUserIds: [],
    progress: 0,
    defectType:
      type.value === PmsWorkItemType.DEFECT
        ? PmsWorkItemDefectType.FUNCTION
        : undefined,
    fileUrls: [],
    labelIds: [],
    childWorkItemNames: [],
  };
}

/** 初始化 */
onMounted(() => {
  getDetail();
});
</script>
