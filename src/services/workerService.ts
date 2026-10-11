import {
  CITY_KEYS,
  SUGGESTED_SKILL_KEYS,
  completedJobs,
  rating,
  skillCourses,
  welfareSchemes,
  workerTypeOptions,
} from '../data/mockData';

export async function getWorkerTypeOptions() {
  return workerTypeOptions;
}

export async function getSkillCourses() {
  return skillCourses;
}

export async function getWelfareSchemes() {
  return welfareSchemes;
}

export async function getCityKeys() {
  return CITY_KEYS;
}

export async function getSuggestedSkillKeys() {
  return SUGGESTED_SKILL_KEYS;
}

export async function getWorkerStats() {
  return { completedJobs, rating };
}
