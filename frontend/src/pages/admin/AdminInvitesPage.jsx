import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const AdminInvitesPage = () => {
    const [invites, setInvites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [note, setNote] = useState('');
    const [days, setDays] = useState(7);

    const fetchInvites = async () => {
        try {
            const { data } = await adminAPI.getInvites();
            setInvites(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            toast.error('Failed to load invites');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const { data } = await adminAPI.createInvite({ note, days_valid: days });
            toast.success('Invite generated!');
            setNote('');
            fetchInvites();
        } catch (err) {
            toast.error('Failed to generate invite');
        } finally {
            setIsCreating(false);
        }
    };

    const copyToClipboard = (token) => {
        const url = `${window.location.origin}/admin/apply?token=${token}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    return (
        <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '40px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="font-display" style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                    Admin Invitations
                </h1>
                <p className="text-muted">Generate secret links to onboard new Junior Admins.</p>
            </header>

            {/* Generator Card */}
            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--apex-border)' }}>
                <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Generate New Invite</h2>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '16px', alignItems: 'end' }}>
                    <div>
                        <label className="text-muted" style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Recipient Name / Note</label>
                        <input
                            type="text"
                            className="bg-navy rounded-lg"
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--apex-border)', color: 'var(--apex-text)' }}
                            placeholder="e.g. John Doe (Operations Manager)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="text-muted" style={{ display: 'block', fontSize: '12px', marginBottom: '8px' }}>Valid For (Days)</label>
                        <select
                            className="bg-navy rounded-lg"
                            style={{ width: '100%', padding: '12px', border: '1px solid var(--apex-border)', color: 'var(--apex-text)' }}
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                        >
                            <option value={1}>1 Day</option>
                            <option value={7}>7 Days</option>
                            <option value={30}>30 Days</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isCreating}
                        className="rounded-lg shadow-sm"
                        style={{
                            padding: '12px 24px',
                            background: 'var(--grad-blue)',
                            color: 'white',
                            border: 'none',
                            fontWeight: 600,
                            cursor: isCreating ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isCreating ? 'Generating...' : 'Generate Link'}
                    </button>
                </form>
            </div>

            {/* Invitations Table */}
            <div className="bg-card rounded-2xl shadow-md" style={{ padding: '24px', border: '1px solid var(--apex-border)' }}>
                <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Active & Past Invites</h2>

                {isLoading ? (
                    <div className="text-center" style={{ padding: '40px' }}>Loading invites...</div>
                ) : invites.length === 0 ? (
                    <div className="text-center text-muted" style={{ padding: '40px' }}>No invites generated yet.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr className="text-muted" style={{ fontSize: '13px', borderBottom: '1px solid var(--apex-border)' }}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Recipient / Note</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Expires</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map((invite) => (
                                    <tr key={invite.token} style={{ borderBottom: '1px solid var(--apex-border)' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 500 }}>{invite.note || 'No note'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--apex-muted)', fontFamily: 'monospace' }}>{invite.token}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            {invite.is_used ? (
                                                <span className="text-muted" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                                                    Used by {invite.used_by}
                                                </span>
                                            ) : !invite.is_valid ? (
                                                <span className="text-red" style={{ fontSize: '12px', background: 'rgba(255,77,106,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                                    Expired
                                                </span>
                                            ) : (
                                                <span className="text-green" style={{ fontSize: '12px', background: 'rgba(0,211,149,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-muted" style={{ padding: '16px 12px', fontSize: '13px' }}>
                                            {new Date(invite.expires_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            {invite.is_valid && (
                                                <button
                                                    onClick={() => copyToClipboard(invite.token)}
                                                    className="text-blue"
                                                    style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    Copy Link
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
