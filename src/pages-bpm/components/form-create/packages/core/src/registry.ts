export const FORM_CREATE_TYPE_GROUPS = {
  alert: ['alert', 'elAlert', 'ElAlert'],
  areaSelect: ['AreaSelect'],
  button: ['button', 'Button', 'elButton', 'ElButton', 'el-button'],
  calendar: ['calendar', 'Calendar', 'elCalendar', 'ElCalendar', 'date', 'datetime', 'month', 'week', 'dateRange', 'daterange', 'datetimeRange', 'datetimerange', 'monthRange', 'monthrange', 'weekRange', 'weekrange'],
  cascader: ['cascader', 'Cascader', 'elCascader', 'ElCascader'],
  colorPicker: ['colorPicker', 'ColorPicker', 'elColorPicker', 'ElColorPicker', 'color-picker'],
  datePicker: ['datePicker', 'DatePicker'],
  divider: ['divider', 'Divider', 'elDivider', 'ElDivider'],
  hidden: ['hidden', 'Hidden'],
  html: ['html', 'Html', 'HTML'],
  iframe: ['iframe', 'Iframe', 'IframeComponent', 'frame', 'Frame'],
  image: ['image', 'Image', 'img', 'Img', 'elImage', 'ElImage'],
  input: ['input', 'Input', 'field', 'password', 'url', 'email', 'search', 'text'],
  inputNumber: ['inputNumber', 'InputNumber', 'number'],
  layoutGroup: ['subForm', 'fcSubForm', 'FcSubForm'],
  richText: ['Editor', 'editor', 'Tinymce', 'tinymce', 'wangEditor', 'WangEditor', 'richText', 'RichText'],
  select: ['select', 'selectMultiple'],
  signature: ['signature', 'Signature', 'signaturePad', 'SignaturePad', 'sign', 'Sign'],
  slider: ['slider', 'sliderRange'],
  subForm: ['group', 'Group', 'fcGroup', 'FcGroup', 'array', 'Array', 'tableForm', 'subTable', 'fcTableForm'],
  tag: ['tag', 'Tag', 'elTag', 'ElTag'],
  textarea: ['textarea'],
  timePicker: ['timePicker', 'TimePicker', 'time'],
  title: ['title', 'Title', 'fcTitle', 'FcTitle'],
  transfer: ['transfer', 'Transfer', 'elTransfer', 'ElTransfer'],
  treeSelect: ['treeSelect', 'TreeSelect', 'treeSelectMultiple', 'tree', 'Tree'],
  upload: ['upload', 'uploader', 'uploadFile', 'uploadImage', 'uploadImages', 'FileUpload', 'ImageUpload', 'ImagesUpload', 'UploadFile', 'UploadImg', 'UploadImgs'],
} as const

type FormCreateTypeGroup = keyof typeof FORM_CREATE_TYPE_GROUPS

const TYPE_GROUP_SETS = Object.entries(FORM_CREATE_TYPE_GROUPS).reduce((sets, [key, values]) => {
  sets[key as FormCreateTypeGroup] = new Set<string>(values)
  return sets
}, {} as Record<FormCreateTypeGroup, Set<string>>)

export function isTypeInGroup(type: string | undefined, group: FormCreateTypeGroup) {
  return !!type && TYPE_GROUP_SETS[group].has(type)
}

export function isAlertTypeName(type?: string) {
  return isTypeInGroup(type, 'alert')
}

export function isAreaSelectTypeName(type?: string) {
  return isTypeInGroup(type, 'areaSelect')
}

export function isButtonTypeName(type?: string) {
  return isTypeInGroup(type, 'button')
}

export function isCalendarTypeName(type?: string) {
  return isTypeInGroup(type, 'calendar')
}

export function isCascaderTypeName(type?: string) {
  return isTypeInGroup(type, 'cascader')
}

export function isColorPickerTypeName(type?: string) {
  return isTypeInGroup(type, 'colorPicker')
}

export function isDatePickerTypeName(type?: string) {
  return isTypeInGroup(type, 'datePicker')
}

export function isDividerTypeName(type?: string) {
  return isTypeInGroup(type, 'divider')
}

export function isHiddenTypeName(type?: string) {
  return isTypeInGroup(type, 'hidden')
}

export function isHtmlTypeName(type?: string) {
  return isTypeInGroup(type, 'html')
}

export function isIframeTypeName(type?: string) {
  return isTypeInGroup(type, 'iframe')
}

export function isImageTypeName(type?: string) {
  return isTypeInGroup(type, 'image')
}

export function isInputTypeName(type?: string) {
  return isTypeInGroup(type, 'input')
}

export function isInputNumberTypeName(type?: string) {
  return isTypeInGroup(type, 'inputNumber')
}

export function isLayoutGroupTypeName(type?: string) {
  return isTypeInGroup(type, 'layoutGroup')
}

export function isRichTextTypeName(type?: string) {
  return isTypeInGroup(type, 'richText')
}

export function isSelectTypeName(type?: string) {
  return isTypeInGroup(type, 'select')
}

export function isSignatureTypeName(type?: string) {
  return isTypeInGroup(type, 'signature')
}

export function isSliderTypeName(type?: string) {
  return isTypeInGroup(type, 'slider')
}

export function isSubFormTypeName(type?: string) {
  return isTypeInGroup(type, 'subForm')
}

export function isTagTypeName(type?: string) {
  return isTypeInGroup(type, 'tag')
}

export function isTextareaTypeName(type?: string, props?: Record<string, any>) {
  return isTypeInGroup(type, 'textarea') || props?.type === 'textarea'
}

export function isTimePickerTypeName(type?: string) {
  return isTypeInGroup(type, 'timePicker')
}

export function isTitleTypeName(type?: string) {
  return isTypeInGroup(type, 'title')
}

export function isTransferTypeName(type?: string) {
  return isTypeInGroup(type, 'transfer')
}

export function isTreeSelectTypeName(type?: string) {
  return isTypeInGroup(type, 'treeSelect')
}

export function isUploadTypeName(type?: string) {
  return isTypeInGroup(type, 'upload')
}

export function isSliderRangeTypeName(type?: string, props?: Record<string, any>) {
  return type === 'sliderRange' || props?.range === true
}

export function isMultipleValueType(type: string, props?: Record<string, any>) {
  return type === 'treeSelectMultiple'
    || props?.multiple
    || props?.mode === 'multiple'
    || type === 'selectMultiple'
}

export function isCalendarArrayValueType(type: string, props?: Record<string, any>) {
  const calendarType = String(props?.type || type || 'date').toLowerCase()
  return calendarType === 'dates'
    || calendarType === 'multiple'
    || calendarType.includes('range')
}

export function isDatePickerArrayValueType(type?: string, props?: Record<string, any>) {
  return isDatePickerTypeName(type) && isCalendarArrayValueType(type || '', props)
}
