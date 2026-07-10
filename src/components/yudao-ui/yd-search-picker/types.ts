import type { WotPickerValue } from '@/utils/wot'

export interface YdSearchPickerExpose {
  format: (value?: null | WotPickerValue | WotPickerValue[]) => string
}
