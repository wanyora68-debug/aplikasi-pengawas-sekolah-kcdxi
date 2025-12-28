// Local Storage Database Utility
// This is a simple localStorage-based database for development

export interface User {
  id: string;
  email: string;
  full_name: string;
  nip?: string;
  position?: string;
  pangkat?: string;
  unit_kerja?: string;
  profile_photo?: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  npsn?: string;
  address?: string;
  level: 'SLB' | 'SMA' | 'SMK';
  principal_name?: string;
  photo_url_1?: string;
  photo_url_2?: string;
  user_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  activity_name: string;
  category: string;
  school_id?: string;
  date: string;
  accompaniment_type?: string;
  duration_hours?: number;
  notes?: string;
  document_url?: string;
  photo_url_1?: string;
  photo_url_2?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  activity_name: string;
  date: string;
  location: string;
  organizer: string;
  description: string;
  photo_url_1?: string;
  photo_url_2?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Current user session
let currentUser: User | null = null;

// Generate UUID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Get data from localStorage
export const getData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return [];
  }
};

// Save data to localStorage
export const saveData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Initialize default data
export const initializeLocalStorage = () => {
  console.log("=== INITIALIZING LOCALSTORAGE ===");
  
  // Create default user if none exists
  const users = getData<User>('users');
  console.log("Existing users:", users);
  
  if (users.length === 0) {
    const defaultUser: User = {
      id: 'user-demo-123',
      email: 'pengawas@demo.com',
      full_name: 'Pengawas Demo',
      nip: '123456789',
      position: 'Pengawas Sekolah',
      pangkat: 'Pembina, IV/a',
      unit_kerja: 'Cabang Dinas Pendidikan Wilayah XI',
      role: 'user',
      created_at: new Date().toISOString(),
    };
    
    const adminUser: User = {
      id: 'admin-demo-456',
      email: 'admin@demo.com',
      full_name: 'Admin Demo',
      nip: '987654321',
      position: 'Administrator',
      pangkat: 'Pembina Utama, IV/e',
      unit_kerja: 'Cabang Dinas Pendidikan Wilayah XI',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    
    console.log("Creating default users:", [defaultUser, adminUser]);
    saveData('users', [defaultUser, adminUser]);
    console.log("Default users saved successfully");
  }

  // Initialize empty arrays for other data if they don't exist
  if (!localStorage.getItem('schools')) {
    console.log("Initializing schools array");
    saveData('schools', []);
  }
  if (!localStorage.getItem('activities')) {
    console.log("Initializing activities array");
    saveData('activities', []);
  }
  if (!localStorage.getItem('tasks')) {
    console.log("Initializing tasks array");
    saveData('tasks', []);
  }
  
  console.log("=== LOCALSTORAGE INITIALIZATION COMPLETE ===");
};

// Auth functions
export const auth = {
  signIn: async (email: string, password: string) => {
    console.log("=== LOGIN DEBUG ===");
    console.log("Attempting login with email:", email);
    
    const users = getData<User>('users');
    console.log("All users in localStorage:", users);
    
    const user = users.find(u => u.email === email);
    console.log("Found user:", user);
    
    if (user) {
      // For demo purposes, accept 'demo123' for demo accounts or any password for registered users
      const isValidPassword = password === 'demo123' || 
                             (user.email !== 'pengawas@demo.com' && user.email !== 'admin@demo.com' && password.length >= 6);
      
      if (isValidPassword) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        console.log("Login successful for user:", user.email, "role:", user.role);
        return { user, error: null };
      }
    }
    
    console.log("Login failed - user not found or wrong password");
    return { user: null, error: { message: 'Email atau password salah' } };
  },

  signUp: async (email: string, password: string, userData: { 
    full_name: string;
    nip?: string;
    position?: string;
    pangkat?: string;
    unit_kerja?: string;
  }) => {
    console.log("=== REGISTER DEBUG ===");
    console.log("Attempting registration with email:", email);
    console.log("User data:", userData);
    
    const users = getData<User>('users');
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      console.log("Registration failed - email already exists");
      return { user: null, error: { message: 'Email sudah terdaftar' } };
    }

    // Validate password (in real app, this would be hashed)
    if (password.length < 6) {
      return { user: null, error: { message: 'Password minimal 6 karakter' } };
    }

    const newUser: User = {
      id: generateId(),
      email,
      full_name: userData.full_name,
      nip: userData.nip,
      position: userData.position,
      pangkat: userData.pangkat,
      unit_kerja: userData.unit_kerja,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    console.log("Creating new user:", newUser);
    users.push(newUser);
    saveData('users', users);
    
    console.log("Registration successful for user:", newUser.email);
    return { user: newUser, error: null };
  },

  signOut: async () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    return { error: null };
  },

  getUser: async () => {
    console.log("=== AUTH.GETUSER DEBUG ===");
    
    if (currentUser) {
      console.log("getUser: returning currentUser:", currentUser);
      return { user: currentUser, error: null };
    }
    
    try {
      const storedUser = localStorage.getItem('currentUser');
      console.log("getUser: storedUser from localStorage:", storedUser);
      
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log("getUser: loaded from localStorage:", currentUser);
        
        // Verify user still exists in users array
        const users = getData<User>('users');
        const userExists = users.find(u => u.id === currentUser?.id);
        
        if (!userExists) {
          console.log("getUser: user no longer exists in users array, clearing session");
          currentUser = null;
          localStorage.removeItem('currentUser');
          return { user: null, error: null };
        }
        
        return { user: currentUser, error: null };
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('currentUser');
    }
    
    console.log("getUser: no user found");
    return { user: null, error: null };
  },
};

