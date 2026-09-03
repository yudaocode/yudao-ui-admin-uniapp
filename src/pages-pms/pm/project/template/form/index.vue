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

    <scroll-view scroll-y class="min-h-0 flex-1">
      <!-- 基本信息 -->
      <view class="mb-16rpx bg-white py-16rpx">
        <view class="px-24rpx pb-16rpx text-30rpx text-[#333] font-semibold">
          基本信息
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="模板名称" title-width="220rpx" prop="name">
              <wd-input
                v-model="formData.name"
                clearable
                placeholder="请输入模板名称"
                :maxlength="100"
              />
            </wd-form-item>
            <yd-form-picker
              v-model="formData.projectType"
              label="项目类型"
              prop="projectType"
              :columns="projectTypeOptions"
              placeholder="请选择项目类型"
              @confirm="handleProjectTypeChange"
            />
            <wd-form-item title="模板状态" title-width="220rpx" prop="status">
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
            <wd-form-item title="显示顺序" title-width="220rpx" prop="sort">
              <wd-input-number v-model="formData.sort" :min="0" />
            </wd-form-item>
            <wd-form-item
              title="模板描述"
              title-width="220rpx"
              prop="description"
            >
              <wd-textarea
                v-model="formData.description"
                placeholder="请输入模板适用场景"
                :maxlength="500"
                show-word-limit
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </view>

      <!-- 事项类型 -->
      <view class="mb-16rpx bg-white p-24rpx">
        <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
          事项类型
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          项目创建时会根据这里的事项类型初始化可用能力；取消事项类型会同步移除其状态和看板
        </view>
        <wd-checkbox-group
          v-model="formData.itemTypes"
          @change="handleItemTypesChange"
        >
          <wd-checkbox
            v-for="item in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)"
            :key="item.value"
            :name="item.value"
          >
            {{ item.label }}
          </wd-checkbox>
        </wd-checkbox-group>
      </view>

      <!-- 状态配置 -->
      <view class="mb-16rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <view class="text-30rpx text-[#333] font-semibold">
            状态（{{ formData.statuses.length }}）
          </view>
          <wd-button
            size="small"
            type="primary"
            variant="plain"
            @click="handleAddStatus"
          >
            新增状态
          </wd-button>
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          每种事项类型必须且只能配置一个初始状态
        </view>
        <view v-for="group in statusGroups" :key="group.value" class="mb-24rpx">
          <view class="mb-12rpx text-28rpx text-[#666] font-semibold">
            {{ group.label }}（{{ group.statuses.length }}）
          </view>
          <view class="tpl-status-drop">
            <view
              v-for="status in group.statuses"
              :key="status.code || status.sort"
              class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-20rpx"
              :data-global-index="formData.statuses.indexOf(status)"
            >
              <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">
                  {{ status.name || "未命名" }}
                  <text class="text-24rpx text-[#999]"
                    >（{{ status.code || "-" }}）</text
                  >
                </text>
                <wd-tag v-if="status.defaultStatus" type="primary" plain>
                  初始
                </wd-tag>
              </view>
              <view class="mb-12rpx text-24rpx text-[#999]">
                语义状态：{{ getWorkItemStatusTypeName(status.statusType) }}
              </view>
              <view class="flex flex-wrap justify-end gap-12rpx">
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="status.defaultStatus"
                  @click="handleSetDefaultStatus(status)"
                >
                  设为初始
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  @click="handleEditStatus(status)"
                >
                  编辑
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="isFirstStatus(status)"
                  @click="handleMoveStatus(status, -1)"
                >
                  上移
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="isLastStatus(status)"
                  @click="handleMoveStatus(status, 1)"
                >
                  下移
                </wd-button>
                <wd-button
                  size="small"
                  type="danger"
                  variant="plain"
                  @click="handleRemoveStatus(status)"
                >
                  删除
                </wd-button>
              </view>
            </view>
          </view>
        </view>
        <wd-empty v-if="!formData.statuses.length" description="暂无状态配置" />
      </view>

      <!-- 看板配置 -->
      <view class="mb-16rpx bg-white p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <view class="text-30rpx text-[#333] font-semibold">
            看板（{{ formData.boards.length }}）
          </view>
          <wd-button
            size="small"
            type="primary"
            variant="plain"
            @click="handleAddBoard"
          >
            新增看板列
          </wd-button>
        </view>
        <view class="mb-16rpx text-24rpx text-[#999]">
          同一状态只能归属一个看板列
        </view>
        <view class="tpl-board-drop">
          <view
            v-for="(board, index) in formData.boards"
            :key="board.code || index"
            class="mb-16rpx rounded-12rpx bg-[#f7f8fa] p-20rpx"
          >
            <view class="mb-8rpx text-28rpx text-[#333]">
              {{ board.name || "未命名" }}
              <text class="text-24rpx text-[#999]"
                >（{{ board.code || "-" }} ·
                {{ getWorkItemTypeName(board.workItemType) }}）</text
              >
            </view>
            <view class="mb-12rpx text-24rpx text-[#999]">
              关联状态：{{ getBoardStatusNames(board) || "-" }}
            </view>
            <view class="flex justify-end gap-12rpx">
              <wd-button
                size="small"
                variant="plain"
                @click="handleEditBoard(index)"
              >
                编辑
              </wd-button>
              <wd-button
                size="small"
                variant="plain"
                :disabled="index === 0"
                @click="handleMoveBoard(index, -1)"
              >
                上移
              </wd-button>
              <wd-button
                size="small"
                variant="plain"
                :disabled="index === formData.boards.length - 1"
                @click="handleMoveBoard(index, 1)"
              >
                下移
              </wd-button>
              <wd-button
                size="small"
                type="danger"
                variant="plain"
                @click="handleRemoveBoard(index)"
              >
                删除
              </wd-button>
            </view>
          </view>
        </view>
        <wd-empty v-if="!formData.boards.length" description="暂无看板配置" />
      </view>
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

    <!-- 状态编辑弹窗 -->
    <wd-popup v-model="statusVisible" position="bottom" root-portal>
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          编辑状态
        </view>
        <wd-cell-group border>
          <wd-cell title="状态编码" title-width="200rpx">
            <wd-input
              v-model.trim="statusForm.code"
              placeholder="如 task_todo"
              :disabled="!!statusForm.code"
            />
          </wd-cell>
          <wd-cell title="状态名称" title-width="200rpx">
            <wd-input
              v-model.trim="statusForm.name"
              placeholder="请输入状态名称"
            />
          </wd-cell>
          <yd-form-picker
            v-model="statusForm.workItemType"
            label="事项类型"
            label-width="200rpx"
            :columns="enabledWorkItemTypeOptions"
            placeholder="请选择事项类型"
          />
          <yd-form-picker
            v-model="statusForm.statusType"
            label="语义状态"
            label-width="200rpx"
            :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
            placeholder="请选择语义状态"
          />
        </wd-cell-group>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="statusVisible = false"
          >
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleConfirmStatus">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 看板列编辑弹窗 -->
    <wd-popup v-model="boardVisible" position="bottom" root-portal>
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          编辑看板列
        </view>
        <wd-cell-group border>
          <wd-cell title="看板编码" title-width="200rpx">
            <wd-input
              v-model.trim="boardForm.code"
              placeholder="如 todo"
              :disabled="!!boardForm.code"
            />
          </wd-cell>
          <wd-cell title="看板名称" title-width="200rpx">
            <wd-input
              v-model.trim="boardForm.name"
              placeholder="请输入看板列名称"
            />
          </wd-cell>
          <yd-form-picker
            v-model="boardForm.workItemType"
            label="事项类型"
            label-width="200rpx"
            :columns="enabledWorkItemTypeOptions"
            placeholder="请选择事项类型"
            @confirm="boardForm.statusCodes = []"
          />
        </wd-cell-group>
        <view class="mt-24rpx">
          <view class="mb-12rpx text-28rpx text-[#666]"> 关联状态 </view>
          <wd-checkbox-group v-model="boardForm.statusCodes">
            <wd-checkbox
              v-for="status in getBoardStatusOptions()"
              :key="status.code"
              :name="status.code"
            >
              {{ status.name || status.code }}
            </wd-checkbox>
          </wd-checkbox-group>
        </view>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="boardVisible = false"
          >
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleConfirmBoard">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from "@wot-ui/ui/components/wd-form/types";
import type {
  ProjectTemplate,
  ProjectTemplateBoard,
  ProjectTemplateStatus,
} from "@/api/pms/pm/project/template";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import { useDialog } from "@wot-ui/ui/components/wd-dialog";
import {
  createProjectTemplate,
  getProjectTemplate,
  updateProjectTemplate,
} from "@/api/pms/pm/project/template";
import { getIntDictOptions } from "@/hooks/useDict";
import {
  PmsProjectType,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from "@/pages-pms/pm/utils/constants";
import {
  getWorkItemStatusTypeName,
  getWorkItemTypeCode,
  getWorkItemTypeName,
} from "@/pages-pms/pm/utils/format";
import { delay, navigateBackPlus } from "@/utils";
import { CommonStatusEnum, DICT_TYPE } from "@/utils/constants";
import { createFormSchema } from "@/utils/wot";

const props = defineProps<{
  id?: number | any;
}>();

definePage({
  style: {
    navigationBarTitleText: "",
    navigationStyle: "custom",
  },
});

const toast = useToast();
const dialog = useDialog();
const getTitle = computed(() => (props.id ? "编辑项目模板" : "新增项目模板"));
const formLoading = ref(false); // 表单提交状态
const previousProjectType = ref<number>(PmsProjectType.GENERAL); // 切换前的项目类型
const statusVisible = ref(false); // 状态编辑弹窗显示状态
const boardVisible = ref(false); // 看板列编辑弹窗显示状态
const editingBoardIndex = ref(-1); // 当前编辑的看板列下标
const editingStatusIndex = ref(-1); // 当前编辑的状态下标，-1 表示新增
const statusForm = ref<ProjectTemplateStatus>({
  code: "",
  name: "",
  workItemType: PmsWorkItemType.TASK,
  statusType: PmsWorkItemStatusType.PENDING,
  defaultStatus: false,
  sort: 0,
  boardCode: "",
}); // 状态编辑表单
const boardForm = ref<ProjectTemplateBoard>({
  code: "",
  name: "",
  workItemType: PmsWorkItemType.TASK,
  sort: 0,
  statusCodes: [],
}); // 看板列编辑表单
const formData = ref<ProjectTemplate>(getDefaultFormData()); // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: "请输入模板名称" }],
  projectType: [{ required: true, message: "请选择项目类型" }],
  status: [{ required: true, message: "请选择模板状态" }],
});
const formRef = ref<FormInstance>(); // 表单组件引用

const tplSortables: Array<{ destroy: () => void }> = []; // 模板配置拖拽实例

const projectTypeOptions = [
  // 项目类型选项
  { label: "通用项目", value: PmsProjectType.GENERAL },
  { label: "敏捷开发项目", value: PmsProjectType.AGILE },
];
const enabledWorkItemTypeOptions = computed(() =>
  getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)
    .filter((item) => formData.value.itemTypes.includes(item.value))
    .map((item) => ({ ...item })),
); // 已启用的事项类型选项
const statusGroups = computed(() =>
  enabledWorkItemTypeOptions.value
    .map((item) => ({
      ...item,
      statuses: formData.value.statuses.filter(
        (status) => status.workItemType === item.value,
      ),
    }))
    .filter((group) => group.statuses.length > 0),
); // 按事项类型分组的状态列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus("/pages-pms/pm/project/template/index");
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return;
  }
  formData.value = await getProjectTemplate(Number(props.id));
  previousProjectType.value = formData.value.projectType;
}

