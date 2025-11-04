import dayjs, { type ConfigType } from 'dayjs'
import 'dayjs/locale/ja'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { DEFAULT_EMPTY } from '@/core/constants/app'

/**
 * Handle all logic common of date time
 */
dayjs.locale('ja')
dayjs.extend(localizedFormat)
dayjs.extend(utc)
dayjs.extend(timezone)

export const DATE_FORMAT = Object.freeze({
  YYYYMMDD: 'YYYY/MM/DD',
  YYYY_MM_DD: 'YYYY-MM-DD',
  YYYY_MM_DDJP: 'YYYY年MM月DD日',
  DD_MM_YYYY_HH_MM_SS: 'DD/MM/YYYY, HH:mm:ss'
})

export type TDateType = 'year' | 'month' | 'week' | 'day' | 'hour'

export const formatDate = (
  date?: ConfigType,
  format: string = DATE_FORMAT.YYYYMMDD,
  empty: boolean = false
) => {
  const mDate = dayjs(date ?? '')
  if (mDate.isValid()) {
    return mDate.format(format)
  }
  return empty ? DEFAULT_EMPTY : null
}

export const getDateTimeAgo = (
  agoNumber: number,
  type: TDateType,
  format: string,
  date: ConfigType = new Date()
) => {
  const mDate = dayjs(date ?? '')

  if (mDate.isValid()) {
    const agoDate = dayjs(date).subtract(agoNumber, type)

    return formatDate(agoDate, format)
  }

  return null
}

export const formatDateUTC = (
  date?: ConfigType,
  format: string = DATE_FORMAT.DD_MM_YYYY_HH_MM_SS,
  empty: boolean = false
) => {
  try {
    if (!date) {
      return empty ? DEFAULT_EMPTY : null
    }

    // Handle string input with timezone offset
    let inputString: string
    if (typeof date === 'string') {
      inputString = date
    } else if (date instanceof Date) {
      inputString = date.toISOString()
    } else {
      inputString = String(date)
    }

    // Replace timezone offset with Z to ensure UTC parsing
    const isoString = inputString.replace(/[+-]\d{2}:\d{2}$/, 'Z')
    const utcDate = dayjs.utc(isoString)

    if (utcDate.isValid()) {
      return utcDate.format(format)
    }

    return empty ? DEFAULT_EMPTY : null
  } catch (error) {
    return empty ? DEFAULT_EMPTY : null
  }
}
