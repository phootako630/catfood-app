import { supabase } from './supabase'
import type { Cat, DietPlan, FeedingLog, WeightLog, Profile } from '../types/database'
import { startOfDay, endOfDay } from 'date-fns'

// ── Cats ──
export async function getCats() {
  const { data, error } = await supabase
    .from('cats')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data as Cat[]
}

export async function addCat(cat: { name: string; breed?: string; birth_date?: string; household_id: string }) {
  const { data, error } = await supabase.from('cats').insert(cat).select().single()
  if (error) throw error
  return data as Cat
}

// ── Diet Plans ──
export async function getActiveDietPlan(catId: string) {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*')
    .eq('cat_id', catId)
    .eq('is_active', true)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as DietPlan | null
}

export async function createDietPlan(plan: {
  cat_id: string
  daily_quota_g: number
  food_brand?: string
  food_name?: string
  target_weight_kg?: number
  vet_name?: string
  next_checkup?: string
  notes?: string
  created_by: string
}) {
  // Deactivate old plans
  await supabase
    .from('diet_plans')
    .update({ is_active: false, end_date: new Date().toISOString().slice(0, 10) })
    .eq('cat_id', plan.cat_id)
    .eq('is_active', true)

  const { data, error } = await supabase.from('diet_plans').insert(plan).select().single()
  if (error) throw error
  return data as DietPlan
}

// ── Feeding Logs ──
export async function getTodayFeedings(catId: string, timezone: string = 'Asia/Shanghai') {
  // Calculate today's range in user's timezone
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone })
  const todayStr = formatter.format(now) // YYYY-MM-DD in user's TZ

  const dayStart = new Date(`${todayStr}T00:00:00`)
  const dayEnd = new Date(`${todayStr}T23:59:59.999`)

  // Convert to UTC ISO strings for query
  const tzOffset = getTimezoneOffsetMs(timezone)
  const utcStart = new Date(dayStart.getTime() - tzOffset).toISOString()
  const utcEnd = new Date(dayEnd.getTime() - tzOffset).toISOString()

  const { data, error } = await supabase
    .from('feeding_logs')
    .select('*, profiles:fed_by(display_name)')
    .eq('cat_id', catId)
    .gte('fed_at', utcStart)
    .lte('fed_at', utcEnd)
    .order('fed_at', { ascending: true })
  if (error) throw error
  return data as (FeedingLog & { profiles: { display_name: string } | null })[]
}

function getTimezoneOffsetMs(timezone: string): number {
  const now = new Date()
  const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = now.toLocaleString('en-US', { timeZone: timezone })
  return new Date(tzStr).getTime() - new Date(utcStr).getTime()
}

export async function addFeeding(log: { cat_id: string; amount_g: number; fed_by: string; note?: string }) {
  const { data, error } = await supabase
    .from('feeding_logs')
    .insert({ ...log, fed_at: new Date().toISOString() })
    .select('*, profiles:fed_by(display_name)')
    .single()
  if (error) throw error
  return data as FeedingLog & { profiles: { display_name: string } | null }
}

export async function deleteFeeding(id: string) {
  const { error } = await supabase.from('feeding_logs').delete().eq('id', id)
  if (error) throw error
}

// ── Weight Logs ──
export async function getWeightLogs(catId: string, limit = 30) {
  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('cat_id', catId)
    .order('recorded_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data as WeightLog[]).reverse()
}

export async function addWeightLog(log: { cat_id: string; weight_kg: number; recorded_by: string; note?: string }) {
  const { data, error } = await supabase.from('weight_logs').insert(log).select().single()
  if (error) throw error
  return data as WeightLog
}

// ── Profile ──
export async function updateProfile(userId: string, fields: { display_name?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

// ── Household ──
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O/0/I/1
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function createHousehold(name: string, userId: string) {
  const inviteCode = generateInviteCode()
  const { data, error } = await supabase
    .from('households')
    .insert({ name, invite_code: inviteCode, created_by: userId })
    .select()
    .single()
  if (error) throw error
  // Link profile to this household
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ household_id: data.id })
    .eq('id', userId)
  if (profileErr) throw profileErr
  return data
}

export async function joinHousehold(inviteCode: string, userId: string) {
  const { data: household, error } = await supabase
    .from('households')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()
  if (error || !household) throw new Error('邀请码无效')

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ household_id: household.id })
    .eq('id', userId)
  if (updateErr) throw updateErr
  return household.id
}

export async function getHouseholdMembers(householdId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('household_id', householdId)
  if (error) throw error
  return data as Profile[]
}

export async function getHousehold(householdId: string) {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single()
  if (error) throw error
  return data
}
