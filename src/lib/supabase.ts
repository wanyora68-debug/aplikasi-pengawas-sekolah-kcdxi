import { createClient } from '@supabase/supabase-js'

// Supabase configuration with strict validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('=== SUPABASE CONFIG VALIDATION ===');
console.log('Environment check:');
console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');

// Strict validation - no fallbacks or workarounds
if (!supabaseUrl) {
  const errorMsg = `
❌ MISSING SUPABASE URL
Environment variable VITE_SUPABASE_URL is not configured.

For local development:
1. Create/update .env.local file
2. Add: VITE_SUPABASE_URL=https://your-project-id.supabase.co

For Vercel deployment:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add VITE_SUPABASE_URL with your Supabase project URL

Current value: ${supabaseUrl}
  `;
  console.error(errorMsg);
  throw new Error('VITE_SUPABASE_URL environment variable is required');
}

if (!supabaseAnonKey) {
  const errorMsg = `
❌ MISSING SUPABASE ANON KEY
Environment variable VITE_SUPABASE_ANON_KEY is not configured.

For local development:
1. Create/update .env.local file
2. Add: VITE_SUPABASE_ANON_KEY=your_anon_key_here

For Vercel deployment:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add VITE_SUPABASE_ANON_KEY with your Supabase anon key

Get your anon key from: Supabase Dashboard → Settings → API
  `;
  console.error(errorMsg);
  throw new Error('VITE_SUPABASE_ANON_KEY environment variable is required');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  const errorMsg = `
❌ INVALID SUPABASE URL FORMAT
VITE_SUPABASE_URL has invalid format: "${supabaseUrl}"

Expected format: https://your-project-id.supabase.co
Example: https://npllwokylzufmgmngaa.supabase.co

Please check your Supabase project settings.
  `;
  console.error(errorMsg);
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
}

// Validate anon key format (JWT should start with eyJ)
if (!supabaseAnonKey.startsWith('eyJ')) {
  const errorMsg = `
❌ INVALID SUPABASE ANON KEY FORMAT
VITE_SUPABASE_ANON_KEY should be a JWT token starting with "eyJ"

Current value starts with: "${supabaseAnonKey.substring(0, 10)}..."

Please get the correct anon key from:
Supabase Dashboard → Settings → API → "anon public" key
  `;
  console.error(errorMsg);
  throw new Error('Invalid VITE_SUPABASE_ANON_KEY format - should be a JWT token');
}

