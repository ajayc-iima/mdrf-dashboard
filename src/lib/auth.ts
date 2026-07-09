import {
  signInWithPopup, GoogleAuthProvider, updateProfile,
  onAuthStateChanged, User, sendSignInLinkToEmail,
  isSignInWithEmailLink, signInWithEmailLink,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile } from './firestore'
import type { UserRole } from '@/types'

const googleProvider = new GoogleAuthProvider()

const EMAIL_OTP_KEY = 'emailForSignIn'
const ALLOWED_DOMAIN = 'isb.edu'

export function validateIsbEmail(email: string): string | null {
  if (!email.trim()) return 'Enter your email address.'
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return 'Enter a valid email address.'
  if (domain !== ALLOWED_DOMAIN) return `Only @${ALLOWED_DOMAIN} emails are allowed.`
  return null
}

export function getOtpRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + window.location.pathname
  }
  return 'http://localhost:3000/'
}

export async function sendOtpToEmail(email: string) {
  const validationError = validateIsbEmail(email)
  if (validationError) throw new Error(validationError)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You appear to be offline. Please connect to the internet.')
  }
  const actionCodeSettings = {
    url: getOtpRedirectUrl(),
    handleCodeInApp: true,
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
  localStorage.setItem(EMAIL_OTP_KEY, email)
}

export function isOtpRedirect(): boolean {
  if (typeof window === 'undefined') return false
  return isSignInWithEmailLink(auth, window.location.href)
}

export async function completeOtpSignIn(): Promise<User> {
  const email = localStorage.getItem(EMAIL_OTP_KEY)
  if (!email) throw new Error('Email not found. Please request a new OTP.')
  const cred = await signInWithEmailLink(auth, email, window.location.href)
  localStorage.removeItem(EMAIL_OTP_KEY)
  return cred.user
}

export async function signInWithGoogle() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw { code: 'offline', message: 'You appear to be offline. Please connect to the internet to sign in.' }
  }
  const cred = await signInWithPopup(auth, googleProvider)
  return cred.user
}

export async function signUp(name: string, email: string, password: string) {
  const { createUserWithEmailAndPassword } = await import('firebase/auth')
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  await createUserProfile(cred.user.uid, { name, email })
  return cred.user
}

export async function signOut() {
  const { signOut: firebaseSignOut } = await import('firebase/auth')
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export function getRoleHome(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    admin: '/admin',
    director: '/director',
    fellow: '/fellow',
    'data-scientist': '/data-scientist',
    'srf': '/srf',
    'mdrf-coordinator': '/mdrf-coordinator',
    'mlrf-coordinator': '/mlrf-coordinator',
  }
  return routes[role] || '/pending'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  director: 'Director',
  fellow: 'Fellow',
  'data-scientist': 'Data Scientist',
  'srf': 'Senior Research Fellow',
  'mdrf-coordinator': 'MDRF Coordinator',
  'mlrf-coordinator': 'MLRF Coordinator',
}
