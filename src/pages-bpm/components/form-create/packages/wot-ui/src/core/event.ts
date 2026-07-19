import type {
  FormCreateApi,
  FormCreateOption,
  FormCreateRule,
  NormalizedFormCreateRule,
} from '../../../../types/typing'

type RuleEventHandler = ((...args: any[]) => any) & {
  __inject?: boolean
}

export interface RuleEventContext {
  api?: FormCreateApi
  args: any[]
  legacyApi?: FormCreateApi
  option?: FormCreateOption
  rootRules?: FormCreateRule[]
  rule: NormalizedFormCreateRule
  selfRule?: NormalizedFormCreateRule
}

/** 执行字段事件，并兼容设计器的 $inject 注入参数 */
export function invokeRuleEventHandlers(
  handler: unknown,
  context: RuleEventContext,
  onError: (error: unknown) => void,
) {
  normalizeRuleEventHandlers(handler).forEach((callback) => {
    try {
      const result = shouldInjectRuleEvent(callback, context)
        ? callback(createRuleEventInject(context), ...context.args)
        : callback(...context.args, context.rule, context.legacyApi || context.api)
      if (result && typeof result.then === 'function') {
        Promise.resolve(result).catch(onError)
      }
    } catch (error) {
      onError(error)
    }
  })
}

function normalizeRuleEventHandlers(handler: unknown): RuleEventHandler[] {
  if (Array.isArray(handler)) {
    return handler.flatMap(normalizeRuleEventHandlers)
  }
  return typeof handler === 'function' ? [handler as RuleEventHandler] : []
}

function shouldInjectRuleEvent(handler: RuleEventHandler, context: RuleEventContext) {
  const inject = context.rule.inject || context.option?.injectEvent
  return handler.__inject === true || (inject !== undefined && inject !== false)
}

function createRuleEventInject(context: RuleEventContext) {
  const inject = context.rule.inject || context.option?.injectEvent
  return {
    $f: context.api,
    api: context.api,
    rule: context.rootRules || [context.rule],
    self: context.selfRule || context.rule,
    option: context.option || {},
    inject,
    args: [...context.args],
  }
}
