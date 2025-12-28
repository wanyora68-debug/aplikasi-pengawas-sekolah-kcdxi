// Migration helper to move data from localStorage to Supabase
import { getData } from './localStorage';
import { supabase } from './supabase';
import type { User, School, Activity, Task } from './supabase';

export const migrateLocalStorageToSupabase = async () => {
  console.log("=== STARTING MIGRATION FROM LOCALSTORAGE TO SUPABASE ===");
  
  try {
    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      console.log("No authenticated user found. Please login first.");
      return { success: false, message: "Please login first to migrate data" };
    }

    console.log("Authenticated user:", authUser.id);

    // Get localStorage data
    const localUsers = getData<User>('users');
    const localSchools = getData<School>('schools');
    const localActivities = getData<Activity>('activities');
    const localTasks = getData<Task>('tasks');

    console.log("LocalStorage data found:");
    console.log("- Users:", localUsers.length);
    console.log("- Schools:", localSchools.length);
    console.log("- Activities:", localActivities.length);
    console.log("- Tasks:", localTasks.length);

    let migratedCount = {
      schools: 0,
      activities: 0,
      tasks: 0,
    };

    // Migrate Schools
    if (localSchools.length > 0) {
      console.log("Migrating schools...");
      for (const school of localSchools) {
        try {
          const { error } = await supabase
            .from('schools')
            .insert([{
              ...school,
              user_id: authUser.id, // Use current authenticated user
            }]);

          if (error) {
            console.error("Error migrating school:", school.name, error);
          } else {
            migratedCount.schools++;
            console.log("Migrated school:", school.name);
          }
        } catch (error) {
          console.error("Error migrating school:", school.name, error);
        }
      }
    }

    // Migrate Activities
    if (localActivities.length > 0) {
      console.log("Migrating activities...");
      for (const activity of localActivities) {
        try {
          const { error } = await supabase
            .from('activities')
            .insert([{
              ...activity,
              user_id: authUser.id, // Use current authenticated user
              school_id: null, // Reset school_id as it might not match
            }]);

          if (error) {
            console.error("Error migrating activity:", activity.activity_name, error);
          } else {
            migratedCount.activities++;
            console.log("Migrated activity:", activity.activity_name);
          }
        } catch (error) {
          console.error("Error migrating activity:", activity.activity_name, error);
        }
      }
    }

    // Migrate Tasks
    if (localTasks.length > 0) {
      console.log("Migrating tasks...");
      for (const task of localTasks) {
        try {
          const { error } = await supabase
            .from('tasks')
            .insert([{
              ...task,
              user_id: authUser.id, // Use current authenticated user
            }]);

          if (error) {
            console.error("Error migrating task:", task.activity_name, error);
          } else {
            migratedCount.tasks++;
            console.log("Migrated task:", task.activity_name);
          }
        } catch (error) {
          console.error("Error migrating task:", task.activity_name, error);
        }
      }
    }

    console.log("=== MIGRATION COMPLETED ===");
    console.log("Migrated:", migratedCount);

    const totalMigrated = migratedCount.schools + migratedCount.activities + migratedCount.tasks;
    
    return {
      success: true,
      message: `Migration completed! Migrated ${totalMigrated} items (${migratedCount.schools} schools, ${migratedCount.activities} activities, ${migratedCount.tasks} tasks)`,
      migratedCount,
    };

  } catch (error) {
    console.error("Migration error:", error);
    return {
      success: false,
      message: "Migration failed: " + (error as Error).message,
    };
  }
};

export const clearLocalStorageData = () => {
  console.log("=== CLEARING LOCALSTORAGE DATA ===");
  
  const keys = ['users', 'schools', 'activities', 'tasks', 'currentUser'];
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log("Cleared:", key);
  });
  
  console.log("LocalStorage data cleared");
};

export const backupLocalStorageData = () => {
  console.log("=== BACKING UP LOCALSTORAGE DATA ===");
  
  const backup = {
    users: getData<User>('users'),
    schools: getData<School>('schools'),
    activities: getData<Activity>('activities'),
    tasks: getData<Task>('tasks'),
    timestamp: new Date().toISOString(),
  };
  
  const backupString = JSON.stringify(backup, null, 2);
  const blob = new Blob([backupString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `pengawas-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log("Backup downloaded");
  return backup;
};