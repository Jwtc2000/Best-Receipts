/**
 * Optional user attributes (not tied to any one report) that, when filled
 * in, are printed on the summary page of every PDF export. Stored in
 * localStorage since it's a handful of small strings, not report data.
 */
export interface Profile {
  name: string
  employeeId: string
  costCenter: string
  projectNumber: string
}

const PROFILE_KEY = 'br.profile'

const emptyProfile: Profile = { name: '', employeeId: '', costCenter: '', projectNumber: '' }

export function getProfile(): Profile {
  const raw = localStorage.getItem(PROFILE_KEY)
  if (!raw) return { ...emptyProfile }
  try {
    const parsed = JSON.parse(raw)
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      employeeId: typeof parsed.employeeId === 'string' ? parsed.employeeId : '',
      costCenter: typeof parsed.costCenter === 'string' ? parsed.costCenter : '',
      projectNumber: typeof parsed.projectNumber === 'string' ? parsed.projectNumber : '',
    }
  } catch {
    return { ...emptyProfile }
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

/** The non-empty attributes, as "Label: value" pairs, in a fixed display order. */
export function profileSummaryLines(profile: Profile): string[] {
  return [
    profile.name.trim() && `Name: ${profile.name.trim()}`,
    profile.employeeId.trim() && `Employee ID: ${profile.employeeId.trim()}`,
    profile.costCenter.trim() && `Cost Center: ${profile.costCenter.trim()}`,
    profile.projectNumber.trim() && `Project Number: ${profile.projectNumber.trim()}`,
  ].filter((line): line is string => Boolean(line))
}
