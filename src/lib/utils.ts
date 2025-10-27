import type { ClassValue } from 'clsx'
import { DateFormatter } from '@internationalized/date'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPrefix(name: string) {
  let p = ''
  name.split(' ').forEach((v, i) => {
    if (i < 2) {
      p += v[0]
    }
  })
  return p
}

export const df = new DateFormatter('en-IN', { dateStyle: 'long' })
export type ViewMode = 'grid' | 'list'

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }
