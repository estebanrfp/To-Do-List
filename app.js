import { gdb } from "https://cdn.jsdelivr.net/npm/genosdb@latest/dist/index.min.js";

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const taskInput = document.getElementById('task-input');
  const addButton = document.getElementById('add-button');
  const taskList = document.getElementById('task-list');
  const tasksCount = document.getElementById('tasks-count');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterButtons = document.querySelectorAll('.filter');

  // Async DB initialization
  const db = await gdb('todoList-47954');
  const taskCache = new Map();
  let currentFilter = 'all';

  // Update pending tasks count
  const updateTasksCount = () => {
    const count = [...taskCache.values()].filter(t => !t.completed).length;
    tasksCount.textContent = `${count} ${count === 1 ? 'pending task' : 'pending tasks'}`;
  };

  // Create a task list item
  const createTaskElement = (id, task) => {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = id;

    const checkIcon = document.createElement('i');
    checkIcon.className = `task-check fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}`;
    checkIcon.onclick = () => toggleTaskStatus(id);

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-task';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => db.remove(id);

    li.append(checkIcon, taskText, deleteBtn);
    return li;
  };

  // Render tasks according to filter
  const renderTasks = () => {
    taskList.innerHTML = '';
    [...taskCache.entries()]
      .filter(([_, task]) =>
        currentFilter === 'active' ? !task.completed :
        currentFilter === 'completed' ? task.completed : true
      )
      .forEach(([id, task]) => taskList.appendChild(createTaskElement(id, task)));
    updateTasksCount();
  };

  // Add a new task
  const addTask = async () => {
    const text = taskInput.value.trim();
    if (!text) return;
    await db.put({ text, completed: false });
    taskInput.value = '';
    taskInput.focus();
  };

  // Toggle task completion status
  const toggleTaskStatus = async (id) => {
    const task = taskCache.get(id);
    if (!task) return;
    await db.put({ ...task, completed: !task.completed }, id);
  };

  // Remove all completed tasks
  const clearCompletedTasks = async () => {
    for (const [id, task] of taskCache.entries()) {
      if (task.completed) await db.remove(id);
    }
  };

  // Change filter and update UI
  const changeFilter = (filter) => {
    currentFilter = filter;
    filterButtons.forEach(btn =>
      btn.classList.toggle('active', btn.dataset.filter === filter)
    );
    renderTasks();
  };

  // Real-time DB reaction
  await db.map(({ id, value, action }) => {
    if (['added', 'initial', 'updated'].includes(action)) taskCache.set(id, value);
    if (action === 'removed') taskCache.delete(id);
    renderTasks();
  });

  // Event Listeners
  addButton.onclick = addTask;
  taskInput.onkeydown = (e) => { if (e.key === 'Enter') addTask(); };
  clearCompletedBtn.onclick = clearCompletedTasks;
  filterButtons.forEach(btn =>
    btn.onclick = () => changeFilter(btn.dataset.filter)
  );
});
