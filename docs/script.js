// ----- State -----
const STORAGE_KEY = 'todo-tasks-v1';
let storage = null;

function getStorage() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch (error) {
    try {
      const testKey = '__storage_test__';
      window.sessionStorage.setItem(testKey, testKey);
      window.sessionStorage.removeItem(testKey);
      return window.sessionStorage;
    } catch (sessionError) {
      console.warn('Storage is not available in this browser context:', sessionError);
      return null;
    }
  }
}

storage = getStorage();

function loadTasks() {
  if (!storage) return null;

  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Could not load tasks from storage:', error);
    return null;
  }
}

function saveTasks() {
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let tasks = loadTasks() ?? [
  { id: 1, text: 'Review Q3 budget projections', priority: 'high', category: 'work', done: false, date: 'Jul 5' },
  { id: 2, text: 'Buy groceries — oat milk, eggs, greens', priority: 'low', category: 'errands', done: false, date: 'Jul 5' },
  { id: 3, text: 'Finish reading Thinking, Fast and Slow', priority: 'medium', category: 'study', done: true, date: 'Jul 4' },
  { id: 4, text: 'Morning run — 5km before 8am', priority: 'medium', category: 'health', done: false, date: 'Jul 6' },
  { id: 5, text: 'Call mom for her birthday', priority: 'high', category: 'personal', done: true, date: 'Jul 3' },
  { id: 6, text: 'Submit design proposal to client', priority: 'high', category: 'work', done: false, date: 'Jul 6' }
];

let nextId = tasks.length ? Math.max(...tasks.map(task => task.id)) + 1 : 1;
let currentPriority = 'medium';
let currentStatusFilter = 'all';
let currentCategoryFilter = 'all';

saveTasks();

// ----- Elements -----
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const categorySelect = document.getElementById('categorySelect');
const priorityBtns = document.querySelectorAll('.priority-btn');
const statusFilterBtns = document.querySelectorAll('.status-filters .filter-btn');
const categoryFilterBtns = document.querySelectorAll('.category-filters .cat-btn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskCountEl = document.getElementById('taskCount');
const completedCountEl = document.getElementById('completedCount');
const remainingCountEl = document.getElementById('remainingCount');
const progressPercentEl = document.getElementById('progressPercent');
const progressFillEl = document.getElementById('progressFill');
const clearCompletedBtn = document.getElementById('clearCompleted');

const PRIORITY_ICON = { high: '!!!', medium: '!!', low: '!' };
const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ----- Rendering -----
function render() {
  const filtered = tasks.filter(task => {
    const statusOk =
      currentStatusFilter === 'all' ||
      (currentStatusFilter === 'active' && !task.done) ||
      (currentStatusFilter === 'done' && task.done);
    const categoryOk = currentCategoryFilter === 'all' || task.category === currentCategoryFilter;
    return statusOk && categoryOk;
  });

  taskList.innerHTML = '';

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    li.innerHTML = `
      <button class="task-check" aria-label="Toggle task complete">${task.done ? '✓' : ''}</button>
      <span class="task-text"></span>
      <div class="task-meta">
        <span class="priority-tag ${task.priority}">${PRIORITY_ICON[task.priority]} ${task.priority.toUpperCase()}</span>
        <span class="category-tag">${task.category.toUpperCase()}</span>
        <span class="date-tag">📅 ${task.date}</span>
        <button class="task-delete" aria-label="Delete task">✕</button>
      </div>
    `;

    // set text via textContent to avoid injecting HTML
    li.querySelector('.task-text').textContent = task.text;

    li.querySelector('.task-check').addEventListener('click', () => toggleTask(task.id));
    li.querySelector('.task-delete').addEventListener('click', () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  emptyState.classList.toggle('is-visible', filtered.length === 0);
  updateStats();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  taskCountEl.textContent = `${total} TASK${total === 1 ? '' : 'S'}`;
  completedCountEl.textContent = `${completed} COMPLETED`;
  remainingCountEl.textContent = `${remaining} remaining`;
  progressPercentEl.textContent = `${percent}%`;
  progressFillEl.style.width = `${percent}%`;
}

// ----- Actions -----
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.push({
    id: nextId++,
    text,
    priority: currentPriority,
    category: categorySelect.value,
    done: false,
    date: todayLabel()
  });

  saveTasks();
  taskInput.value = '';
  taskInput.focus();
  render();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function clearCompleted() {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  render();
}

// ----- Event listeners -----
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

priorityBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    priorityBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentPriority = btn.dataset.priority;
  });
});

statusFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    statusFilterBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentStatusFilter = btn.dataset.filter;
    render();
  });
});

categoryFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryFilterBtns.forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentCategoryFilter = btn.dataset.cat;
    render();
  });
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// ----- Init -----
if (!storage) {
  console.warn('No storage available, so tasks will not persist after reload.');
}

render();
