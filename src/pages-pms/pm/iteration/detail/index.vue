<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="iteration?.name || '迭代详情'"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <template v-if="iteration">
      <!-- 页签 -->
      <view class="bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <!-- 迭代概览 -->
      <scroll-view
        v-if="activeTab === 'overview'"
        scroll-y
        class="min-h-0 flex-1"
      >
        <view class="p-24rpx pb-200rpx">
          <!-- 核心指标 -->
          <view class="grid grid-cols-4 mb-24rpx gap-16rpx">
            <view
              v-for="card in cards"
              :key="card.label"
              class="rounded-12rpx bg-white p-20rpx text-center shadow-sm"
            >
              <view class="text-24rpx text-[#999]">
                {{ card.label }}
              </view>
              <view class="mt-8rpx text-36rpx text-[#333] font-semibold">
                {{ card.value }}
              </view>
            </view>
          </view>

          <!-- 迭代进度 -->
          <view class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-12rpx flex justify-between text-28rpx text-[#666]">
              <text>迭代进度</text>
              <text>{{ overview.progress }}%</text>
            </view>
            <wd-progress :percentage="overview.progress" hide-text />
          </view>

          <!-- 迭代信息 -->
          <wd-cell-group border title="迭代信息">
            <wd-cell
              title="状态"
              :value="getIterationStatusName(iteration.status)"
            />
            <wd-cell
              title="负责人"
              :value="iteration.ownerUserName || '未设置'"
            />
            <wd-cell
              title="开始时间"
              :value="formatDate(iteration.startTime) || '--'"
            />
            <wd-cell
              title="结束时间"
              :value="formatDate(iteration.endTime) || '--'"
            />
            <wd-cell title="迭代目标" :value="iteration.target || '未设置'" />
            <wd-cell
              title="参与成员"
              :value="teamNames.join('、') || '暂无参与成员'"
            />
            <wd-cell
              title="迭代描述"
              :value="iteration.description || '暂无描述'"
            />
          </wd-cell-group>

          <!-- 当前状态分布 -->
          <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
              当前状态分布
            </view>
            <view
              v-for="item in statusDistribution"
              :key="item.name"
              class="mb-16rpx flex items-center gap-16rpx"
            >
              <text class="w-96rpx shrink-0 text-26rpx text-[#666]">{{
                item.name
              }}</text>
              <wd-progress
                class="flex-1"
                :percentage="getTypePercentage(item.count)"
                hide-text
              />
              <text
                class="w-48rpx shrink-0 text-right text-26rpx text-[#333] font-semibold"
                >{{ item.count }}</text
              >
            </view>
          </view>

          <!-- 事项分布 -->
          <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
              事项分布
            </view>
            <view
              v-if="!overview.totalCount"
              class="py-40rpx text-center text-28rpx text-[#999]"
            >
              暂无事项
            </view>
            <template v-else>
              <view
                v-for="row in typeStatusRows"
                :key="row.type"
                class="mb-20rpx last:mb-0"
              >
                <view
                  class="mb-8rpx flex items-center justify-between text-26rpx"
                >
                  <text class="text-[#666]">{{ row.name }}</text>
                  <text class="text-[#333] font-semibold">{{ row.total }}</text>
                </view>
                <view
                  class="h-16rpx flex overflow-hidden rounded-8rpx bg-[#f0f0f0]"
                >
                  <view
                    v-for="segment in row.segments"
                    :key="segment.name"
                    :style="{
                      width: `${segment.percent}%`,
                      backgroundColor: segment.color,
                    }"
                  />
                </view>
                <view class="mt-4rpx text-22rpx text-[#999]">
                  已完成 {{ row.completed }} · 进行中 {{ row.processing }} ·
                  未开始 {{ row.pending }}
                </view>
              </view>
            </template>
          </view>

          <!-- 事项状态趋势 -->
          <view
            v-if="overview.statusTrends.length"
            class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-16rpx flex items-center justify-between">
              <text class="text-30rpx text-[#333] font-semibold"
                >事项状态趋势</text
              >
              <text class="text-24rpx text-[#999]">柱形为每日已完成事项数</text>
            </view>
            <TrendBars
              :values="statusTrendCompletedValues"
              height="240rpx"
              color="#36b37e"
            />
            <view class="mt-8rpx flex justify-between text-22rpx text-[#999]">
              <text>{{ statusTrendDateRange[0] }}</text>
              <text>{{ statusTrendDateRange[1] }}</text>
            </view>
            <view
              v-if="latestStatusTrend"
              class="mt-8rpx text-24rpx text-[#666]"
            >
              最新（{{ latestStatusTrend.date.slice(5) }}）：已完成
              {{ latestStatusTrend.completedCount }} · 进行中
              {{ latestStatusTrend.processingCount }} · 未开始
              {{ latestStatusTrend.pendingCount }}
            </view>
          </view>

          <!-- 燃尽数据 -->
          <view
            v-if="overview.burnDowns.length"
            class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-16rpx flex items-center justify-between">
              <text class="text-30rpx text-[#333] font-semibold"
                >燃尽数据（单位：小时）</text
              >
              <text class="text-24rpx text-[#999]">柱形为每日实际剩余工时</text>
            </view>
            <TrendBars :values="burnDownActualValues" height="240rpx" />
            <view class="mt-8rpx flex justify-between text-22rpx text-[#999]">
              <text>{{ burnDownDateRange[0] }}</text>
              <text>{{ burnDownDateRange[1] }}</text>
            </view>
            <view v-if="latestBurnDown" class="mt-8rpx text-24rpx text-[#666]">
              最新（{{ latestBurnDown.date.slice(5) }}）：实际剩余
              {{ latestBurnDown.actualRemaining }} · 理想剩余
              {{ latestBurnDown.idealRemaining }}
            </view>
          </view>

          <!-- 最近活动 -->
          <view class="mt-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx text-30rpx text-[#333] font-semibold">
              最近活动
            </view>
            <view
              v-if="!overview.recentActivities.length"
              class="py-40rpx text-center text-28rpx text-[#999]"
            >
              暂无活动
            </view>
            <view
              v-for="activity in overview.recentActivities"
              :key="activity.id"
              class="border-t border-[#f0f0f0] py-16rpx first:border-t-0"
            >
              <view class="text-28rpx text-[#333]">
                <text class="font-semibold">{{
                  activity.operatorUserName || "系统"
                }}</text>
                {{ activity.content }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                #{{ activity.workItemSerialNumber }}
                {{ activity.workItemName }} ·
                {{ formatDateTime(activity.createTime) }}
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 迭代事项 -->
      <view v-else class="min-h-0 flex flex-1 flex-col">
        <view class="bg-white">
          <wd-tabs v-model="workItemTabIndex" slidable="always">
            <wd-tab
              v-for="tab in workItemTabs"
              :key="tab.key"
              :title="tab.title"
            />
          </wd-tabs>
        </view>
        <view class="min-h-0 flex-1">
          <WorkItemSection
            :key="activeWorkItemTab"
            :project-id="iteration.projectId"
            :project-type="project?.type || PmsProjectType.AGILE"
            :type="getWorkItemTabType()"
            :iteration-id="iteration.id"
            :editable="editable"
            @changed="getOverview"
          />
        </view>
      </view>

      <!-- 底部操作 -->
      <view v-if="editable" class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button
            v-if="
              iteration.status === PmsIterationStatus.PLANNED &&
              hasAccessByCodes(['pms:pm:iteration:update'])
            "
            type="primary"
            class="flex-1"
            @click="startPopupRef?.open(iteration)"
          >
            开始迭代
          </wd-button>
          <wd-button
            v-if="
              iteration.status === PmsIterationStatus.ACTIVE &&
              hasAccessByCodes(['pms:pm:iteration:update'])
            "
            type="primary"
            class="flex-1"
            @click="handleComplete"
          >
            完成迭代
          </wd-button>
          <wd-button variant="plain" class="flex-1" @click="moreVisible = true">
            更多
          </wd-button>
        </view>
      </view>
    </template>

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="moreVisible"
      :actions="moreActions"
      @select="handleMoreSelect"
    />

    <!-- 开始迭代弹窗 -->
    <IterationStartPopup ref="startPopupRef" @success="refreshIteration" />
  </view>
</template>

<script lang="ts" setup>
import type { Iteration, IterationOverview } from "@/api/pms/pm/iteration";
import type { WorkItem } from "@/api/pms/pm/workitem";
import type { Project } from "@/api/pms/pm/project";
import IterationStartPopup from "@/pages-pms/pm/iteration/components/iteration-start-popup.vue";
import { useDialog } from "@wot-ui/ui/components/wd-dialog";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import {
  completeIteration,
  deleteIteration,
  getIteration,
  getIterationOverview,
} from "@/api/pms/pm/iteration";
import { getProject } from "@/api/pms/pm/project";
import { getWorkItemPage } from "@/api/pms/pm/workitem";
import { useAccess } from "@/hooks/useAccess";
import TrendBars from "@/pages-pms/pm/components/trend-bars.vue";
import WorkItemSection from "@/pages-pms/pm/workitem/components/work-item-section.vue";
import {
  PmsIterationStatus,
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import { getIterationStatusName } from "@/pages-pms/pm/utils/format";
import { navigateBackPlus } from "@/utils";
import { formatDate, formatDateTime } from "@/utils/date";
import { getAllPageItems } from "@/utils/page";

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
const iteration = ref<Iteration>(); // 当前迭代
const project = ref<Project>(); // 所属项目
const tabIndex = ref(0); // 当前详情页签下标
const workItemTabIndex = ref(0); // 当前事项类型页签下标
const moreVisible = ref(false); // 更多操作弹窗显示状态
const startPopupRef = ref<InstanceType<typeof IterationStartPopup>>(); // 开始迭代弹窗引用
const workItems = ref<WorkItem[]>([]); // 迭代内工作项（用于聚合参与成员）
const overview = ref<IterationOverview>({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  completedCount: 0,
  progress: 0,
  typeCountMap: {},
  typeStatusCountMap: {},
  statusTrends: [],
  burnDowns: [],
  recentActivities: [],
}); // 迭代概览

const tabs = computed(() => [
  // 详情页签
  { key: "overview", title: "概览" },
  { key: "items", title: `事项（${overview.value.totalCount}）` },
]);
const workItemTabs = [
  // 事项类型页签
  { key: "all", title: "全部" },
  { key: "requirement", title: "需求" },
  { key: "task", title: "任务" },
  { key: "defect", title: "缺陷" },
];
const activeTab = computed(() => tabs.value[tabIndex.value].key); // 当前详情页签
const activeWorkItemTab = computed(
  () => workItemTabs[workItemTabIndex.value].key,
); // 当前事项类型页签
const editable = computed(() =>
  Boolean(
    project.value?.writeStatus &&
      project.value.status === PmsProjectStatus.ACTIVE,
  ),
); // 是否允许编辑迭代
const cards = computed(() => [
  // 核心指标卡片
  { label: "总事项", value: overview.value.totalCount },
  { label: "未开始", value: overview.value.pendingCount },
  { label: "进行中", value: overview.value.processingCount },
  { label: "已完成", value: overview.value.completedCount },
]);
const typeDistribution = computed(() =>
  getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE).map((option) => ({
    type: option.value,
    name: option.label,
    count: overview.value.typeCountMap[option.value] || 0,
  })),
); // 事项类型分布
const statusDistribution = computed(() => {
  const statusCountMap = {
    [PmsWorkItemStatusType.PENDING]: overview.value.pendingCount,
    [PmsWorkItemStatusType.PROCESSING]: overview.value.processingCount,
    [PmsWorkItemStatusType.COMPLETED]: overview.value.completedCount,
  };
  return getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE).map(
    (option) => ({
      name: option.label,
      count: statusCountMap[option.value],
    }),
  );
}); // 当前状态分布
const teamNames = computed(() => {
  // 迭代参与成员：聚合迭代内工作项的负责人与参与人
  const names = new Set<string>();
  workItems.value.forEach((item) => {
    if (item.assigneeUserName) {
      names.add(item.assigneeUserName);
    }
    item.memberUserNames?.forEach((name) => names.add(name));
  });
  return Array.from(names);
});
const TYPE_STATUS_COLORS = [
  // 事项分布状态配色（已完成/进行中/未开始，对齐原图表）
  { name: "已完成", key: PmsWorkItemStatusType.COMPLETED, color: "#36b37e" },
  { name: "进行中", key: PmsWorkItemStatusType.PROCESSING, color: "#ffab00" },
  { name: "未开始", key: PmsWorkItemStatusType.PENDING, color: "#0065ff" },
] as const;
const typeStatusRows = computed(() =>
  // 事项类型 × 状态分布行
  typeDistribution.value.map((item) => {
    const completed =
      overview.value.typeStatusCountMap[item.type]?.[
        PmsWorkItemStatusType.COMPLETED
      ] || 0;
    const processing =
      overview.value.typeStatusCountMap[item.type]?.[
        PmsWorkItemStatusType.PROCESSING
      ] || 0;
    const pending =
      overview.value.typeStatusCountMap[item.type]?.[
        PmsWorkItemStatusType.PENDING
      ] || 0;
    const total = completed + processing + pending;
    const countMap: Record<number, number> = {
      // 按状态类型聚合计数，供配色段取数
      [PmsWorkItemStatusType.COMPLETED]: completed,
      [PmsWorkItemStatusType.PROCESSING]: processing,
      [PmsWorkItemStatusType.PENDING]: pending,
    };
    return {
      type: item.type,
      name: item.name,
      total,
      completed,
      processing,
      pending,
      segments: TYPE_STATUS_COLORS.map((segment) => ({
        name: segment.name,
        color: segment.color,
        percent:
          total > 0 ? Math.round((countMap[segment.key] / total) * 100) : 0,
      })),
    };
  }),
);
const statusTrendCompletedValues = computed(() =>
  overview.value.statusTrends.map((item) => item.completedCount),
); // 事项状态趋势：每日已完成数量
const statusTrendDateRange = computed(() => {
  // 趋势起止日期（MM-DD）
  const trends = overview.value.statusTrends;
  if (!trends.length) {
    return [];
  }
  return [trends[0].date.slice(5), trends[trends.length - 1].date.slice(5)];
});
const latestStatusTrend = computed(
  () => overview.value.statusTrends[overview.value.statusTrends.length - 1],
); // 最新一天状态计数
const burnDownActualValues = computed(() =>
  overview.value.burnDowns.map((item) => item.actualRemaining),
); // 燃尽数据：每日实际剩余工时
const burnDownDateRange = computed(() => {
  // 燃尽起止日期（MM-DD）
  const burnDowns = overview.value.burnDowns;
  if (!burnDowns.length) {
    return [];
  }
  return [
    burnDowns[0].date.slice(5),
    burnDowns[burnDowns.length - 1].date.slice(5),
  ];
});
const latestBurnDown = computed(
  () => overview.value.burnDowns[overview.value.burnDowns.length - 1],
); // 最新一天燃尽数据
const moreActions = computed(() => {
  // 更多操作项
  const actions: Array<{ name: string }> = [];
  if (hasAccessByCodes(["pms:pm:iteration:update"])) {
    actions.push({ name: "编辑迭代" });
  }
  if (hasAccessByCodes(["pms:pm:iteration:delete"])) {
    actions.push({ name: "删除迭代" });
  }
  return actions;
});

