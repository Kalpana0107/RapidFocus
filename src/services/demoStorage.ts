export const DEMO_USER = {
  uid: 'demo-user',
  displayName: 'Demo User',
  email: 'demo@rapidfocus.app',
  photoURL: null,
  isDemo: true,
};

export const getDemoTasks = () => {
  const data = localStorage.getItem('demo_tasks');
  return data ? JSON.parse(data) : [];
};

export const saveDemoTasks = (tasks: any[]) => {
  localStorage.setItem('demo_tasks', JSON.stringify(tasks));
};

export const addDemoTask = (task: any) => {
  const tasks = getDemoTasks();
  const newTask = { 
    ...task, 
    id: "demo-task-" + Date.now().toString(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(newTask);
  saveDemoTasks(tasks);
  return newTask;
};

export const updateDemoTask = (taskId: string, updates: any) => {
  const tasks = getDemoTasks();
  const index = tasks.findIndex((t: any) => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
  }
  saveDemoTasks(tasks);
};

export const getDemoGoals = () => {
  const data = localStorage.getItem('demo_goals');
  return data ? JSON.parse(data) : [];
};

export const saveDemoGoals = (goals: any[]) => {
  localStorage.setItem('demo_goals', JSON.stringify(goals));
};

export const getDemoHabits = () => {
  const data = localStorage.getItem('demo_habits');
  return data ? JSON.parse(data) : [];
};

export const saveDemoHabits = (habits: any[]) => {
  localStorage.setItem('demo_habits', JSON.stringify(habits));
};
