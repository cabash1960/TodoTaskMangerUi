import type React from "react";
import { testData } from "../libs/data";
import { useRef, useEffect, useState } from "react";
import { ClockPlus } from "lucide-react";
import type { TaskType } from "../libs/type";

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

  const ITEM_SIZE = 176;
  const todosLengthRef = useRef(todos.length);

  useEffect(() => {
    todosLengthRef.current = todos.length;
  }, [todos.length]);

  function updateItemStlye() {
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

  function mouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
    startOffset.current = targetOffset.current;
    lastY.current = e.clientY;
    velocity.current = 0;
    // if (listRef.current) {
    //   listRef.current.style.transition = "none";
    // }
  }

  useEffect(() => {
    updateItemStlye();
    // const firstItem = listRef.current?.children[0] as HTMLElement;
    // if (firstItem) {
    //   console.log("real item height:", firstItem.offsetHeight);
    // }

    function handleMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;

      const diff = e.clientY - startY.current;
      let newOffset = startOffset.current + diff;

      const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
      const maxUp = 0;
      newOffset = Math.max(maxDown, Math.min(maxUp, newOffset));
      velocity.current = e.clientY - lastY.current;

      lastY.current = e.clientY;

      targetOffset.current = newOffset;

      // if (listRef.current) {
      //   listRef.current.style.transform = `translateY(${newOffset}px)`;
      // }
      // updateItemStlye();
    }

    // function handleMouseUp() {
    //   if (!isDragging.current) return;
    //   isDragging.current = false;
    //   targetOffset.current += velocity.current * 5;

    //   const slam = Math.round(targetOffset.current / ITEM_SIZE) * ITEM_SIZE;

    //   // currentOffset.current = slam;
    //   // if (listRef.current) {
    //   //   listRef.current.style.transition = "transform 0.3s ease";
    //   //   listRef.current.style.transform = `translateY(${slam}px)`;
    //   // }
    //   targetOffset.current = slam;
    //   startOffset.current = slam;

    //   startOffset.current = currentOffset.current;
    //   updateItemStlye();
    // }

    function handleMouseUp() {
      if (!isDragging.current) return;

      isDragging.current = false;

      targetOffset.current += velocity.current * 5;

      const maxDown = -(todosLengthRef.current - 1) * ITEM_SIZE;
      const maxUp = 0;

      targetOffset.current = Math.max(
        maxDown,
        Math.min(maxUp, targetOffset.current),
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

      updateItemStlye();

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
    const newTask: TaskType = {
      id: Date.now(),
      title: task,
      description: "",
      priority: "High",
      dueDate: "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setTodos([...todos, newTask]);
  }

  const sortedTasks = [...todos].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex justify-center items-center  min-h-screen bg-[#fcefc2]/10 relative  overflow-hidden">
      <div className=" max-w-150 mx-auto">
        {/* <div
          className="absolute w-150 h-150 bg-[#fcefc2]/60 rounded-full blur-[160px]
    -top-50 -left-50"
        /> */}
        <div className="flex  justify-around">
          <h1>Todo App</h1>
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <button onClick={addTask}>
            <ClockPlus />
          </button>
        </div>
        <article
          data-testid="test-todo-card "
          className="w-150 overflow-hidden h-[440px] mt-16 relative mx-auto rounded-4xl z-1000"
          onMouseDown={mouseDown}
        >
          <div
            className="absolute w-full h-[440px] bg-[#fffdf8] z-1000  inset-0 
    blur-[10px]
    -top-110 "
          />
          <div
            className="absolute w-full h-[200px] bg-[#fffdf8] z-100  
    blur-[10px] -bottom-40 "
          />
          <div
            className="absolute w-30 h-30 bg-[#00F2FE] rounded-full
    blur-[100px]
    bottom-30 right-30"
          />

          <div
            className="absolute w-30 h-30 z-10 bg-[#EE609C] rounded-full
    blur-[100px]
    top-30 left-30"
          />

          <ul
            ref={listRef}
            className={`flex flex-col  absolute p-12 cursor-grab left-0 active:cursor-grabbing`}
          >
            {sortedTasks.map((task) => {
              return (
                <li
                  key={task.id}
                  className="p-4 bg-gray-50/30 relative rounded-4xl overflow-hidden  h-[176px] border-t-4 z-100 backdrop-blur-3xl border-2 border-gray-50/40 shadow-[25px_25px_10px_5px_rgba(0,0,0,0.25)]"
                >
                  <div
                    className="absolute w-20 h-20 z-5 bg-[#EE609C] rounded-full
    blur-[100px]
    bottom-10 right-10"
                  />
                  <div
                    className="absolute w-150 h-150 bg-[#fcefc2]/10 rounded-full blur-[160px]
    -top-50 -left-50"
                  />
                  <div className="flex justify-between">
                    {" "}
                    <h3 data-testid="test-todo-title">{task.title}</h3>
                    <span data-testid="test-todo-priority">
                      {task.priority}
                    </span>
                  </div>
                  <p data-testid="test-todo-description">{task.description}</p>
                  <time
                    data-testid="test-todo-due-date"
                    dateTime="2026-03-01T18:00:00Z"
                  >
                    {task.dueDate}
                  </time>{" "}
                  <div className="flex justify-between">
                    <select
                      data-testid="test-todo-status"
                      name="todo-status"
                      id="todo-status"
                      className="cursor-pointer"
                    >
                      <option value="">pending</option>
                      <option value="">in-progress</option>
                      <option value="">completed</option>
                    </select>
                    <p>28%</p>
                  </div>
                  <div> progress Bar </div>
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
