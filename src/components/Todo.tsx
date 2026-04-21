import type React from "react";
import { testData } from "../libs/data";
import { useRef, useEffect, useState } from "react";
import { ClockPlus } from "lucide-react";
import type { TaskType } from "../libs/type";
import { Calendar } from "./ui/calendar";

function Todo() {
  const startY = useRef(0);
  const targetOffset = useRef(0);
  const startOffset = useRef(0);
  const currentOffset = useRef(0);
  const isDragging = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);
  const velocity = useRef(0);
  const lastY = useRef(0);

  const [todos, setTodos] = useState(testData);
  const [task, setTask] = useState("");
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [openCalendar, setOpenCalendar] = useState<{
    id: number;
    dueDate: string;
  } | null>(null);

  const ITEM_SIZE = 176;
  const todosLengthRef = useRef(todos.length);

  // close calendar on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-slot='calendar'], time")) {
        setOpenCalendar(null);
      }
    }

    if (openCalendar !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openCalendar]);

  // keep todosLengthRef in sync
  useEffect(() => {
    todosLengthRef.current = todos.length;
  }, [todos.length]);

  // wheel scroll
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
      targetOffset.current += -e.deltaY;
      targetOffset.current = Math.max(
        maxDown,
        Math.min(0, targetOffset.current),
      );
      const snap = Math.round(targetOffset.current / ITEM_SIZE) * ITEM_SIZE;
      targetOffset.current = Math.max(maxDown, Math.min(0, snap));
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  function updateItemStyle() {
    if (!listRef.current) return;
    const items = listRef.current.children;
    const selectedIndex = Math.round(-currentOffset.current / ITEM_SIZE);
    Array.from(items).forEach((item, index) => {
      const el = item as HTMLElement;
      const distance = Math.abs(index - selectedIndex);
      const scale = Math.max(0.6, 1 - distance * 0.2);
      const opacity = Math.max(0.3, 1 - distance * 0.4);
      const translateY = distance * distance * 2;
      const direction = index < selectedIndex ? -1 : 1;
      el.style.transform = `scale(${scale}) translateY(${direction * translateY}px)`;
      el.style.opacity = String(opacity);
    });
  }

  function mouseDown(e: React.MouseEvent<HTMLUListElement>) {
    if (
      (e.target as HTMLElement).closest(
        "input, button, select, label, a, [contenteditable], time",
      )
    )
      return;

    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startOffset.current = targetOffset.current;
    lastY.current = e.clientY;
    velocity.current = 0;
  }

  useEffect(() => {
    updateItemStyle();

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const diff = e.clientY - startY.current;
      let newOffset = startOffset.current + diff;
      const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
      newOffset = Math.max(maxDown, Math.min(0, newOffset));
      velocity.current = e.clientY - lastY.current;
      lastY.current = e.clientY;
      targetOffset.current = newOffset;
    }

    function handleMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      targetOffset.current += velocity.current * 5;
      const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
      targetOffset.current = Math.max(
        maxDown,
        Math.min(0, targetOffset.current),
      );
      const snap = Math.round(targetOffset.current / ITEM_SIZE) * ITEM_SIZE;
      targetOffset.current = snap;
      startOffset.current = snap;
    }

    function animate() {
      currentOffset.current +=
        (targetOffset.current - currentOffset.current) * 0.1;
      velocity.current *= 0.95;
      if (listRef.current) {
        listRef.current.style.transform = `translateY(${currentOffset.current}px)`;
      }
      updateItemStyle();
      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function addTask() {
    if (!task.trim()) return;
    const newTask: TaskType = {
      id: Date.now(),
      title: task,
      description: "Add a description",
      priority: "High",
      dueDate: "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [...prev, newTask]);
    setTask("");
    setIsTaskOpen(false);
  }

  function updateTodo(id: number, updatedTask: Partial<TaskType>) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedTask } : t)),
    );
  }

  function deleteTask(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function getTimeRemaining(dueDate: string) {
    if (!dueDate) return null;
    const diff = new Date(dueDate).getTime() - Date.now();
    const abs = Math.abs(diff);
    const mins = Math.round(abs / 60000);
    const hours = Math.round(abs / 3600000);
    const days = Math.round(abs / 86400000);

    if (abs < 60000) return "Due now!";
    if (diff < 0) {
      if (mins < 60) return `Overdue by ${mins}m`;
      if (hours < 24) return `Overdue by ${hours}h`;
      return `Overdue by ${days}d`;
    }
    if (mins < 60) return `Due in ${mins}m`;
    if (hours < 24) return `Due in ${hours}h`;
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  }

  const sortedTasks = [...todos].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const progress = todos.length
    ? Math.round((completedCount / todos.length) * 100)
    : 0;

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#fcefc2]/10 relative overflow-hidden">
      <div className="max-w-150 mx-auto w-full">
        {/* header */}
        <div className="flex justify-around items-center gap-2 px-4">
          <h1>Todo App</h1>
          <input
            type="text"
            value={task}
            placeholder="New task..."
            onFocus={() => setIsTaskOpen(true)}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            className={`${isTaskOpen ? "outline-1" : "outline-none"}`}
          />
          <button onClick={addTask}>
            <ClockPlus />
          </button>
        </div>

        {/* overall progress bar */}
        <div className="px-4 mt-2">
          <div className="flex justify-between text-xs mb-1 opacity-50">
            <span>
              {completedCount} of {todos.length} done
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor:
                  progress === 100
                    ? "#a8e49e"
                    : progress > 50
                      ? "#fac575"
                      : "#EE609C",
              }}
            />
          </div>
        </div>

        {/* card viewport */}
        <article
          data-testid="test-todo-card"
          className="w-150 overflow-hidden h-[440px] mt-16 relative mx-auto rounded-4xl z-1000"
        >
          {/* calendar — inside article so it's positioned relative to it */}
          {openCalendar && (
            <div className="absolute z-1001 top-20 left-1/2 -translate-x-1/2">
              <Calendar
                mode="single"
                selected={
                  openCalendar.dueDate
                    ? new Date(openCalendar.dueDate)
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    updateTodo(openCalendar.id, {
                      dueDate: date.toISOString(),
                    });
                  }
                  setOpenCalendar(null);
                }}
                className="rounded-lg border bg-white shadow-xl"
              />
            </div>
          )}

          {/* decorative blobs */}
          <div className="absolute w-full h-[440px] bg-[#fffdf8] z-1000 inset-0 blur-[10px] -top-110 pointer-events-none" />
          <div className="absolute w-full h-[200px] bg-[#fffdf8] z-100 blur-[10px] -bottom-40 pointer-events-none" />
          <div className="absolute w-30 h-30 bg-[#00F2FE] rounded-full blur-[100px] bottom-30 right-30 pointer-events-none" />
          <div className="absolute w-30 h-30 z-10 bg-[#EE609C] rounded-full blur-[100px] top-30 left-30 pointer-events-none" />

          {/* scrollable list */}
          <ul
            ref={listRef}
            className="flex flex-col absolute p-12 cursor-grab left-0 active:cursor-grabbing touch-none"
            onMouseDown={mouseDown}
            onTouchStart={(e) => {
              if (
                (e.target as HTMLElement).closest(
                  "input, button, select, label, a, [contenteditable], time",
                )
              )
                return;
              isDragging.current = true;
              startY.current = e.touches[0].clientY;
              startOffset.current = targetOffset.current;
              lastY.current = e.touches[0].clientY;
              velocity.current = 0;
            }}
            onTouchMove={(e) => {
              if (!isDragging.current) return;
              const diff = e.touches[0].clientY - startY.current;
              let newOffset = startOffset.current + diff;
              const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
              newOffset = Math.max(maxDown, Math.min(0, newOffset));
              velocity.current = e.touches[0].clientY - lastY.current;
              lastY.current = e.touches[0].clientY;
              targetOffset.current = newOffset;
            }}
            onTouchEnd={() => {
              if (!isDragging.current) return;
              isDragging.current = false;
              targetOffset.current += velocity.current * 5;
              const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
              targetOffset.current = Math.max(
                maxDown,
                Math.min(0, targetOffset.current),
              );
              const snap =
                Math.round(targetOffset.current / ITEM_SIZE) * ITEM_SIZE;
              targetOffset.current = Math.max(maxDown, Math.min(0, snap));
            }}
          >
            {sortedTasks.map((task) => {
              const timeRemaining = getTimeRemaining(task.dueDate);

              return (
                <li
                  key={task.id}
                  className="p-4 bg-gray-50/30 relative rounded-4xl h-[176px] overflow-hidden border-t-4 z-100 backdrop-blur-3xl border-2 border-gray-50/40 shadow-[25px_25px_10px_5px_rgba(0,0,0,0.25)] cursor-auto mb-3"
                >
                  {/* decorative blobs */}
                  <div className="absolute w-20 h-20 z-5 bg-[#EE609C] rounded-full blur-[100px] bottom-10 right-10 pointer-events-none" />
                  <div className="absolute w-150 h-150 bg-[#fcefc2]/10 rounded-full blur-[160px] -top-50 -left-50 pointer-events-none" />

                  {/* title row */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <input
                        type="checkbox"
                        data-testid="test-todo-complete-toggle"
                        className="cursor-pointer"
                        checked={task.status === "completed"}
                        aria-label={`Mark ${task.title} as complete`}
                        onChange={(e) =>
                          updateTodo(task.id, {
                            status: e.target.checked ? "completed" : "pending",
                          })
                        }
                      />
                      <h3
                        data-testid="test-todo-title"
                        className={`${task.status === "completed" ? "line-through opacity-50" : ""}`}
                      >
                        {task.title}
                      </h3>
                    </div>
                    <span
                      data-testid="test-todo-priority"
                      aria-label={`Priority: ${task.priority}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {/* description — contentEditable */}
                  <p
                    data-testid="test-todo-description"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    className="outline-none text-sm opacity-70 cursor-text"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) =>
                      updateTodo(task.id, {
                        description:
                          e.currentTarget.innerText || "Add a description",
                      })
                    }
                  >
                    {task.description}
                  </p>

                  {/* due date + time remaining */}
                  <div className="flex items-center gap-2">
                    <time
                      data-testid="test-todo-due-date"
                      dateTime={task.dueDate}
                      className="cursor-pointer text-xs opacity-50"
                      onClick={() =>
                        setOpenCalendar(
                          openCalendar?.id === task.id
                            ? null
                            : { id: task.id, dueDate: task.dueDate },
                        )
                      }
                    >
                      {task.dueDate
                        ? new Date(task.dueDate).toDateString()
                        : "Pick a date"}
                    </time>
                    {timeRemaining && (
                      <span
                        data-testid="test-todo-time-remaining"
                        aria-live="polite"
                        className="text-xs font-medium"
                        style={{
                          color: timeRemaining.startsWith("Overdue")
                            ? "#f7a8d0"
                            : timeRemaining.includes("tomorrow") ||
                                timeRemaining.includes("1")
                              ? "#fac575"
                              : "#a8e49e",
                        }}
                      >
                        {timeRemaining}
                      </span>
                    )}
                  </div>

                  {/* status + delete */}
                  <div className="flex justify-between items-center">
                    <select
                      data-testid="test-todo-status"
                      name="todo-status"
                      className="cursor-pointer bg-transparent text-sm outline-none"
                      value={task.status}
                      onChange={(e) =>
                        updateTodo(task.id, {
                          status: e.target.value as TaskType["status"],
                        })
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        data-testid="test-todo-edit-button"
                        aria-label={`Edit ${task.title}`}
                        className="cursor-pointer text-sm opacity-50 hover:opacity-100"
                        onClick={() => console.log("edit", task.id)}
                      >
                        ✎
                      </button>
                      <button
                        data-testid="test-todo-delete-button"
                        aria-label={`Delete ${task.title}`}
                        className="cursor-pointer text-sm opacity-50 hover:opacity-100 hover:text-red-400"
                        onClick={() => deleteTask(task.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* tags */}
                  <ul
                    data-testid="test-todo-tags"
                    role="list"
                    className="flex gap-1 flex-wrap mt-1"
                  >
                    <li
                      data-testid="test-todo-tag-work"
                      className="text-xs px-2 py-0.5 rounded-full bg-white/10"
                    >
                      work
                    </li>
                    <li
                      data-testid="test-todo-tag-urgent"
                      className="text-xs px-2 py-0.5 rounded-full bg-white/10"
                    >
                      urgent
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </div>
  );
}

export default Todo;
