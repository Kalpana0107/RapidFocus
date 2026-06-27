export const DEMO_USER = {
  uid: 'demo-user',
  displayName: 'Demo User',
  email: 'demo@rapidfocus.app',
  photoURL: null,
  isDemo: true,
};

export const getDemoTasks = () => {
  const data = localStorage.getItem('demo_tasks');
  return data ? JSON.parse(data) : [
    {
      id: "demo-task-1",
      title: "Complete RapidFocus Onboarding",
      description: "Initialize and explore the main control dashboard",
      deadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      priority: "Critical",
      category: "Work",
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-task-2",
      title: "Draft project proposal",
      description: "Use AI coaching tool to brainstorm structure",
      deadline: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      priority: "High",
      category: "Research",
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString()
    }
  ];
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
  return data ? JSON.parse(data) : [
    {
      id: "demo-goal-1",
      title: "Daily Focus Marathon",
      type: "goal",
      targetDays: 3,
      completedDays: [],
      streak: 0,
      createdAt: new Date().toISOString()
    }
  ];
};

export const saveDemoGoals = (goals: any[]) => {
  localStorage.setItem('demo_goals', JSON.stringify(goals));
};

export const getDemoHabits = () => {
  const data = localStorage.getItem('demo_habits');
  return data ? JSON.parse(data) : [
    {
      id: "demo-habit-1",
      title: "Drink 2L Water",
      type: "habit",
      targetDays: 7,
      completedDays: [],
      streak: 0,
      createdAt: new Date().toISOString()
    }
  ];
};

export const saveDemoHabits = (habits: any[]) => {
  localStorage.setItem('demo_habits', JSON.stringify(habits));
};
