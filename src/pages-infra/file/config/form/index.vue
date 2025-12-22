<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-input
            v-model="formData.name"
            label="配置名"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入配置名"
          />
          <wd-cell title="存储器" title-width="200rpx" prop="storage" center>
            <wd-picker
              v-model="formData.storage"
              :columns="getIntDictOptions(DICT_TYPE.INFRA_FILE_STORAGE)"
              label-key="label"
              value-key="value"
              :disabled="!!formData.id"
              placeholder="请选择存储器"
            />
          </wd-cell>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            prop="remark"
            clearable
            placeholder="请输入备注"
          />
        </wd-cell-group>

        <!-- DB / Local / FTP / SFTP 配置 -->
        <wd-cell-group v-if="formData.storage && formData.storage >= 10 && formData.storage <= 12" border title="存储配置">
          <wd-input
            v-model="formData.config!.basePath"
            label="基础路径"
            label-width="200rpx"
            prop="config.basePath"
            clearable
            placeholder="请输入基础路径"
          />
          <!-- FTP / SFTP 配置 -->
          <template v-if="formData.storage >= 11 && formData.storage <= 12">
            <wd-input
              v-model="formData.config!.host"
              label="主机地址"
              label-width="200rpx"
              prop="config.host"
              clearable
              placeholder="请输入主机地址"
            />
            <wd-input
              v-model.number="formData.config!.port"
              label="主机端口"
              label-width="200rpx"
              prop="config.port"
              type="number"
              clearable
              placeholder="请输入主机端口"
            />
            <wd-input
              v-model="formData.config!.username"
              label="用户名"
              label-width="200rpx"
              prop="config.username"
              clearable
              placeholder="请输入用户名"
            />
            <wd-input
              v-model="formData.config!.password"
              label="密码"
              label-width="200rpx"
              prop="config.password"
              clearable
              placeholder="请输入密码"
            />
          </template>
          <!-- FTP 连接模式 -->
          <wd-cell v-if="formData.storage === 11" title="连接模式" title-width="200rpx" prop="config.mode" center>
            <wd-radio-group v-model="formData.config!.mode" shape="button">
              <wd-radio value="Active">
                主动模式
              </wd-radio>
              <wd-radio value="Passive">
                被动模式
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
        </wd-cell-group>

        <!-- S3 配置 -->
        <wd-cell-group v-if="formData.storage === 20" border title="S3 配置">
          <wd-input
            v-model="formData.config!.endpoint"
            label="节点地址"
            label-width="200rpx"
            prop="config.endpoint"
            clearable
            placeholder="请输入节点地址"
          />
          <wd-input
            v-model="formData.config!.bucket"
            label="存储 bucket"
            label-width="200rpx"
            prop="config.bucket"
            clearable
            placeholder="请输入 bucket"
          />
          <wd-input
            v-model="formData.config!.accessKey"
            label="accessKey"
            label-width="200rpx"
            prop="config.accessKey"
            clearable
            placeholder="请输入 accessKey"
          />
          <wd-input
            v-model="formData.config!.accessSecret"
            label="accessSecret"
            label-width="200rpx"
            prop="config.accessSecret"
            clearable
            placeholder="请输入 accessSecret"
          />
          <wd-cell title="Path Style" title-width="200rpx" prop="config.enablePathStyleAccess" center>
            <wd-radio-group v-model="formData.config!.enablePathStyleAccess" shape="button">
              <wd-radio :value="true">
                启用
              </wd-radio>
              <wd-radio :value="false">
                禁用
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-cell title="公开访问" title-width="200rpx" prop="config.enablePublicAccess" center>
            <wd-radio-group v-model="formData.config!.enablePublicAccess" shape="button">
              <wd-radio :value="true">
                公开
              </wd-radio>
              <wd-radio :value="false">
                私有
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-input
            v-model="formData.config!.region"
            label="区域"
            label-width="200rpx"
            prop="config.region"
            clearable
            placeholder="请填写区域，一般仅 AWS 需要填写"
          />
        </wd-cell-group>

        <!-- 通用配置 -->
        <wd-cell-group v-if="formData.storage" border title="通用配置">
          <wd-input
            v-model="formData.config!.domain"
            label="自定义域名"
            label-width="200rpx"
            prop="config.domain"
            clearable
            placeholder="请输入自定义域名"
          />
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
import type { FileConfig } from '@/api/infra/file/config'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createFileConfig, getFileConfig, updateFileConfig } from '@/api/infra/file/config'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

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
const getTitle = computed(() => props.id ? '编辑文件配置' : '新增文件配置')
const formLoading = ref(false)
const formData = ref<FileConfig>({
  id: undefined,
  name: '',
  storage: undefined,
  remark: '',
  config: {
    basePath: '',
    host: '',
    port: undefined,
    username: '',
    password: '',
    mode: 'Passive',
    endpoint: '',
    bucket: '',
    accessKey: '',
    accessSecret: '',
    enablePathStyleAccess: false,
    enablePublicAccess: false,
    region: '',
    domain: '',
  },
})
const formRules = {
  name: [{ required: true, message: '配置名不能为空' }],
  storage: [{ required: true, message: '存储器不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/file/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getFileConfig(props.id)
  formData.value = {
    ...data,
    config: data.config || {
      basePath: '',
      host: '',
      port: undefined,
      username: '',
      password: '',
      mode: 'Passive',
      endpoint: '',
      bucket: '',
      accessKey: '',
      accessSecret: '',
      enablePathStyleAccess: false,
      enablePublicAccess: false,
      region: '',
      domain: '',
    },
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
    if (props.id) {
      await updateFileConfig(formData.value)
      toast.success('修改成功')
    } else {
      await createFileConfig(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