console.log('✅ Supabase configuration validated successfully');
console.log('📡 Connecting to:', supabaseUrl);
console.log('🔑 Using anon key:', supabaseAnonKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database Types (matching localStorage structure)
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

export interface Supervision {
  id: string;
  title: string;
  school_id?: string;
  date: string;
  principal_name?: string;
  notes: string;
  photo_url_1?: string;
  photo_url_2?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Auth functions
export const auth = {
  signIn: async (email: string, password: string) => {
    console.log("=== SUPABASE LOGIN DEBUG ===");
    console.log("Attempting login with email:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("Supabase auth error:", error);
        return { user: null, error: { message: 'Email atau password salah' } };
      }

      if (data.user) {
        console.log("Auth successful, user ID:", data.user.id);
        
        // Simplified profile fetch with better error handling
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle(); // Use maybeSingle instead of single

          if (profileError) {
            console.log("Profile fetch error:", profileError);
            
            // Create a basic profile if fetch fails
            const basicProfile = {
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || 'User',
              role: 'user',
              created_at: new Date().toISOString(),
            };
            
            console.log("Using basic profile due to fetch error");
            return { user: basicProfile, error: null };
          }

          if (profile) {
            console.log("Login successful for user:", profile.email, "role:", profile.role);
            return { user: profile, error: null };
          } else {
            console.log("No profile found, creating basic profile");
            
            // Create basic profile if none exists
            const basicProfile = {
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || 'User',
              role: 'user',
              created_at: new Date().toISOString(),
            };
            
            return { user: basicProfile, error: null };
          }
        } catch (profileFetchError) {
          console.log("Profile fetch exception:", profileFetchError);
          
          // Fallback to basic profile
          const basicProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || 'User',
            role: 'user',
            created_at: new Date().toISOString(),
          };
          
          return { user: basicProfile, error: null };
        }
      }

      return { user: null, error: { message: 'Login gagal' } };
    } catch (error) {
      console.error("Login error:", error);
      return { user: null, error: { message: 'Terjadi kesalahan saat login' } };
    }
  },

  signUp: async (email: string, password: string, userData: { 
    full_name: string;
    nip?: string;
    position?: string;
    pangkat?: string;
    unit_kerja?: string;
  }) => {
    console.log("=== SUPABASE REGISTER - AUTH ONLY ===");
    console.log("Creating auth user for:", email);
    
    try {
      // ONLY CREATE AUTH USER - ABSOLUTELY NO PROFILE OPERATIONS
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (authError) {
        console.log("Auth signup error:", authError);
        if (authError.message.includes('already registered')) {
          return { user: null, error: { message: 'Email sudah terdaftar' } };
        }
        return { user: null, error: { message: authError.message } };
      }

      if (authData.user) {
        console.log("✅ AUTH USER CREATED SUCCESSFULLY");
        
        // ALWAYS RETURN SUCCESS - NO PROFILE CREATION ATTEMPTS
        const mockUser = {
          id: authData.user.id,
          email: authData.user.email || email,
          full_name: userData.full_name,
          role: 'user' as const,
          created_at: new Date().toISOString(),
        };

        console.log("✅ REGISTRATION SUCCESS - NO PROFILE OPERATIONS");
        return { user: mockUser, error: null };
      }

      return { user: null, error: { message: 'Registrasi gagal' } };
    } catch (error) {
      console.error("Registration error:", error);
      return { user: null, error: { message: 'Terjadi kesalahan saat registrasi' } };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error("Signout error:", error);
      return { error: { message: 'Gagal logout' } };
    }
  },

  getUser: async () => {
    console.log("=== SUPABASE AUTH.GETUSER DEBUG ===");
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log("No authenticated user found");
        return { user: null, error: null };
      }

      console.log("Auth user found:", user.id, user.email);

      // Get user profile from our users table with better error handling
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        console.log("getUser: returning existing profile:", profile);
        return { user: profile, error: null };
      }

      if (profileError && profileError.code !== 'PGRST116') {
        console.log("Profile fetch error:", profileError);
      }
      
      // If profile doesn't exist, create it from auth user metadata
      console.log("Profile not found, creating from auth user metadata");
      
      const newProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'User',
        nip: user.user_metadata?.nip || null,
        position: user.user_metadata?.position || null,
        pangkat: user.user_metadata?.pangkat || null,
        unit_kerja: user.user_metadata?.unit_kerja || null,
        role: 'user',
        created_at: new Date().toISOString(),
      };

      try {
        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .upsert([newProfile], { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          console.log("Failed to create profile, using basic profile:", createError);
          return { user: newProfile, error: null };
        }

        console.log("Profile created successfully on login:", createdProfile);
        return { user: createdProfile, error: null };
      } catch (createException) {
        console.log("Profile creation exception, using basic profile:", createException);
        return { user: newProfile, error: null };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { user: null, error: { message: 'Terjadi kesalahan saat mengambil profil' } };
    }
  },
};

// Schools CRUD
export const schools = {
  getAll: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Schools fetch error:", error);
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error("Schools fetch error:", error);
      return { data: [], error: { message: 'Gagal mengambil data sekolah' } };
    }
  },

  create: async (schoolData: Omit<School, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([{
          ...schoolData,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error("School creation error:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("School creation error:", error);
      return { data: null, error: { message: 'Gagal membuat data sekolah' } };
    }
  },

  update: async (id: string, updates: Partial<School>) => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("School update error:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("School update error:", error);
      return { data: null, error: { message: 'Gagal mengupdate data sekolah' } };
    }
  },

  delete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("School deletion error:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("School deletion error:", error);
      return { error: { message: 'Gagal menghapus data sekolah' } };
    }
  },
};

