import type React from "react";
import { testData } from "../libs/data";
import { useRef, useEffect, useState } from "react";
import { ClockPlus } from "lucide-react";
import type { TaskType } from "../libs/type";
import { Calendar } from "./ui/calendar";
import Dropdown from "./Dropdown";

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
  const [now, setNow] = useState(() => Date.now());

  const ITEM_SIZE = 176;
  const todosLengthRef = useRef(todos.length);

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

  useEffect(() => {
    todosLengthRef.current = todos.length;
  }, [todos.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
      priority: "Set priority",
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
    const diff = new Date(dueDate).getTime() - now;
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100 relative overflow-hidden">
      <div className="w-full max-w-[95%] sm:max-w-[400px] lg:max-w-[600px] mx-auto">
        <div className="flex justify-between items-center gap-2 px-4 w-full">
          <h1
            data-testid="test-todo-headerTitle"
            className={`font-bold text-2xl duration-300 transition-all md:text-3xl lg:text-4xl text-center text-gray-900 ${isTaskOpen ? " scale-90 text-gray-600" : "scale-100"}`}
          >
            Dodo
          </h1>
          <input
            type="text"
            value={task}
            placeholder="New task..."
            onFocus={() => setIsTaskOpen(true)}
            onChange={(e) => setTask(e.target.value)}
            onBlur={() => setIsTaskOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
              setIsTaskOpen(false);
            }}
            className={`flex-1 min-w-0 px-4 py-2 transition-all duration-300 placeholder-gray-400 bg-transparent ${isTaskOpen ? "shadow-[0_0_15px_rgba(0,0,0,0.1)] scale-105 focus:outline-none rounded-4xl bg-white/50" : "outline-none"}`}
          />
          <button
            onClick={addTask}
            className={`shrink-0 duration-300 transition-all text-gray-700 ${isTaskOpen ? "inset-shadow-xs scale-90" : "scale-100"}`}
          >
            <ClockPlus size={24} />
          </button>
        </div>

        <div className="px-4 mt-10">
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

        <article
          data-testid="test-todo-card"
          className="w-full overflow-hidden h-[440px] mt-8 sm:mt-16 relative mx-auto   z-1000 "
        >
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

          <div className="absolute w-full h-[440px] bg-gray-100 z-1000 inset-0 blur-[30px] -top-100 pointer-events-none" />
          <div className="absolute w-full h-[200px] bg-gray-100 z-100 blur-[30px] -bottom-40 pointer-events-none" />
          {/* <div className="absolute w-30 h-30 bg-[#00F2FE] rounded-full blur-[100px] bottom-30 right-30 pointer-events-none" /> */}
          {/* <div className="absolute w-30 h-30 z-10 bg-[#EE609C] rounded-full blur-[100px] top-30 left-30 pointer-events-none" /> */}

          <ul
            ref={listRef}
            className="flex flex-col absolute w-full p-4 sm:p-8 md:p-14 cursor-grab left-0 active:cursor-grabbing touch-none"
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
                  className="flex flex-col p-4 bg-gray-50/20 relative rounded-3xl sm:rounded-4xl h-[176px] overflow-hidden z-100 backdrop-blur-3xl border-t-4 border-t-gray-50 border-l-4 border-l-gray-50 shadow-[10px_5px_15px_10px_rgba(0,0,0,0.1)] cursor-auto mb-3"
                >
                  <div className="absolute w-20 h-20 z-5 bg-[#000000] rounded-full blur-[100px] bottom-5 right-8 pointer-events-none" />
                  <div className="absolute w-150 h-150 bg-gray-50/ -z-50 rounded-full blur-[160px] -top-50 -left-50 pointer-events-none" />

                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2 items-center min-w-0 flex-1">
                      <input
                        type="checkbox"
                        data-testid="test-todo-complete-toggle"
                        className="cursor-pointer accent-[#EE609C] shrink-0 w-4 h-4"
                        checked={task.status === "completed"}
                        aria-label={`Mark ${task.title} as complete`}
                        onChange={(e) =>
                          updateTodo(task.id, {
                            status: e.target.checked ? "completed" : "pending",
                          })
                        }
                      />
                      <h2
                        data-testid="test-todo-title"
                        className={`font-medium truncate text-[20px] ${task.status === "completed" ? "line-through opacity-50" : ""}`}
                        title={task.title}
                      >
                        {task.title}
                      </h2>
                    </div>
                    <Dropdown
                      data-testid="test-todo-priority"
                      value={task.priority}
                      pos={"top-5 left-50 right-10"}
                      onChange={(val) =>
                        updateTodo(task.id, {
                          priority: val as TaskType["priority"],
                        })
                      }
                      options={[
                        {
                          value: "Set priority",
                          label: "Set priority",
                          color: "#9ca3af",
                        },
                        { value: "High", label: "High", color: "#f87171" },
                        { value: "Medium", label: "Medium", color: "#fac575" },
                        { value: "Low", label: "Low", color: "#a8e49e" },
                      ]}
                    />
                    {/* <select
                      data-testid="test-todo-priority"
                      name="todo-priority"
                      className="cursor-pointer text-xs sm:text-sm outline-none shrink-0 bg-transparent appearance-none text-center"
                      style={{
                        color:
                          task.priority === "High"
                            ? "#f87171"
                            : task.priority === "Medium"
                              ? "#fac575"
                              : task.priority === "Low"
                                ? "#a8e49e"
                                : "#9ca3af",
                      }}
                      value={task.priority}
                      onChange={(e) =>
                        updateTodo(task.id, {
                          priority: e.target.value as TaskType["priority"],
                        })
                      }
                    >
                      <option value="Set priority" style={{ color: "#9ca3af" }}>
                        Set priority
                      </option>
                      <option value="High" style={{ color: "#f87171" }}>
                        High
                      </option>
                      <option value="Medium" style={{ color: "#fac575" }}>
                        Medium
                      </option>
                      <option value="Low" style={{ color: "#a8e49e" }}>
                        Low
                      </option>
                    </select> */}
                  </div>

                  <p
                    data-testid="test-todo-description"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    className="outline-none text-[12px] mt-2 sm:text-sm text-gray-500 cursor-text overflow-hidden whitespace-nowrap text-ellipsis shrink-0"
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

                  <div className="flex flex-wrap  mt-2 items-center gap-2">
                    <time
                      data-testid="test-todo-due-date"
                      dateTime={task.dueDate}
                      className="cursor-pointer text-xs text-gray-400"
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

                  <div className="flex mt-3 justify-between items-center">
                    {/* <select
                      data-testid="test-todo-status"
                      name="todo-status"
                      className="cursor-pointer text-xs sm:text-sm outline-none shrink-0 bg-transparent appearance-none"
                      style={{
                        color:
                          task.status === "completed"
                            ? "#a8e49e"
                            : task.status === "in-progress"
                              ? "#fac575"
                              : "#9ca3af",
                      }}
                      value={task.status}
                      onChange={(e) =>
                        updateTodo(task.id, {
                          status: e.target.value as TaskType["status"],
                        })
                      }
                    >
                      <option value="pending" style={{ color: "#9ca3af" }}>
                        Pending
                      </option>
                      <option value="in-progress" style={{ color: "#fac575" }}>
                        In Progress
                      </option>
                      <option value="completed" style={{ color: "#a8e49e" }}>
                        Completed
                      </option>
                    </select> */}
                    <Dropdown
                      data-testId="test-todo-status"
                      value={task.status}
                      onChange={(val) =>
                        updateTodo(task.id, {
                          status: val as TaskType["status"],
                        })
                      }
                      pos={"top-5 left-10 right-50"}
                      options={[
                        {
                          value: "pending",
                          label: "Pending",
                          color: "#9ca3af",
                        },
                        {
                          value: "in-progress",
                          label: "In Progress",
                          color: "#fac575",
                        },
                        {
                          value: "completed",
                          label: "Completed",
                          color: "#a8e49e",
                        },
                      ]}
                    />

                    <div className="absolute bottom-5 right-5">
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

                  <ul
                    data-testid="test-todo-tags"
                    role="list"
                    className="flex gap-1 flex-wrap  mt-2"
                  >
                    <li
                      data-testid="test-todo-tag-work"
                      className="text-xs px-2 py-0.5 rounded-full text-gray-400 bg-gray-200"
                    >
                      work
                    </li>
                    <li
                      data-testid="test-todo-tag-urgent"
                      className="text-xs px-2 py-0.5 rounded-full text-gray-400 bg-gray-200"
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
