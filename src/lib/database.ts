// Database abstraction layer - switch between localStorage and Supabase
import { auth as localAuth, schools as localSchools, activities as localActivities, tasks as localTasks, profiles as localProfiles, getStatistics as localGetStatistics, uploadPhoto as localUploadPhoto, getData as localGetData } from './localStorage';
import { auth as supabaseAuth, schools as supabaseSchools, activities as supabaseActivities, tasks as supabaseTasks, supervisions as supabaseSupervisions, profiles as supabaseProfiles, getStatistics as supabaseGetStatistics, uploadPhoto as supabaseUploadPhoto } from './supabase';

// Configuration - set to true to use Supabase, false for localStorage
const USE_SUPABASE = true;

console.log('=== DATABASE CONFIGURATION ===');
console.log('Database type:', USE_SUPABASE ? 'Supabase (Cloud)' : 'localStorage (Local)');

// For localStorage, we need to create a placeholder supervisions implementation
const localSupervisions = {
  getAll: async () => ({ data: [], error: null }),
  create: async () => ({ data: null, error: { message: 'Supervisions not supported in localStorage mode' } }),
  update: async () => ({ data: null, error: { message: 'Supervisions not supported in localStorage mode' } }),
  delete: async () => ({ error: { message: 'Supervisions not supported in localStorage mode' } }),
};

// For Supabase, we need to implement getData function
const supabaseGetData = async <T>(key: string): Promise<T[]> => {
  // This is a compatibility function for localStorage getData
  // In Supabase, we use specific functions instead
  console.warn('getData is not recommended with Supabase. Use specific functions instead.');
  return [];
};

// Export the appropriate implementation based on configuration
export const auth = USE_SUPABASE ? supabaseAuth : localAuth;
export const schools = USE_SUPABASE ? supabaseSchools : localSchools;
export const activities = USE_SUPABASE ? supabaseActivities : localActivities;
export const tasks = USE_SUPABASE ? supabaseTasks : localTasks;
export const supervisions = USE_SUPABASE ? supabaseSupervisions : localSupervisions;
export const profiles = USE_SUPABASE ? supabaseProfiles : localProfiles;
export const getStatistics = USE_SUPABASE ? supabaseGetStatistics : localGetStatistics;
export const uploadPhoto = USE_SUPABASE ? supabaseUploadPhoto : localUploadPhoto;
export const getData = USE_SUPABASE ? supabaseGetData : localGetData;

// Export types
export type { User, School, Activity, Task, Supervision } from './supabase';

// Initialize function
export const initializeDatabase = async () => {
  if (USE_SUPABASE) {
    console.log("=== INITIALIZING SUPABASE DATABASE ===");
    try {
      // Test Supabase connection
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        console.error('❌ Supabase connection test failed:', error);
        throw new Error(`Supabase connection failed: ${error.message}`);
      }
      
      console.log('✅ Supabase connection test successful');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  } else {
    console.log("=== INITIALIZING LOCALSTORAGE DATABASE ===");
    const { initializeLocalStorage } = await import('./localStorage');
    initializeLocalStorage();
  }
};

// Database info
export const getDatabaseInfo = () => {
  return {
    type: USE_SUPABASE ? 'Supabase' : 'localStorage',
    description: USE_SUPABASE 
      ? 'Cloud database with real-time sync' 
      : 'Local browser storage',
    multiDevice: USE_SUPABASE,
    persistent: USE_SUPABASE,
    configured: USE_SUPABASE ? 'Environment variables validated' : 'Yes',
  };
};