// Activities CRUD
export const activities = {
  getAll: async (userId: string, filters?: { category?: string }) => {
    console.log("=== SUPABASE ACTIVITIES.GETALL DEBUG ===");
    console.log("activities.getAll called with userId:", userId, "filters:", filters);
    
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId);

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error("Activities fetch error:", error);
        return { data: [], error };
      }

      console.log("Activities fetched successfully:", data?.length || 0, "items");
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Activities fetch error:", error);
      return { data: [], error: { message: 'Gagal mengambil data aktivitas' } };
    }
  },

  create: async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    console.log("=== SUPABASE ACTIVITIES.CREATE DEBUG ===");
    console.log("activities.create called with data:", activityData);
    
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...activityData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error("Activity creation error:", error);
        return { data: null, error };
      }

      console.log("Activity created successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Activity creation error:", error);
      return { data: null, error: { message: 'Gagal membuat data aktivitas' } };
    }
  },

  update: async (id: string, updates: Partial<Activity>) => {
    console.log("=== SUPABASE ACTIVITIES.UPDATE DEBUG ===");
    console.log("Updating activity:", id, "with:", updates);
    
    try {
      const { data, error } = await supabase
        .from('activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Activity update error:", error);
        return { data: null, error };
      }

      console.log("Activity updated successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Activity update error:", error);
      return { data: null, error: { message: 'Gagal mengupdate data aktivitas' } };
    }
  },

  delete: async (id: string) => {
    console.log("=== SUPABASE ACTIVITIES.DELETE DEBUG ===");
    console.log("Deleting activity:", id);
    
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Activity deletion error:", error);
        return { error };
      }

      console.log("Activity deleted successfully");
      return { error: null };
    } catch (error) {
      console.error("Activity deletion error:", error);
      return { error: { message: 'Gagal menghapus data aktivitas' } };
    }
  },
};

// Tasks CRUD
export const tasks = {
  getAll: async (userId: string) => {
    console.log("=== SUPABASE TASKS.GETALL DEBUG ===");
    console.log("tasks.getAll called with userId:", userId);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error("Tasks fetch error:", error);
        return { data: [], error };
      }

      console.log("Tasks fetched successfully:", data?.length || 0, "items");
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Tasks fetch error:", error);
      return { data: [], error: { message: 'Gagal mengambil data tugas' } };
    }
  },

  create: async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    console.log("=== SUPABASE TASKS.CREATE DEBUG ===");
    console.log("tasks.create called with data:", taskData);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error("Task creation error:", error);
        return { data: null, error };
      }

      console.log("Task created successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Task creation error:", error);
      return { data: null, error: { message: 'Gagal membuat data tugas' } };
    }
  },

  update: async (id: string, updates: Partial<Task>) => {
    console.log("=== SUPABASE TASKS.UPDATE DEBUG ===");
    console.log("Updating task:", id, "with:", updates);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Task update error:", error);
        return { data: null, error };
      }

      console.log("Task updated successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Task update error:", error);
      return { data: null, error: { message: 'Gagal mengupdate data tugas' } };
    }
  },

  delete: async (id: string) => {
    console.log("=== SUPABASE TASKS.DELETE DEBUG ===");
    console.log("Deleting task:", id);
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Task deletion error:", error);
        return { error };
      }

      console.log("Task deleted successfully");
      return { error: null };
    } catch (error) {
      console.error("Task deletion error:", error);
      return { error: { message: 'Gagal menghapus data tugas' } };
    }
  },
};