// Schools CRUD
export const schools = {
  getAll: async (userId: string) => {
    const allSchools = getData<School>('schools');
    const userSchools = allSchools.filter(s => s.user_id === userId);
    return { data: userSchools, error: null };
  },

  create: async (schoolData: Omit<School, 'id' | 'created_at'>) => {
    const allSchools = getData<School>('schools');
    const newSchool: School = {
      ...schoolData,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    
    allSchools.push(newSchool);
    saveData('schools', allSchools);
    return { data: newSchool, error: null };
  },

  update: async (id: string, updates: Partial<School>) => {
    const allSchools = getData<School>('schools');
    const index = allSchools.findIndex(s => s.id === id);
    
    if (index === -1) {
      return { data: null, error: { message: 'Sekolah tidak ditemukan' } };
    }
    
    allSchools[index] = { ...allSchools[index], ...updates };
    saveData('schools', allSchools);
    return { data: allSchools[index], error: null };
  },

  delete: async (id: string) => {
    const allSchools = getData<School>('schools');
    const filteredSchools = allSchools.filter(s => s.id !== id);
    saveData('schools', filteredSchools);
    return { error: null };
  },
};

// Activities CRUD
export const activities = {
  getAll: async (userId: string, filters?: { category?: string }) => {
    console.log("=== ACTIVITIES.GETALL DEBUG ===");
    console.log("activities.getAll called with userId:", userId, "filters:", filters);
    
    const allActivities = getData<Activity>('activities');
    console.log("All activities from localStorage:", allActivities);
    console.log("Total activities count:", allActivities.length);
    
    let userActivities = allActivities.filter(a => {
      console.log(`Checking activity ${a.id}: user_id=${a.user_id}, matches=${a.user_id === userId}`);
      return a.user_id === userId;
    });
    console.log("User activities after filtering by userId:", userActivities);
    console.log("User activities count:", userActivities.length);
    
    if (filters?.category) {
      userActivities = userActivities.filter(a => {
        console.log(`Checking category for ${a.id}: category=${a.category}, filter=${filters.category}, matches=${a.category === filters.category}`);
        return a.category === filters.category;
      });
      console.log("User activities after filtering by category:", userActivities);
      console.log("Filtered activities count:", userActivities.length);
    }
    
    // Sort by date descending
    userActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log("=== ACTIVITIES.GETALL RESULT ===");
    console.log("Final activities to return:", userActivities);
    
    return { data: userActivities, error: null };
  },

  create: async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    console.log("=== ACTIVITIES.CREATE DEBUG ===");
    console.log("activities.create called with data:", activityData);
    
    // Validate required fields
    if (!activityData.user_id) {
      console.error("Missing user_id in activity data");
      return { data: null, error: { message: 'User ID is required' } };
    }
    
    if (!activityData.activity_name?.trim()) {
      console.error("Missing activity_name in activity data");
      return { data: null, error: { message: 'Activity name is required' } };
    }
    
    const allActivities = getData<Activity>('activities');
    console.log("Current activities before save:", allActivities);
    
    const newActivity: Activity = {
      ...activityData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log("New activity to save:", newActivity);
    
    allActivities.push(newActivity);
    
    try {
      saveData('activities', allActivities);
      console.log("Activity saved successfully");
      
      // Verify save
      const savedActivities = getData<Activity>('activities');
      const savedActivity = savedActivities.find(a => a.id === newActivity.id);
      
      if (savedActivity) {
        console.log("Verification: Activity found in localStorage after save");
        console.log("All activities after save:", savedActivities);
        return { data: newActivity, error: null };
      } else {
        console.error("Verification failed: Activity not found after save");
        return { data: null, error: { message: 'Failed to save activity' } };
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      return { data: null, error: { message: 'Failed to save activity' } };
    }
  },

  update: async (id: string, updates: Partial<Activity>) => {
    console.log("=== ACTIVITIES.UPDATE DEBUG ===");
    console.log("Updating activity:", id, "with:", updates);
    
    const allActivities = getData<Activity>('activities');
    const index = allActivities.findIndex(a => a.id === id);
    
    if (index === -1) {
      console.error("Activity not found for update:", id);
      return { data: null, error: { message: 'Aktivitas tidak ditemukan' } };
    }
    
    allActivities[index] = { 
      ...allActivities[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    try {
      saveData('activities', allActivities);
      console.log("Activity updated successfully");
      return { data: allActivities[index], error: null };
    } catch (error) {
      console.error("Error updating activity:", error);
      return { data: null, error: { message: 'Failed to update activity' } };
    }
  },

  delete: async (id: string) => {
    console.log("=== ACTIVITIES.DELETE DEBUG ===");
    console.log("Deleting activity:", id);
    
    const allActivities = getData<Activity>('activities');
    const filteredActivities = allActivities.filter(a => a.id !== id);
    
    try {
      saveData('activities', filteredActivities);
      console.log("Activity deleted successfully");
      return { error: null };
    } catch (error) {
      console.error("Error deleting activity:", error);
      return { error: { message: 'Failed to delete activity' } };
    }
  },
};

// Tasks CRUD
export const tasks = {
  getAll: async (userId: string) => {
    console.log("=== TASKS.GETALL DEBUG ===");
    console.log("tasks.getAll called with userId:", userId);
    
    const allTasks = getData<Task>('tasks');
    console.log("All tasks from localStorage:", allTasks);
    console.log("Total tasks count:", allTasks.length);
    
    const userTasks = allTasks.filter(t => {
      console.log(`Checking task ${t.id}: user_id=${t.user_id}, matches=${t.user_id === userId}`);
      return t.user_id === userId;
    });
    console.log("User tasks after filtering:", userTasks);
    console.log("User tasks count:", userTasks.length);
    
    // Sort by date descending
    userTasks.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log("=== TASKS.GETALL RESULT ===");
    console.log("Final tasks to return:", userTasks);
    
    return { data: userTasks, error: null };
  },

  create: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    console.log("=== TASKS.CREATE DEBUG ===");
    console.log("tasks.create called with data:", taskData);
    
    // Validate required fields
    if (!taskData.user_id) {
      console.error("Missing user_id in task data");
      return { data: null, error: { message: 'User ID is required' } };
    }
    
    if (!taskData.activity_name?.trim()) {
      console.error("Missing activity_name in task data");
      return { data: null, error: { message: 'Activity name is required' } };
    }
    
    const allTasks = getData<Task>('tasks');
    console.log("Current tasks before save:", allTasks);
    
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log("New task to save:", newTask);
    
    allTasks.push(newTask);
    
    try {
      saveData('tasks', allTasks);
      console.log("Task saved successfully");
      
      // Verify save
      const savedTasks = getData<Task>('tasks');
      const savedTask = savedTasks.find(t => t.id === newTask.id);
      
      if (savedTask) {
        console.log("Verification: Task found in localStorage after save");
        console.log("All tasks after save:", savedTasks);
        return { data: newTask, error: null };
      } else {
        console.error("Verification failed: Task not found after save");
        return { data: null, error: { message: 'Failed to save task' } };
      }
    } catch (error) {
      console.error("Error saving task:", error);
      return { data: null, error: { message: 'Failed to save task' } };
    }
  },

  update: async (id: string, updates: Partial<Task>) => {
    console.log("=== TASKS.UPDATE DEBUG ===");
    console.log("Updating task:", id, "with:", updates);
    
    const allTasks = getData<Task>('tasks');
    const index = allTasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.error("Task not found for update:", id);
      return { data: null, error: { message: 'Tugas tidak ditemukan' } };
    }
    
    allTasks[index] = { 
      ...allTasks[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    try {
      saveData('tasks', allTasks);
      console.log("Task updated successfully");
      return { data: allTasks[index], error: null };
    } catch (error) {
      console.error("Error updating task:", error);
      return { data: null, error: { message: 'Failed to update task' } };
    }
  },

  delete: async (id: string) => {
    console.log("=== TASKS.DELETE DEBUG ===");
    console.log("Deleting task:", id);
    
    const allTasks = getData<Task>('tasks');
    const filteredTasks = allTasks.filter(t => t.id !== id);
    
    try {
      saveData('tasks', filteredTasks);
      console.log("Task deleted successfully");
      return { error: null };
    } catch (error) {
      console.error("Error deleting task:", error);
      return { error: { message: 'Failed to delete task' } };
    }
  },
};

// Profiles CRUD
export const profiles = {
  get: async (userId: string) => {
    const users = getData<User>('users');
    const user = users.find(u => u.id === userId);
    return { data: user || null, error: null };
  },

  update: async (userId: string, updates: Partial<User>) => {
    const users = getData<User>('users');
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
      return { data: null, error: { message: 'User tidak ditemukan' } };
    }
    
    users[index] = { ...users[index], ...updates };
    saveData('users', users);
    
    // Update current user if it's the same user
    if (currentUser && currentUser.id === userId) {
      currentUser = users[index];
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    return { data: users[index], error: null };
  },
};

// Photo upload simulation
export const uploadPhoto = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
};

// Statistics with monthly breakdown
export const getStatistics = async (userId: string) => {
  const [activitiesRes, schoolsRes, tasksRes] = await Promise.all([
    activities.getAll(userId),
    schools.getAll(userId),
    tasks.getAll(userId),
  ]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const activitiesThisMonth = activitiesRes.data?.filter((activity) => {
    const activityDate = new Date(activity.date);
    return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
  }).length || 0;

  // Monthly breakdown
  const monthlyStats: { [key: string]: number } = {};
  activitiesRes.data?.forEach((activity) => {
    const date = new Date(activity.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
  });

  return {
    totalActivities: activitiesRes.data?.length || 0,
    totalSchools: schoolsRes.data?.length || 0,
    totalTasks: tasksRes.data?.length || 0,
    activitiesThisMonth,
    monthlyStats,
  };
};

// Clear current session (for development)
export const clearCurrentSession = () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
};

// Clear all data and reinitialize (for development)
export const resetAllData = () => {
  console.log("=== RESETTING ALL DATA ===");
  localStorage.removeItem('users');
  localStorage.removeItem('schools');
  localStorage.removeItem('activities');
  localStorage.removeItem('tasks');
  localStorage.removeItem('currentUser');
  currentUser = null;
  
  // Reinitialize with fresh data
  initializeLocalStorage();
  console.log("All data reset and reinitialized");
};

// Legacy export for compatibility
export const clearAllData = resetAllData;

// Export all data (for backup)
export const exportAllData = () => {
  return {
    users: getData<User>('users'),
    schools: getData<School>('schools'),
    activities: getData<Activity>('activities'),
    tasks: getData<Task>('tasks'),
    exported_at: new Date().toISOString(),
  };
};