/** 返回上一页 */
function handleBack() {
  navigateBackPlus();
}

/** 获得当前事项页签对应的工作项类型 */
function getWorkItemTabType() {
  return {
    requirement: PmsWorkItemType.REQUIREMENT,
    task: PmsWorkItemType.TASK,
    defect: PmsWorkItemType.DEFECT,
  }[activeWorkItemTab.value];
}

/** 查询迭代概览 */
async function getOverview() {
  if (!iteration.value?.id) {
    return;
  }
  // 概览统计与迭代内工作项并行加载（工作项用于聚合参与成员）
  const [currentOverview, items] = await Promise.all([
    getIterationOverview(iteration.value.id),
    getAllPageItems((pageNo, pageSize) =>
      getWorkItemPage({
        pageNo,
        pageSize,
        projectId: iteration.value!.projectId,
        iterationId: iteration.value!.id,
      }),
    ),
  ]);
  overview.value = currentOverview;
  workItems.value = items;
}

/** 计算数量占比 */
function getTypePercentage(count: number) {
  return overview.value.totalCount > 0
    ? Math.round((count * 100) / overview.value.totalCount)
    : 0;
}

/** 更多操作选择 */
async function handleMoreSelect({ item: action }: { item: { name: string } }) {
  if (!iteration.value?.id) {
    return;
  }
  if (action.name === "编辑迭代") {
    uni.navigateTo({
      url: `/pages-pms/pm/iteration/form/index?id=${iteration.value.id}&projectId=${iteration.value.projectId}`,
    });
    return;
  }
  try {
    await dialog.confirm({
      title: "提示",
      msg: `确认删除迭代“${iteration.value.name}”吗？`,
    });
    await deleteIteration(iteration.value.id);
    toast.success("删除成功");
    uni.$emit("pms:pm:iteration:reload"); // 通知返回栈上的迭代列表刷新
    handleBack();
  } catch {}
}

/** 完成迭代 */
async function handleComplete() {
  if (!iteration.value?.id) {
    return;
  }
  try {
    await dialog.confirm({
      title: "提示",
      msg: `确认完成迭代“${iteration.value.name}”吗？`,
    });
    await completeIteration(iteration.value.id);
    toast.success("迭代已完成");
    await refreshIteration();
  } catch {}
}

/** 刷新迭代详情和概览 */
async function refreshIteration() {
  if (!iteration.value?.id) {
    return;
  }
  iteration.value = await getIteration(iteration.value.id);
  await getOverview();
  uni.$emit("pms:pm:iteration:reload");
}

/** 初始化 */
onMounted(async () => {
  if (!props.id) {
    return;
  }
  iteration.value = await getIteration(Number(props.id));
  project.value = await getProject(iteration.value.projectId);
  await getOverview();
  uni.$on("pms:pm:iteration:reload", handleIterationReload);
});

/** 迭代编辑后刷新详情 */
async function handleIterationReload() {
  if (!iteration.value?.id) {
    return;
  }
  const current = await getIteration(iteration.value.id);
  iteration.value = current;
}

/** 卸载 */
onUnload(() => {
  uni.$off("pms:pm:iteration:reload", handleIterationReload);
});
</script>
