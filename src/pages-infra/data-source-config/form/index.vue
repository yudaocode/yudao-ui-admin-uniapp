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
            label="数据源名称"
            label-width="200rpx"
            prop="name"
            clearable
            placeholder="请输入数据源名称"
          />
          <wd-input
            v-model="formData.url"
            label="数据源连接"
            label-width="200rpx"
            prop="url"
            clearable
            placeholder="请输入数据源连接"
          />
          <wd-input
            v-model="formData.username"
            label="用户名"
            label-width="200rpx"
            prop="username"
            clearable
            placeholder="请输入用户名"
          />
          <wd-input
            v-model="formData.password"
            label="密码"
            label-width="200rpx"
            prop="password"
            type="password"
            clearable
            placeholder="请输入密码"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { DataSourceConfig } from '@/api/infra/data-source-config'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
