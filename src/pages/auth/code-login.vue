<template>
  <view class="auth-container">
    <!-- 顶部 -->
    <Header />

    <!-- 表单区域 -->
    <view class="form-container">
      <TenantPicker ref="tenantPickerRef" />
      <view class="input-item">
        <wd-icon name="phone" size="20px" color="#1890ff" />
        <wd-input
          v-model="formData.mobile"
          placeholder="请输入手机号"
          clearable
          clear-trigger="focus"
          no-border
          type="number"
          :maxlength="11"
        />
      </view>
      <CodeInput
        v-model="formData.code"
        :mobile="formData.mobile"
        :scene="21"
        :before-send="validateBeforeSend"
      />

      <!-- 登录按钮 -->
      <view class="mb-2 mt-2 flex justify-between">
        <text class="text-28rpx text-[#1890ff]" @click="goToLogin">
          账号登录
        </text>
        <text class="text-28rpx text-[#1890ff]" @click="goToForgetPassword">
          忘记密码？
        </text>
      </view>
      <wd-button block :loading="loading" type="primary" @click="handleLogin">
        登录
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { useToast } from "wot-design-uni";
import { FORGET_PASSWORD_PAGE, LOGIN_PAGE } from "@/router/config";
import { useTokenStore } from "@/store/token";
import { ensureDecodeURIComponent, redirectAfterLogin } from "@/utils";
import { isMobile } from "@/utils/validator";
import CodeInput from "./components/code-input.vue";
import Header from "./components/header.vue";
import TenantPicker from "./components/tenant-picker.vue";

defineOptions({
  name: "SmsLoginPage",
});

definePage({
  style: {
    navigationStyle: "custom",
  },
  excludeLoginPath: true,
});

const toast = useToast();
const loading = ref(false); // 加载状态
const redirectUrl = ref<string>(); // 重定向地址
const tenantPickerRef = ref<InstanceType<typeof TenantPicker>>(); // 租户选择器引用

const formData = reactive({
  mobile: "",
  code: "",
}); // 表单数据

/** 页面加载时处理重定向 */
onLoad((options) => {
  if (options?.redirect) {
    redirectUrl.value = ensureDecodeURIComponent(options.redirect);
  }
});

/** 发送验证码前的校验 */
function validateBeforeSend(): boolean {
  return tenantPickerRef.value?.validate() ?? false;
}

/** 登录处理 */
async function handleLogin() {
  // 校验租户
  if (!tenantPickerRef.value?.validate()) {
    return;
  }
  if (!formData.mobile) {
    toast.warning("请输入手机号");
    return;
  }
  if (!isMobile(formData.mobile)) {
    toast.warning("请输入正确的手机号");
    return;
  }
  if (!formData.code) {
    toast.warning("请输入验证码");
    return;
  }

  loading.value = true;
  try {
    // 调用短信登录接口
    const tokenStore = useTokenStore();
    await tokenStore.login({
      type: "sms",
      ...formData,
    });
    // 处理跳转
    redirectAfterLogin(redirectUrl.value);
  } finally {
    loading.value = false;
  }
}

/** 跳转到账号密码登录 */
function goToLogin() {
  uni.navigateTo({ url: LOGIN_PAGE });
}

/** 跳转到忘记密码 */
function goToForgetPassword() {
  uni.navigateTo({ url: FORGET_PASSWORD_PAGE });
}
</script>

<style lang="scss" scoped>
@import "./styles/auth.scss";
</style>
