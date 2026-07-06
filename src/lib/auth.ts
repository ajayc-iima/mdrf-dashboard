import {
  signInWithPopup, GoogleAuthProvider, updateProfile,
  onAuthStateChanged, User,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile } from './firestore'
import type { UserRole } from '@/types'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
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
    'mdrf-coordinator': '/mdrf-coordinator',
    'mlrf-coordinator': '/mlrf-coordinator',
  }
  return routes[role]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  director: 'Director',
  fellow: 'Fellow',
  'mdrf-coordinator': 'MDRF Coordinator',
  'mlrf-coordinator': 'MLRF Coordinator',
}
