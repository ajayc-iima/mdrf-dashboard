"use client"

import { useState, useEffect } from "react"
import { getNotifications, getUnreadCount, type Notification } from "@/lib/firestore"

export function useNotifications(toRole: 'data-scientist' | 'srf') {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications(toRole)
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [toRole])

  return {
    notifications,
    loading,
    refresh: () => getNotifications(toRole).then(setNotifications).catch(console.error)
  }
}

export function useUnreadCount(toRole: 'data-scientist' | 'srf') {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true
    const fetchCount = () => {
      getUnreadCount(toRole)
        .then((c) => { if (mounted) setCount(c) })
        .catch(console.error)
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [toRole])

  return count
}
