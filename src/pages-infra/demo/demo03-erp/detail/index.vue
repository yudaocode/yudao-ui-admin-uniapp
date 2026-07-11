<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="学生详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="pb-160rpx">
      <!-- 主表 -->
      <wd-cell-group border title="学生信息">
        <wd-cell title="名字" :value="formData?.name ?? '-'" />
        <wd-cell title="性别">
          <dict-tag :type="DICT_TYPE.SYSTEM_USER_SEX" :value="formData?.sex" />
        </wd-cell>
        <wd-cell title="出生日期" :value="formData?.birthday ? formatDate(formData.birthday) : '-'" />
        <wd-cell title="简介" :value="formData?.description ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>

      <!-- 子表：学生课程（独立 CRUD） -->
      <view class="mt-20rpx flex items-center justify-between px-24rpx py-16rpx">
        <text class="text-28rpx text-[#333] font-semibold">学生课程（{{ courseTotal }}）</text>
        <wd-button
          v-if="hasAccessByCodes(['infra:demo03-student:create'])"
          size="small" type="primary" variant="plain" @click="openCourse()"
        >
          添加课程
        </wd-button>
      </view>
      <view class="px-24rpx">
        <z-paging
          ref="coursePagingRef"
          v-model="courses"
          :fixed="false"
          :auto="false"
          height="640rpx"
          :default-page-size="10"
          :refresher-enabled="false"
          :inside-more="true"
          :to-bottom-loading-more-enabled="false"
          loading-more-default-text="点击加载更多"
          loading-more-no-more-text="没有更多课程了"
          empty-view-text="暂无课程"
          @query="queryCourseList"
        >
          <view
            v-for="course in courses"
            :key="course.id"
            class="mb-16rpx flex items-center gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="min-w-0 flex-1">
              <text class="text-30rpx text-[#333]">{{ course.name }}</text>
              <text class="ml-16rpx text-26rpx text-[#1677ff]">{{ course.score ?? '-' }} 分</text>
            </view>
            <wd-button size="small" variant="plain" @click="openCourse(course)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="removeCourse(course)">
              删除
            </wd-button>
          </view>
        </z-paging>
      </view>

      <!-- 子表：学生班级（独立 CRUD） -->
      <view class="mt-20rpx flex items-center justify-between px-24rpx py-16rpx">
        <text class="text-28rpx text-[#333] font-semibold">学生班级（{{ grades.length }}）</text>
        <wd-button
          v-if="grades.length === 0 && hasAccessByCodes(['infra:demo03-student:create'])"
          size="small" type="primary" variant="plain" @click="openGrade()"
        >
          添加班级
        </wd-button>
      </view>
      <view class="px-24rpx">
        <view v-if="!grades.length" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
          暂无班级
        </view>
        <view
          v-for="item in grades"
          :key="item.id"
          class="mb-16rpx flex items-center gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="min-w-0 flex-1">
            <text class="text-30rpx text-[#333]">{{ item.name }}</text>
            <text class="ml-16rpx text-26rpx text-[#999]">班主任：{{ item.teacher || '-' }}</text>
          </view>
          <wd-button size="small" variant="plain" @click="openGrade(item)">
            编辑
          </wd-button>
          <wd-button size="small" type="danger" variant="plain" @click="removeGrade(item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮（主表） -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['infra:demo03-student:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['infra:demo03-student:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Demo03Course, Demo03Grade, Demo03Student } from '@/api/infra/demo/demo03/erp'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onShow } from '@dcloudio/uni-app'
import { nextTick, ref } from 'vue'
import {
  deleteDemo03Course,
  deleteDemo03Grade,
  deleteDemo03Student,
  getDemo03CoursePage,
  getDemo03GradePage,
  getDemo03Student,
} from '@/api/infra/demo/demo03/erp'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<Demo03Student>() // 主表数据
const courses = ref<Demo03Course[]>([]) // 学生课程
const courseTotal = ref(0) // 课程总数
const coursePagingRef = ref<ZPagingRef<Demo03Course>>() // 课程分页组件引用
const grades = ref<Demo03Grade[]>([]) // 学生班级
const deleting = ref(false) // 主表删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/demo/demo03-erp/index')
}

/** 加载主表 */
async function loadStudent() {
  if (!props.id) {
    return
  }
  formData.value = await getDemo03Student(Number(props.id))
}

/** 查询课程列表 */
async function queryCourseList(pageNo: number, pageSize: number) {
  if (!props.id) {
    courseTotal.value = 0
    coursePagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getDemo03CoursePage({ studentId: Number(props.id), pageNo, pageSize })
    courseTotal.value = data.total
    coursePagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    coursePagingRef.value?.complete(false)
  }
}

/** 刷新课程列表 */
function reloadCourseList() {
  coursePagingRef.value?.reload()
}

/** 加载班级 */
async function loadGrades() {
  if (!props.id) {
    grades.value = []
    return
  }
  const data = await getDemo03GradePage({ studentId: Number(props.id), pageNo: 1, pageSize: 1 })
  grades.value = data.list
}

/** 跳转课程 form（无参为新增） */
function openCourse(course?: Demo03Course) {
  const idParam = course?.id ? `&id=${course.id}` : ''
  uni.navigateTo({ url: `/pages-infra/demo/demo03-erp/course/form/index?studentId=${props.id}${idParam}` })
}

/** 删除课程 */
async function removeCourse(course: Demo03Course) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该课程吗？' })
  } catch {
    return
  }
  await deleteDemo03Course(course.id!)
  toast.success('删除成功')
  reloadCourseList()
}

/** 跳转班级 form（无参为新增） */
function openGrade(grade?: Demo03Grade) {
  const idParam = grade?.id ? `&id=${grade.id}` : ''
  uni.navigateTo({ url: `/pages-infra/demo/demo03-erp/grade/form/index?studentId=${props.id}${idParam}` })
}

/** 删除班级 */
async function removeGrade(grade: Demo03Grade) {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该班级吗？' })
  } catch {
    return
  }
  await deleteDemo03Grade(grade.id!)
  toast.success('删除成功')
  await loadGrades()
}

/** 编辑主表 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-infra/demo/demo03-erp/form/index?id=${props.id}` })
}

/** 删除主表 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该学生吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDemo03Student(Number(props.id))
    toast.success('删除成功')
    uni.$emit('infra:demo03-erp:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 进入页面加载（含编辑/子表返回后刷新） */
onShow(() => {
  loadStudent()
  loadGrades()
  nextTick(() => {
    reloadCourseList()
  })
})
</script>
