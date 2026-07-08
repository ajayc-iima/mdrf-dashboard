"use client"

import { useState, useEffect } from "react"
import { getNotifications, getUnreadCount, type Notification } from "@/lib/firestore"

export function useNotifications(toRole: 'data-scientist' | 'srf') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications(toRole).then((n) => {
      setNotifications(n)
      setLoading(false)
    })
  }, [toRole])

  return { notifications, loading, refresh: () => getNotifications(toRole).then(setNotifications) }
}

export function useUnreadCount(toRole: 'data-scientist' | 'srf') {
  const [count, setCount] = useState(0)

  useEffect(() => {
    getUnreadCount(toRole).then(setCount)
    const interval = setInterval(() => {
      getUnreadCount(toRole).then(setCount)
    }, 30000)
    return () => clearInterval(interval)
  }, [toRole])

  return count
}