/** 切换项目类型时恢复对应的默认配置 */
async function handleProjectTypeChange(projectType: number) {
  const previousConfig = getDefaultCollaborationConfig(
    previousProjectType.value,
  );
  const customized =
    JSON.stringify(formData.value.itemTypes) !==
      JSON.stringify(previousConfig.itemTypes) ||
    JSON.stringify(formData.value.statuses) !==
      JSON.stringify(previousConfig.statuses) ||
    JSON.stringify(formData.value.boards) !==
      JSON.stringify(previousConfig.boards);
  if (customized) {
    try {
      await dialog.confirm({
        title: "提示",
        msg: "切换项目类型会恢复默认事项类型、状态和看板，确认继续吗？",
      });
    } catch {
      formData.value.projectType = previousProjectType.value;
      return;
    }
  }
  const config = getDefaultCollaborationConfig(projectType);
  formData.value.itemTypes = config.itemTypes;
  formData.value.statuses = config.statuses;
  formData.value.boards = config.boards;
  previousProjectType.value = projectType;
}

/** 切换事项类型时同步对应的状态和看板 */
function handleItemTypesChange() {
  const itemTypeSet = new Set(formData.value.itemTypes);
  formData.value.statuses = formData.value.statuses.filter((status) =>
    itemTypeSet.has(status.workItemType),
  );
  formData.value.boards = formData.value.boards.filter((board) =>
    itemTypeSet.has(board.workItemType),
  );
  formData.value.itemTypes.forEach((workItemType) => {
    if (
      formData.value.statuses.some(
        (status) => status.workItemType === workItemType,
      )
    ) {
      return;
    }
    const config = getDefaultWorkItemTypeConfig(workItemType);
    formData.value.statuses.push(...config.statuses);
    formData.value.boards.push(...config.boards);
  });
  updateStatusSort();
  updateBoardSort();
}

