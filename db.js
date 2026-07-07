/**
 * PIXORA DB - Supabase Backend
 * Remplace localStorage par Supabase Auth + Database
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://cfwzilhetkclpytjsopu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd3ppbGhldGtjbHB5dGpzb3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNDYxNjgsImV4cCI6MjA5ODkyMjE2OH0.fUAiUlEureXCj2bXJefuVvNoo9ktjDeyKb4VOK7GrEU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PixoraDB = (() => {
    const listeners = [];

    function onChange(callback) { listeners.push(callback); }
    function notify(key, data) { listeners.forEach(cb => cb(key, data)); }

    // =============================================
    // AUTH
    // =============================================
    async function getAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    async function isLoggedIn() {
        const user = await getAuth();
        return !!user;
    }

    async function signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        notify('auth', data.user);
        return data.user;
    }

    async function signUp(email, password, name) {
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { name } }
        });
        if (error) throw error;

        // Créer l'entrée users + user_data via trigger
        if (data.user) {
            await supabase.from('users').insert({
                id: data.user.id,
                email, name, password: btoa(password)
            });        }
        notify('auth', data.user);
        return data.user;
    }

    async function signOut() {
        await supabase.auth.signOut();
        notify('auth', null);
    }

    async function signInWithOAuth(provider) {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin + '/index.html' }
        });
        if (error) throw error;
    }

    // =============================================
    // USER DATA
    // =============================================
    async function getData() {
        const user = await getAuth();
        if (!user) return null;
        const { data, error } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if (error || !data) return null;
        return data;
    }

    async function saveData(updates) {
        const user = await getAuth();
        if (!user) return false;
        const { error } = await supabase
            .from('user_data')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);
        if (error) return false;
        notify('data', updates);
        return true;
    }

    async function addPoints(amount, title, type = 'earned') {
        const user = await getAuth();
        if (!user) return false;

        // Ajouter transaction        await supabase.from('transactions').insert({
            user_id: user.id, type, title, amount
        });

        // Mettre à jour points
        const data = await getData();
        if (!data) return false;

        const updates = { points: data.points + amount };
        if (amount > 0) updates.total_earned = (data.total_earned || 0) + amount;
        if (amount < 0) updates.total_generated = (data.total_generated || 0) + 1;

        await saveData(updates);
        return data.points + amount;
    }

    async function spendPoints(amount, title) {
        const data = await getData();
        if (!data || data.points < amount) return false;
        await addPoints(-amount, title, 'spent');
        return true;
    }

    // =============================================
    // DAILY USAGE
    // =============================================
    async function getDailyUsage() {
        const user = await getAuth();
        if (!user) return { video_count: 0, sponsor_count: 0, share_count: 0 };
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
            .from('daily_usage')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();
        return data || { video_count: 0, sponsor_count: 0, share_count: 0 };
    }

    async function incrementUsage(actionType) {
        const user = await getAuth();
        if (!user) return;
        const today = new Date().toISOString().split('T')[0];
        const fieldMap = { video: 'video_count', sponsor: 'sponsor_count', share: 'share_count' };
        const field = fieldMap[actionType];
        if (!field) return;

        const usage = await getDailyUsage();
        await supabase.from('daily_usage').upsert({
            user_id: user.id, date: today,            [field]: (usage[field] || 0) + 1
        }, { onConflict: 'user_id,date' });
        notify('usage', { [actionType]: (usage[field] || 0) + 1 });
    }

    // =============================================
    // COOLDOWNS
    // =============================================
    async function getCooldown(taskType) {
        const user = await getAuth();
        if (!user) return 0;
        const { data } = await supabase
            .from('cooldowns')
            .select('last_done')
            .eq('user_id', user.id)
            .eq('task_type', taskType)
            .single();
        return data ? new Date(data.last_done).getTime() : 0;
    }

    async function setCooldown(taskType) {
        const user = await getAuth();
        if (!user) return;
        await supabase.from('cooldowns').upsert({
            user_id: user.id, task_type: taskType, last_done: new Date().toISOString()
        }, { onConflict: 'user_id,task_type' });
    }

    async function canDoTask(taskType, cooldownMs) {
        const lastDone = await getCooldown(taskType);
        return (Date.now() - lastDone) >= cooldownMs;
    }

    // =============================================
    // ADMIN CONFIG
    // =============================================
    async function getConfig(key) {
        const { data } = await supabase
            .from('admin_config')
            .select('value')
            .eq('key', key)
            .single();
        return data ? data.value : null;
    }

    async function getAllConfigs() {
        const { data } = await supabase.from('admin_config').select('*');
        const configs = {};
        if (data) data.forEach(c => configs[c.key] = c.value);
        return configs;    }

    // =============================================
    // REALTIME SUBSCRIPTION
    // =============================================
    function subscribeToChanges(userId) {
        supabase.channel('pixora-realtime')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'user_data', filter: `user_id=eq.${userId}`
            }, (payload) => {
                notify('data', payload.new);
            })
            .subscribe();
    }

    // =============================================
    // RESET
    // =============================================
    async function resetAll() {
        const user = await getAuth();
        if (!user) return;
        await supabase.from('transactions').delete().eq('user_id', user.id);
        await supabase.from('purchases').delete().eq('user_id', user.id);
        await supabase.from('daily_usage').delete().eq('user_id', user.id);
        await supabase.from('cooldowns').delete().eq('user_id', user.id);
        await supabase.from('user_data').update({
            points: 0, streak: 1, total_generated: 0, total_earned: 0
        }).eq('user_id', user.id);
        notify('reset', null);
    }

    return {
        supabase,
        getAuth, isLoggedIn, signIn, signUp, signOut, signInWithOAuth,
        getData, saveData, addPoints, spendPoints,
        getDailyUsage, incrementUsage,
        getCooldown, setCooldown, canDoTask,
        getConfig, getAllConfigs,
        subscribeToChanges, resetAll, onChange
    };
})();

window.PixoraDB = PixoraDB;