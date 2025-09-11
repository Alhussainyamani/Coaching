import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'منذ ثواني'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `منذ ${months} ${months === 1 ? 'شهر' : 'شهور'}`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `منذ ${years} ${years === 1 ? 'سنة' : 'سنوات'}`
  }
}