/** 新增状态 */
function handleAddStatus() {
  if (!formData.value.itemTypes.length) {
    toast.warning("请先选择事项类型");
    return;
  }
  editingStatusIndex.value = -1;
  statusForm.value = {
    code: "",
    name: "",
    workItemType: formData.value.itemTypes[0],
    statusType: PmsWorkItemStatusType.PENDING,
    defaultStatus: false,
    sort: formData.value.statuses.length * 10 + 10,
    boardCode: "",
  };
  statusVisible.value = true;
}

/** 编辑状态 */
function handleEditStatus(status: ProjectTemplateStatus) {
  editingStatusIndex.value = formData.value.statuses.indexOf(status);
  statusForm.value = { ...status };
  statusVisible.value = true;
}

/** 确认状态编辑 */
function handleConfirmStatus() {
  if (!statusForm.value.code || !statusForm.value.name) {
    toast.warning("请完整填写状态编码和名称");
    return;
  }
  if (
    formData.value.statuses.some(
      (item, index) =>
        index !== editingStatusIndex.value &&
        item.code === statusForm.value.code,
    )
  ) {
    toast.warning(`状态编码“${statusForm.value.code}”不能重复`);
    return;
  }
  if (editingStatusIndex.value >= 0) {
    formData.value.statuses[editingStatusIndex.value] = { ...statusForm.value };
  } else {
    formData.value.statuses.push({ ...statusForm.value });
    updateStatusSort();
  }
  statusVisible.value = false;
}

/** 设置事项类型的初始状态 */
function handleSetDefaultStatus(status: ProjectTemplateStatus) {
  formData.value.statuses.forEach((item) => {
    if (item.workItemType === status.workItemType) {
      item.defaultStatus = item === status;
    }
  });
}

/** 初始化模板配置拖拽（仅 H5；上移/下移按钮作为通用兜底保留） */
async function initTplSortable() {
  tplSortables.forEach((instance) => instance.destroy());
  tplSortables.length = 0;
  // #ifdef H5
  const Sortable = (await import("sortablejs")).default;
  // 状态：分组内拖拽换位（与上移/下移同一套语义）
  document.querySelectorAll(".tpl-status-drop").forEach((el) => {
    tplSortables.push(
      Sortable.create(el as HTMLElement, {
        animation: 150,
        onEnd: ({ oldIndex, newIndex, item }) => {
          if (
            oldIndex === undefined ||
            newIndex === undefined ||
            oldIndex === newIndex
          ) {
            return;
          }
          const moved =
            formData.value.statuses[
              Number((item as HTMLElement).dataset.globalIndex)
            ];
          if (!moved) {
            return;
          }
          const group = getStatusGroup(moved);
          const target = group[newIndex];
          if (!target || target === moved) {
            return;
          }
          const from = formData.value.statuses.indexOf(moved);
          const to = formData.value.statuses.indexOf(target);
          formData.value.statuses.splice(from, 1);
          formData.value.statuses.splice(to, 0, moved);
          updateStatusSort();
        },
      }),
    );
  });
  // 看板列：整体拖拽排序
  const boardEl = document.querySelector(".tpl-board-drop");
  if (boardEl) {
    tplSortables.push(
      Sortable.create(boardEl as HTMLElement, {
        animation: 150,
        onEnd: ({ oldIndex, newIndex }) => {
          if (
            oldIndex === undefined ||
            newIndex === undefined ||
            oldIndex === newIndex
          ) {
            return;
          }
          const [board] = formData.value.boards.splice(oldIndex, 1);
          formData.value.boards.splice(newIndex, 0, board);
          updateBoardSort();
        },
      }),
    );
  }
  // #endif
}

/** 获得同事项类型分组内的状态列表 */
function getStatusGroup(status: ProjectTemplateStatus) {
  return formData.value.statuses.filter(
    (item) => item.workItemType === status.workItemType,
  );
}

/** 状态上移/下移：限制在同事项类型分组内交换（对齐 PC 按分组拖拽） */
function handleMoveStatus(status: ProjectTemplateStatus, offset: number) {
  const group = getStatusGroup(status);
  const target = group[group.indexOf(status) + offset];
  if (!target) {
    return;
  }
  const from = formData.value.statuses.indexOf(status);
  const to = formData.value.statuses.indexOf(target);
  formData.value.statuses.splice(from, 1);
  formData.value.statuses.splice(to, 0, status);
  updateStatusSort();
}

/** 是否分组内第一个状态 */
function isFirstStatus(status: ProjectTemplateStatus) {
  return getStatusGroup(status).indexOf(status) === 0;
}

/** 是否分组内最后一个状态 */
function isLastStatus(status: ProjectTemplateStatus) {
  const group = getStatusGroup(status);
  return group.indexOf(status) === group.length - 1;
}

/** 删除状态 */
function handleRemoveStatus(status: ProjectTemplateStatus) {
  const index = formData.value.statuses.indexOf(status);
  if (index < 0) {
    return;
  }
  formData.value.statuses.splice(index, 1);
  formData.value.boards.forEach((board) => {
    board.statusCodes = board.statusCodes.filter(
      (code) => code !== status.code,
    );
  });
  updateStatusSort();
}

/** 新增看板列 */
function handleAddBoard() {
  if (!formData.value.itemTypes.length) {
    toast.warning("请先选择事项类型");
    return;
  }
  editingBoardIndex.value = -1;
  boardForm.value = {
    code: "",
    name: "",
    workItemType: formData.value.itemTypes[0],
    sort: formData.value.boards.length * 10 + 10,
    statusCodes: [],
  };
  boardVisible.value = true;
}

/** 编辑看板列 */
function handleEditBoard(index: number) {
  editingBoardIndex.value = index;
  boardForm.value = {
    ...formData.value.boards[index],
    statusCodes: [...formData.value.boards[index].statusCodes],
  };
  boardVisible.value = true;
}

/** 获得看板列可关联的状态选项（排除已归属其他看板列的状态） */
function getBoardStatusOptions() {
  const selectedStatusCodes = new Set(
    formData.value.boards
      .filter((_, index) => index !== editingBoardIndex.value)
      .flatMap((board) => board.statusCodes),
  );
  return formData.value.statuses.filter(
    (status) =>
      status.workItemType === boardForm.value.workItemType &&
      !selectedStatusCodes.has(status.code),
  );
}

