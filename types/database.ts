export type TaskCategory = 'work' | 'home' | 'baby'
export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'
export type LogType = 'feed' | 'sleep' | 'diaper'
export type ChatMode = 'baby' | 'time' | 'business' | 'emotional' | 'pregnancy'
export type BabyGender = 'boy' | 'girl'

export interface Profile {
  id: string
  name: string | null
  baby_name: string | null
  baby_birthdate: string | null
  baby_gender: BabyGender | null
  profile_picture_url: string | null
  business_name: string | null
  business_type: string | null
  website_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  linkedin_url: string | null
  google_calendar_url: string | null
  avatar_url: string | null
  created_at: string
  // New fields (migration 005)
  tracking_type: 'pregnancy' | 'baby' | null
  has_given_birth: boolean | null
  due_date: string | null
  birth_date: string | null
  birth_baby_name: string | null
  birth_baby_gender: BabyGender | null
  setup_complete: boolean | null
  setup_step: number | null
  user_goal: string | null
  pwa_installed_at: string | null
}

export interface Task {
  id: string
  user_id: string
  title: string
  category: TaskCategory
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
}

export interface BabyLog {
  id: string
  user_id: string
  type: LogType
  feed_type: 'breast' | 'bottle' | null
  amount_ml: number | null
  duration_min: number | null
  diaper_type: 'wet' | 'dirty' | 'both' | null
  notes: string | null
  start_time: string
  end_time: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  mode: ChatMode
  created_at: string
}

export interface HealthEvent {
  id: string
  user_id: string
  type: 'vaccine' | 'checkup' | 'other'
  title: string
  scheduled_date: string
  completed: boolean
  notes: string | null
  created_at: string
}

export interface WeeklyScheduleItem {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  title: string
  type: 'work' | 'baby' | 'personal' | 'break'
  notes?: string | null
  completed?: boolean
  created_at: string
}
