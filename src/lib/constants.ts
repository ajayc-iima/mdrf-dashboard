import type { Program } from '@/types'

export const CHART_COLORS = ['#1E3A5F', '#c5002f', '#2E6F95', '#e85d75', '#4A7C59', '#8B6B4D']

export const APP_NAME = 'Research Fellow Connect'
export const INSTITUTION = 'Bharti Institute of Public Policy, ISB'
export function programAppName(program: Program): string {
  return program === 'mdrf' ? 'MDRF Connect' : 'MLRF Connect'
}

export const WEEKLY_LOG_TARGET = 5
export const WEEKLY_DEADLINE = { day: 0, hour: 18, minute: 0 }

export interface Course {
  key: string
  title: string
  description: string
  program?: Program
}

export const COURSES: Course[] = [
  { key: 'onboarding', title: 'Fellow Onboarding & Orientation', description: 'Complete onboarding pack and orientation session.' },
  { key: 'ethics', title: 'Research Ethics & Data Privacy', description: 'Consent, confidentiality and responsible data handling.' },
  { key: 'cppp-online', title: 'Certificate Programme — Online Modules', description: 'Complete the online course modules of the CPPP.' },
  { key: 'cppp-lectures', title: 'CPPP — Lecture Attendance', description: 'Attend the scheduled lectures for the term.' },
  { key: 'cppp-residency', title: 'CPPP — Residency Participation', description: 'Participate in the on-campus residency week.' },
  { key: 'cppp-assignment', title: 'CPPP — Assignment Submission', description: 'Submit the capstone assignment for grading.' },
  { key: 'field-methods', title: 'Fieldwork Methods', description: 'Interviewing, observation and survey techniques.' },
  { key: 'report-writing', title: 'Report Writing & Submission', description: 'Structure, write and submit a clean quarterly report.' },
  { key: 'district-governance', title: 'District Governance Structures', description: 'Departments, offices and officials in your area.', program: 'mdrf' },
  { key: 'legislative-process', title: 'Legislative & Constituency Process', description: 'Assembly process, constituency roles, grievance flow.', program: 'mlrf' },
]

export const PROGRAM_META: Record<Program, { label: string; app: string; full: string; short: string; scope: string }> = {
  mdrf: {
    label: 'MDRF', app: 'MDRF Connect',
    full: 'Meghalaya District Research Fellows', short: 'District',
    scope: 'District-level research & governance support.',
  },
  mlrf: {
    label: 'MLRF', app: 'MLRF Connect',
    full: 'Meghalaya Legislative Research Fellows', short: 'Legislative',
    scope: 'Constituency & legislative research support.',
  },
}