/** 看板列关联状态名称拼接 */
function getBoardStatusNames(board: ProjectTemplateBoard) {
  return board.statusCodes
    .map(
      (code) =>
        formData.value.statuses.find((status) => status.code === code)?.name ||
        code,
    )
    .join("、");
}

/** 确认看板列编辑 */
function handleConfirmBoard() {
  if (!boardForm.value.code || !boardForm.value.name) {
    toast.warning("请完整填写看板编码和名称");
    return;
  }
  if (
    formData.value.boards.some(
      (item, index) =>
        index !== editingBoardIndex.value && item.code === boardForm.value.code,
    )
  ) {
    toast.warning(`看板编码“${boardForm.value.code}”不能重复`);
    return;
  }
  if (editingBoardIndex.value >= 0) {
    formData.value.boards[editingBoardIndex.value] = { ...boardForm.value };
  } else {
    formData.value.boards.push({ ...boardForm.value });
    updateBoardSort();
  }
  boardVisible.value = false;
}

/** 看板列上移/下移 */
function handleMoveBoard(index: number, offset: number) {
  const target = index + offset;
  const [board] = formData.value.boards.splice(index, 1);
  formData.value.boards.splice(target, 0, board);
  updateBoardSort();
}

/** 删除看板列 */
function handleRemoveBoard(index: number) {
  formData.value.boards.splice(index, 1);
  updateBoardSort();
}

/** 按当前顺序更新状态排序值 */
function updateStatusSort() {
  formData.value.statuses.forEach(
    (status, index) => (status.sort = (index + 1) * 10),
  );
}

/** 按当前顺序更新看板排序值 */
function updateBoardSort() {
  formData.value.boards.forEach(
    (board, index) => (board.sort = (index + 1) * 10),
  );
}

/** 校验事项类型、状态和看板配置 */
function validateCollaborationConfig() {
  if (!formData.value.itemTypes.length) {
    toast.warning("请选择事项类型");
    return false;
  }
  // 提交前兜底去重：弹窗确认时已拦截，这里防直接改数据绕过
  const statusCodeSet = new Set<string>();
  for (const status of formData.value.statuses) {
    if (
      !status.code ||
      !status.name ||
      !formData.value.itemTypes.includes(status.workItemType)
    ) {
      toast.warning("请完整填写状态编码、名称和事项类型");
      return false;
    }
    if (statusCodeSet.has(status.code)) {
      toast.warning(`状态编码“${status.code}”不能重复`);
      return false;
    }
    statusCodeSet.add(status.code);
  }
  for (const workItemType of formData.value.itemTypes) {
    const defaultStatusCount = formData.value.statuses.filter(
      (status) => status.workItemType === workItemType && status.defaultStatus,
    ).length;
    if (defaultStatusCount !== 1) {
      toast.warning("每种事项类型必须且只能配置一个初始状态");
      return false;
    }
  }
  const boardCodeSet = new Set<string>();
  const assignedStatusCountMap = new Map<string, number>();
  for (const board of formData.value.boards) {
    if (
      !board.code ||
      !board.name ||
      !formData.value.itemTypes.includes(board.workItemType)
    ) {
      toast.warning("请完整填写看板编码、名称和事项类型");
      return false;
    }
    if (boardCodeSet.has(board.code)) {
      toast.warning(`看板编码“${board.code}”不能重复`);
      return false;
    }
    boardCodeSet.add(board.code);
    for (const statusCode of board.statusCodes) {
      const status = formData.value.statuses.find(
        (item) => item.code === statusCode,
      );
      if (!status || status.workItemType !== board.workItemType) {
        toast.warning("看板只能关联相同事项类型的有效状态");
        return false;
      }
      assignedStatusCountMap.set(
        statusCode,
        (assignedStatusCountMap.get(statusCode) || 0) + 1,
      );
    }
  }
  if (
    formData.value.statuses.some(
      (status) => assignedStatusCountMap.get(status.code) !== 1,
    )
  ) {
    toast.warning("每个状态必须且只能归属一个看板列");
    return false;
  }
  return true;
}

