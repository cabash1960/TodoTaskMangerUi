export interface TaskType {
  id: number;
  title: string;
  priority: string;
  dueDate: string;
  status: StatusType;
  description: string;
  createdAt: string;
}

export type StatusType = "pending" | "in-progress" | "completed";
export type PriorityType = "High" | "Medium" | "Low" | "Set priority";
