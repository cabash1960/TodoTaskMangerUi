import type { TaskType } from "./type";

export const testData: TaskType[] = [
  {
    id: 1,
    title: "home work",
    description: "Complete math and English assignments before the deadline.",
    priority: "High",
    dueDate: "2026-03-01T18:00:00Z",
    status: "pending",
    createdAt: "2026-03-01T18:00:00Z",
  },
  {
    id: 2,
    title: "finish frontend task",
    description: "Build and style the todo card component for Stage 0 task.",
    priority: "Medium",
    dueDate: "2026-04-20T12:00:00Z",
    createdAt: "2026-04-09T12:00:00Z",
    status: "in-progress",
  },
  {
    id: 3,
    title: "buy groceries",
    description:
      "Get rice, vegetables, cooking oil, and snacks from the store.",
    priority: "Low",
    dueDate: "2026-04-16T17:30:00Z",
    createdAt: "2026-04-10T17:30:00Z",
    status: "completed",
  },
  {
    id: 4,
    title: "prepare presentation",
    description:
      "Create slides and rehearse for the upcoming project presentation.",
    priority: "High",
    dueDate: "2026-04-18T09:00:00Z",
    createdAt: "2026-04-11T09:00:00Z",
    status: "pending",
  },
  {
    id: 5,
    title: "call client",
    description: "Discuss project requirements and confirm delivery timeline.",
    priority: "Medium",
    dueDate: "2026-04-17T15:00:00Z",
    createdAt: "2026-04-12T15:00:00Z",
    status: "in-progress",
  },
];