/** 构建提交数据，并同步状态所属的看板列编码 */
function buildSubmitData() {
  const data = JSON.parse(JSON.stringify(formData.value)) as ProjectTemplate;
  const statusBoardMap = new Map<string, string>();
  data.boards.forEach((board) => {
    board.statusCodes.forEach((statusCode) =>
      statusBoardMap.set(statusCode, board.code),
    );
  });
  data.statuses.forEach((status) => {
    status.boardCode = statusBoardMap.get(status.code) || "";
  });
  return data;
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  if (!validateCollaborationConfig()) {
    return;
  }

  formLoading.value = true;
  try {
    const data = buildSubmitData();
    if (props.id) {
      await updateProjectTemplate(data);
      toast.success("修改成功");
    } else {
      await createProjectTemplate(data);
      toast.success("新增成功");
    }
    uni.$emit("pms:pm:project-template:reload");
    delay(handleBack);
  } finally {
    formLoading.value = false;
  }
}

/** 获得默认表单数据 */
function getDefaultFormData(): ProjectTemplate {
  const projectType = PmsProjectType.GENERAL;
  return {
    id: undefined,
    name: "",
    description: "",
    projectType,
    status: CommonStatusEnum.ENABLE,
    sort: 0,
    ...getDefaultCollaborationConfig(projectType),
  };
}

/** 获得项目类型对应的默认协作配置 */
function getDefaultCollaborationConfig(projectType: number) {
  const itemTypes =
    projectType === PmsProjectType.AGILE
      ? [
          PmsWorkItemType.REQUIREMENT,
          PmsWorkItemType.TASK,
          PmsWorkItemType.DEFECT,
        ]
      : [PmsWorkItemType.TASK];
  const configs = itemTypes.map((workItemType) =>
    getDefaultWorkItemTypeConfig(workItemType),
  );
  return {
    itemTypes,
    statuses: configs.flatMap((config) => config.statuses),
    boards: configs.flatMap((config) => config.boards),
  };
}

/** 获得单个事项类型的默认状态和看板 */
function getDefaultWorkItemTypeConfig(workItemType: number) {
  const prefix = getWorkItemTypeCode(workItemType);
  return {
    statuses: [
      createStatus(
        `${prefix}_todo`,
        "待处理",
        workItemType,
        PmsWorkItemStatusType.PENDING,
        true,
        10,
      ),
      createStatus(
        `${prefix}_doing`,
        "进行中",
        workItemType,
        PmsWorkItemStatusType.PROCESSING,
        false,
        20,
      ),
      createStatus(
        `${prefix}_done`,
        "已完成",
        workItemType,
        PmsWorkItemStatusType.COMPLETED,
        false,
        30,
      ),
    ],
    boards: [
      createBoard(`${prefix}_todo`, "待处理", workItemType, 10, [
        `${prefix}_todo`,
      ]),
      createBoard(`${prefix}_doing`, "进行中", workItemType, 20, [
        `${prefix}_doing`,
      ]),
      createBoard(`${prefix}_done`, "已完成", workItemType, 30, [
        `${prefix}_done`,
      ]),
    ],
  };
}

/** 创建默认状态 */
function createStatus(
  code: string,
  name: string,
  workItemType: number,
  statusType: number,
  defaultStatus: boolean,
  sort: number,
): ProjectTemplateStatus {
  return {
    code,
    name,
    workItemType,
    statusType,
    defaultStatus,
    sort,
    boardCode: code,
  };
}

/** 创建默认看板列 */
function createBoard(
  code: string,
  name: string,
  workItemType: number,
  sort: number,
  statusCodes: string[],
): ProjectTemplateBoard {
  return { code, name, workItemType, sort, statusCodes };
}

/** 初始化 */
onMounted(async () => {
  await getDetail();
  await nextTick();
  initTplSortable();
});

/** 卸载 */
onUnmounted(() => {
  tplSortables.forEach((instance) => instance.destroy());
});
</script>
