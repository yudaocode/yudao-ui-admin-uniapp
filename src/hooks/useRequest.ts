import type { Ref } from 'vue'
import { ref } from 'vue'

interface IUseRequestOptions<T> {
  /** 是否立即执行 */
  immediate?: boolean
  /** 初始化数据 */
  initialData?: T
}

interface IUseRequestReturn<T, P = undefined> {
  loading: Ref<boolean>
  error: Ref<boolean | Error>
  data: Ref<T | undefined>
  run: (args?: P) => Promise<T | undefined>
}

/**
 * useRequest是一个定制化的请求钩子，用于处理异步请求和响应。
 * @param func 一个执行异步请求的函数，返回一个包含响应数据的Promise。
 * @param options 包含请求选项的对象 {immediate, initialData}。
 * @param options.immediate 是否立即执行请求，默认为false。
 * @param options.initialData 初始化数据，默认为undefined。
 * @returns 返回一个对象{loading, error, data, run}，包含请求的加载状态、错误信息、响应数据和手动触发请求的函数。
 */
export default function useRequest<T, P = undefined>(
  func: (args?: P) => Promise<T>,
  options: IUseRequestOptions<T> = { immediate: false },
): IUseRequestReturn<T, P> {
  const loading = ref(false)
  const error = ref(false)
  const data = ref<T | undefined>(options.initialData) as Ref<T | undefined>
  const run = async (args?: P) => {
    loading.value = true
    let request: Promise<T>
    try {
      request = func(args)
    } catch (err) {
      request = Promise.reject(err) // 同步抛错转为 rejected Promise，复用下方统一的 error / loading 处理
    }
    return request
      .then((res) => {
        data.value = res
        error.value = false
        return data.value
      })
      .catch((err) => {
        error.value = err
        throw err
      })
      .finally(() => {
        loading.value = false
      })
  }

  if (options.immediate) {
    // 自动执行的失败（含 func 同步抛错）已记录到 error 并结束 loading，这里消费拒绝，避免 unhandledRejection
    (run as (args: P) => Promise<T | undefined>)({} as P).catch(() => {})
  }
  return { loading, error, data, run }
}
