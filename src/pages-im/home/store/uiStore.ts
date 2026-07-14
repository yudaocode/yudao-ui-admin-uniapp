import { defineStore } from 'pinia'
import { ref } from 'vue'

/** IM 移动端全局交互 Store */
export const useImUiStore = defineStore('imUiStore', () => {
  const nextUnreadJumpNonce = ref(0) // 跳转下一未读会话指令序号

  /** 请求打开下一条未读会话 */
  function requestNextUnreadJump() {
    nextUnreadJumpNonce.value++
  }

  return {
    nextUnreadJumpNonce,
    requestNextUnreadJump,
  }
})
