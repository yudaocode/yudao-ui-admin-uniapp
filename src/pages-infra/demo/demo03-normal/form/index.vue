<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="pb-160rpx">
      <!-- 主表：学生 -->
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="学生信息">
          <wd-form-item title="名字" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入名字" />
          </wd-form-item>
          <wd-form-item title="性别" title-width="200rpx" prop="sex" center>
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
            title-width="200rpx"
            prop="birthday"
            is-link
            :value="formData.birthday ? formatDate(formData.birthday) : ''"
            placeholder="请选择出生日期"
            @click="pickerVisible.birthday = true"
          />
          <wd-datetime-picker
            v-model="formData.birthday"
            v-model:visible="pickerVisible.birthday"
            title="请选择出生日期"
            type="date"
          />
          <wd-form-item title="简介" title-width="200rpx" prop="description">
            <wd-textarea v-model="formData.description" clearable placeholder="请输入简介" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 子表：学生课程（一对多） -->
      <view class="mt-20rpx flex items-center justify-between px-24rpx py-16rpx">
        <text class="text-28rpx text-[#333] font-semibold">学生课程</text>
        <wd-button size="small" type="primary" variant="plain" @click="addCourse">
          添加课程
        </wd-button>
      </view>
      <view class="px-24rpx">
        <view v-if="!courses.length" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
          暂无课程，点击右上「添加课程」
        </view>
        <view
          v-for="(course, index) in courses"
          :key="index"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <text class="text-28rpx text-[#666]">课程 {{ index + 1 }}</text>
            <wd-button size="small" type="danger" variant="plain" @click="removeCourse(index)">
              删除
            </wd-button>
          </view>
          <wd-input v-model="course.name" label="名字" label-width="120rpx" placeholder="请输入课程名字" />
          <wd-input v-model="course.score" label="分数" label-width="120rpx" type="number" placeholder="请输入分数" />
        </view>
      </view>

      <!-- 子表：学生班级（一对一） -->
      <view class="mt-20rpx px-24rpx py-16rpx">
        <text class="text-28rpx text-[#333] font-semibold">学生班级</text>
      </view>
      <view class="px-24rpx">
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <wd-input v-model="grade.name" label="名字" label-width="120rpx" placeholder="请输入班级名字" />
          <wd-input v-model="grade.teacher" label="班主任" label-width="120rpx" placeholder="请输入班主任" />
        </view>
      </view>
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
import type { Demo03Course, Demo03Grade, Demo03Student } from '@/api/infra/demo/demo03/normal'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createDemo03Student,
  getDemo03CourseListByStudentId,
  getDemo03GradeByStudentId,
  getDemo03Student,
  updateDemo03Student,
} from '@/api/infra/demo/demo03/normal'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const getTitle = computed(() => props.id ? '编辑学生' : '新增学生')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = reactive({ birthday: false }) // 日期选择器显示状态
const formData = ref<Demo03Student>({
  id: undefined,
  name: '',
  sex: undefined,
  birthday: undefined,
  description: '',
}) // 主表数据
const courses = ref<Demo03Course[]>([]) // 学生课程（一对多）
const grade = ref<Demo03Grade>({ name: '', teacher: '' }) // 学生班级（一对一）
const formSchema = createFormSchema({
  name: [{ required: true, message: '名字不能为空' }],
  sex: [{ required: true, message: '性别不能为空' }],
  birthday: [{ required: true, message: '出生日期不能为空' }],
  description: [{ required: true, message: '简介不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 添加课程 */
function addCourse() {
  courses.value.push({ name: '', score: undefined })
}

/** 删除课程 */
function removeCourse(index: number) {
  courses.value.splice(index, 1)
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/demo/demo03-normal/index')
}

/** 加载详情（主表 + 子表） */
async function getDetail() {
  if (!props.id) {
    return
  }
  const [student, courseList, gradeData] = await Promise.all([
    getDemo03Student(props.id),
    getDemo03CourseListByStudentId(props.id),
    getDemo03GradeByStudentId(props.id),
  ])
  formData.value = student
  courses.value = courseList || []
  grade.value = gradeData || { name: '', teacher: '' }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data: Demo03Student = {
      ...formData.value,
      // 注意：子表字段用驼峰，避免后端反序列化丢失
      demo03Courses: courses.value.map(course => ({ ...course, score: course.score != null ? Number(course.score) : undefined })),
      demo03Grade: grade.value,
    }
    if (props.id) {
      await updateDemo03Student(data)
      toast.success('修改成功')
    } else {
      await createDemo03Student(data)
      toast.success('新增成功')
    }
    uni.$emit('infra:demo03-normal:reload')
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
