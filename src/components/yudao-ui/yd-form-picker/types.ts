import type { WotPickerValue } from '@/utils/wot'

export interface YdFormPickerExpose {
  format: (value?: null | WotPickerValue | WotPickerValue[]) => string
}
