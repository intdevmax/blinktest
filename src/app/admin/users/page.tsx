'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Profile, UserRole } from '@/types/database';

export default function AdminUsersPage() {
    const { profile } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        setUsers(data || []);
        setLoading(false);
    };

    const updateRole = async (userId: string, newRole: UserRole) => {
        await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        loadUsers();
    };

    if (profile?.role !== 'admin') {
        return (
            <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
                Access denied. Admin only.
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                User Management
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
                {users.length} registered users
            </p>

            {/* Users Table */}
            <div className="rounded-xl overflow-hidden surface"
                style={{ border: '1px solid var(--border-primary)' }}>
                <table className="w-full">
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-elevated)' }}>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>User</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>Email</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>Role</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-8">
                                    <span className="inline-block w-5 h-5 border-2 rounded-full animate-spin"
                                        style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-muted)' }} />
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.id}
                                    className="transition-colors"
                                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                                style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-pink))' }}>
                                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {u.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {u.email}
                                    </td>
                                    <td className="px-5 py-3">
                                        <select
                                            value={u.role}
                                            onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                                            className="rounded px-2 py-1 text-xs"
                                            style={{
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)',
                                            }}
                                            disabled={u.id === profile?.id}
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
