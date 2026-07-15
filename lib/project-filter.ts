"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";

export const GLOBAL_PROJECT_STORAGE_KEY = "siamgs:selected-project";

export function normalizeProjectFilter(value?: string | null) {
  if (!value || value === "all" || value === "SEMUA") return "";
  return value;
}

export function getProjectFilterFromSearchParams(searchParams: ReadonlyURLSearchParams) {
  return normalizeProjectFilter(searchParams.get("project"));
}

export function getStoredProjectFilter() {
  if (typeof window === "undefined") return "";
  return normalizeProjectFilter(window.localStorage.getItem(GLOBAL_PROJECT_STORAGE_KEY));
}

export function storeProjectFilter(projectId: string) {
  if (typeof window === "undefined") return;

  const normalizedProjectId = normalizeProjectFilter(projectId);
  if (normalizedProjectId) {
    window.localStorage.setItem(GLOBAL_PROJECT_STORAGE_KEY, normalizedProjectId);
  } else {
    window.localStorage.removeItem(GLOBAL_PROJECT_STORAGE_KEY);
  }
}

export function applyProjectFilterToParams(params: URLSearchParams, projectId: string) {
  const normalizedProjectId = normalizeProjectFilter(projectId);
  if (normalizedProjectId) {
    params.set("project", normalizedProjectId);
  } else {
    params.delete("project");
  }
}

export function hrefWithProjectFilter(href: string, projectId: string) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  applyProjectFilterToParams(params, projectId);
  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}
