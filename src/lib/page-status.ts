import type { GroupPage } from "@/lib/notebook-types";

export type PageStatus = "bound" | "complete" | "pending";

export function getPageStatus(page: Pick<GroupPage, "isBound" | "isComplete">) {
  if (page.isBound) return "bound";
  if (page.isComplete) return "complete";
  return "pending";
}

export function getGroupPageStatus(pages: GroupPage[]): PageStatus {
  if (pages.every((page) => page.isBound)) return "bound";
  if (pages.every((page) => page.isComplete)) return "complete";
  return "pending";
}