// Supervisions CRUD
export const supervisions = {
  getAll: async (userId: string) => {
    console.log("=== SUPABASE SUPERVISIONS.GETALL DEBUG ===");
    console.log("supervisions.getAll called with userId:", userId);
    
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error("Supervisions fetch error:", error);
        return { data: [], error };
      }

      console.log("Supervisions fetched successfully:", data?.length || 0, "items");
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Supervisions fetch error:", error);
      return { data: [], error: { message: 'Gagal mengambil data supervisi' } };
    }
  },

  create: async (supervisionData: Omit<Supervision, 'id' | 'created_at' | 'updated_at'>) => {
    console.log("=== SUPABASE SUPERVISIONS.CREATE DEBUG ===");
    console.log("supervisions.create called with data:", supervisionData);
    
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .insert([{
          ...supervisionData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error("Supervision creation error:", error);
        return { data: null, error };
      }

      console.log("Supervision created successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Supervision creation error:", error);
      return { data: null, error: { message: 'Gagal membuat data supervisi' } };
    }
  },

  update: async (id: string, updates: Partial<Supervision>) => {
    console.log("=== SUPABASE SUPERVISIONS.UPDATE DEBUG ===");
    console.log("Updating supervision:", id, "with:", updates);
    
    try {
      const { data, error } = await supabase
        .from('supervisions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Supervision update error:", error);
        return { data: null, error };
      }

      console.log("Supervision updated successfully:", data);
      return { data, error: null };
    } catch (error) {
      console.error("Supervision update error:", error);
      return { data: null, error: { message: 'Gagal mengupdate data supervisi' } };
    }
  },

  delete: async (id: string) => {
    console.log("=== SUPABASE SUPERVISIONS.DELETE DEBUG ===");
    console.log("Deleting supervision:", id);
    
    try {
      const { error } = await supabase
        .from('supervisions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Supervision deletion error:", error);
        return { error };
      }

      console.log("Supervision deleted successfully");
      return { error: null };
    } catch (error) {
      console.error("Supervision deletion error:", error);
      return { error: { message: 'Gagal menghapus data supervisi' } };
    }
  },
};

// Profiles CRUD
export const profiles = {
  get: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Profile fetch error:", error);
      return { data: null, error: { message: 'Gagal mengambil data profil' } };
    }
  },

  update: async (userId: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error("Profile update error:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Profile update error:", error);
      return { data: null, error: { message: 'Gagal mengupdate profil' } };
    }
  },
};

// Photo upload to Supabase Storage
export const uploadPhoto = async (file: File, bucket: string = 'photos'): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error("Photo upload error:", error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Photo upload error:", error);
    // Fallback to base64 for development
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.readAsDataURL(file);
    });
  }
};

// Statistics
export const getStatistics = async (userId: string) => {
  try {
    const [activitiesRes, schoolsRes, tasksRes, supervisionsRes] = await Promise.all([
      activities.getAll(userId),
      schools.getAll(userId),
      tasks.getAll(userId),
      supervisions.getAll(userId),
    ]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const activitiesThisMonth = activitiesRes.data?.filter((activity) => {
      const activityDate = new Date(activity.date);
      return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear;
    }).length || 0;

    const supervisionsThisMonth = supervisionsRes.data?.filter((supervision) => {
      const supervisionDate = new Date(supervision.date);
      return supervisionDate.getMonth() === currentMonth && supervisionDate.getFullYear() === currentYear;
    }).length || 0;

    // Monthly breakdown
    const monthlyStats: { [key: string]: number } = {};
    activitiesRes.data?.forEach((activity) => {
      const date = new Date(activity.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
    });

    // Add supervisions to monthly stats
    supervisionsRes.data?.forEach((supervision) => {
      const date = new Date(supervision.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
    });

    return {
      totalActivities: activitiesRes.data?.length || 0,
      totalSchools: schoolsRes.data?.length || 0,
      totalTasks: tasksRes.data?.length || 0,
      totalSupervisions: supervisionsRes.data?.length || 0,
      activitiesThisMonth,
      supervisionsThisMonth,
      monthlyStats,
    };
  } catch (error) {
    console.error("Statistics error:", error);
    return {
      totalActivities: 0,
      totalSchools: 0,
      totalTasks: 0,
      totalSupervisions: 0,
      activitiesThisMonth: 0,
      supervisionsThisMonth: 0,
      monthlyStats: {},
    };
  }
};

// Initialize Supabase (create demo user if needed)
export const initializeSupabase = async () => {
  console.log("=== INITIALIZING SUPABASE ===");
  
  try {
    // Check if demo user exists, if not create one
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: 'pengawas@demo.com',
      password: 'demo123'
    });
    
    if (existingUser.user) {
      console.log("Demo user already exists");
      await supabase.auth.signOut(); // Sign out after check
    }
  } catch (error) {
    console.log("Demo user doesn't exist, will be created on first registration");
  }
  
  console.log("Supabase initialized successfully");
};