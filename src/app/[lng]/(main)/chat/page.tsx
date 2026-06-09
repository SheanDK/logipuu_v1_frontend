//frontend/src/app/[lng]/(main)/chat/page.tsx
'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Stack, Avatar, Badge,
    alpha, useTheme, Divider, Chip, Snackbar, Alert, Checkbox,
    IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { BroadcastMessageDialog } from '@/components/chat/BroadcastMessageDialog';
import { chatService } from '@/services/chatService';
import useSocket from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';


export default function OfficeChatPage() {
    const theme = useTheme();
    const { user } = useAuth();
    const { t } = useTranslation(['chat', 'common']);
    const currentUserId = 0;
    const { socket } = useSocket();

    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
    const [isBroadcastSelected, setIsBroadcastSelected] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [typedMessage, setTypedMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [broadcastOpen, setBroadcastOpen] = useState(false);
    const [contactsLoaded, setContactsLoaded] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);

    const parseSystemMessage = (rawText: string): string => {
        if (!rawText) return rawText;

        try {
            const parsed = JSON.parse(rawText);
            if (parsed.key && parsed.vehicle) {
                // New format: translate using i18n key
                return t(`chat:${parsed.key}`, {
                    vehicle: parsed.vehicle,
                    defaultValue: `${parsed.key} ${parsed.vehicle}`
                });
            }
        } catch {
            // Old format: plain English text — try pattern match translate
            // "Session started on vehicle GTR-111" → translate
            const startMatch = rawText.match(/^Session started on vehicle (.+)$/);
            if (startMatch) {
                return t('chat:session_started', {
                    vehicle: startMatch[1],
                    defaultValue: rawText
                });
            }

            const endMatch = rawText.match(/^Session ended on vehicle (.+)$/);
            if (endMatch) {
                return t('chat:session_ended', {
                    vehicle: endMatch[1],
                    defaultValue: rawText
                });
            }
        }

        // Fallback: return as-is
        return rawText;
    };

    const [broadcasts, setBroadcasts] = useState<{
        messageText: string;
        createdAt: string;
        recipientCount: number;
        recipientNames: string | null;
        messageIds?: number[];
        isDeleted?: boolean;
    }[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

    const handleBroadcastSent = (data: {
        messageText: string;
        createdAt: string;
        recipientCount: number;
        recipientNames: string | null;
        messageIds: number[];
        isDeleted: boolean;
    }) => {
        setBroadcasts(prev => {
            const msgTime = new Date(data.createdAt).getTime();
            const exists = prev.some(b => {
                const bTime = new Date(b.createdAt).getTime();
                return b.messageText === data.messageText &&
                    Math.abs(bTime - msgTime) < 60000;
            });

            if (exists) return prev;

            return [data, ...prev];
        });
    };
    const handleBroadcastClusterDeleted = (data: { messageIds: number[] }) => {
        const deletedSet = new Set(data.messageIds.map(Number));

        setBroadcasts(prev =>
            prev.map(b => {
                const bIds = (b.messageIds || []).map(Number);
                const allDeleted = bIds.length > 0 && bIds.every((id: number) => deletedSet.has(id));
                return allDeleted ? { ...b, isDeleted: true } : b;
            })
        );
    };

    const isDarkMode = theme.palette.mode === 'dark';
    const selectedContactRef = useRef<any>(null);

    const liveSelectedContact = useMemo(() => {
        if (!selectedContact) return null;
        return contacts.find(c => c.username === selectedContact.username) || selectedContact;
    }, [contacts, selectedContact]);

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        open: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // ─── Contact selection ────────────────────────────────────────────────────
    const handleSelectContact = (c: any) => {
        selectedContactRef.current = c;
        setSelectedContact(c);
        setIsBroadcastSelected(false);
        setSelectedDriverId(Number(c.driverId));
        sessionStorage.setItem('office_chat_selected_driverId', String(c.driverId));
        handleCancelSelection();
        setContacts(prev => prev.map(con =>
            Number(con.driverId) === Number(c.driverId) ? { ...con, unreadCount: 0 } : con
        ));
    };

    const handleSelectBroadcast = () => {
        const bc = { isBroadcastCenter: true, driverName: t('chat.chatView.broadcastHistory') };
        selectedContactRef.current = bc;
        setSelectedContact(bc);
        setIsBroadcastSelected(true);
        setSelectedDriverId(null);
        sessionStorage.removeItem('office_chat_selected_driverId');
        handleCancelSelection();
    };

    // ─── Initial contacts load ────────────────────────────────────────────────
    useEffect(() => {
        chatService.getContacts().then(data => {
            setContacts(data);
            setContactsLoaded(true);
        });
    }, []);

    // ─── Restore selected contact from sessionStorage ─────────────────────────
    useEffect(() => {
        if (!contactsLoaded) return;
        const saved = sessionStorage.getItem('office_chat_selected_driverId');
        if (saved) {
            const driverId = Number(saved);
            const contact = contacts.find(c => Number(c.driverId) === driverId);
            if (contact) {
                selectedContactRef.current = contact;
                setSelectedContact(contact);
                setSelectedDriverId(driverId);
            }
        }
    }, [contactsLoaded]);

    // ─── Socket listeners (registered once) ──────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        socket.emit('join_chat_room', currentUserId);

        const handleReceiveMessage = (msg: any) => {
            const senderId = Number(msg.sender_id ?? msg.senderId);
            const recipientId = Number(msg.recipient_id ?? msg.recipientId);
            const isBroadcast = !!(msg.isBroadcast ?? msg.is_broadcast);
            const active = selectedContactRef.current;

            if (isBroadcast && senderId === 0) {
                setBroadcasts(prev => {
                    const msgTime = new Date(msg.createdAt ?? msg.created_at).getTime();
                    const msgText = msg.messageText ?? msg.message_text;

                    const existingIdx = prev.findIndex(b => {
                        const bTime = new Date(b.createdAt).getTime();
                        return b.messageText === msgText && Math.abs(bTime - msgTime) < 60000;
                    });

                    if (existingIdx !== -1) {
                        const updated = [...prev];
                        updated[existingIdx] = {
                            ...updated[existingIdx],
                            recipientCount: (updated[existingIdx].recipientCount || 0) + 1,
                            recipientNames: updated[existingIdx].recipientNames
                                ? `${updated[existingIdx].recipientNames}, ${recipientId}`
                                : String(recipientId)
                        };
                        return updated;
                    } else {
                        return [{
                            messageText: msgText,
                            createdAt: msg.createdAt ?? msg.created_at,
                            recipientCount: 1,
                            recipientNames: null,
                            messageIds: [Number(msg.messageId ?? msg.message_id)]
                        }, ...prev];
                    }
                });
                return;
            }

            // ── Direct message handling (unchanged) ──────────────────────────
            const isActiveThread =
                active &&
                !active.isBroadcastCenter &&
                (senderId === Number(active.driverId) || recipientId === Number(active.driverId));

            if (isActiveThread) {
                setMessages(prev => {
                    const id = msg.messageId ?? msg.message_id;
                    if (id && prev.some(m => (m.messageId ?? m.message_id) === id)) return prev;
                    return [...prev, msg];
                });
            } else {
                if (senderId !== 0) {
                    setContacts(prev => prev.map(c =>
                        Number(c.driverId) === senderId
                            ? { ...c, unreadCount: (Number(c.unreadCount) || 0) + 1 }
                            : c
                    ));
                }
            }
        };

        const handleDriverStatusChanged = (data: {
            userId: number; status: string;
            vehicleNumber?: number; vehicleRegNo?: string
        }) => {
            setContacts(prev => prev.map(c =>
                Number(c.driverId) === Number(data.userId)
                    ? {
                        ...c,
                        isOnline: data.status === 'online',
                        vehicleNumber: data.status === 'online' ? (data.vehicleNumber ?? c.vehicleNumber) : null,
                        vehicleRegNo: data.status === 'online' ? (data.vehicleRegNo ?? c.vehicleRegNo) : null,
                    }
                    : c
            ));
        };

        const handleMessagesDeleted = (data: { messageIds: number[] }) => {
            const deletedSet = new Set(
                data.messageIds
                    .filter(id => id !== null && id !== undefined)
                    .map(Number)
                    .filter(id => !isNaN(id) && id > 0)
            );

            if (deletedSet.size === 0) return;

            // ── Direct messages update ────────────────────────────────────────
            setMessages(prev =>
                prev.map(m => {
                    const id = Number(m.messageId ?? m.message_id);
                    return deletedSet.has(id)
                        ? { ...m, is_deleted: true, isDeleted: true }
                        : m;
                })
            );

            // ── Broadcast messages update ─────────────────────────────────────
            setBroadcasts(prev =>
                prev.map(b => {
                    const bIds = (b.messageIds || []).map(Number);
                    const hasDeleted = bIds.some((id: number) => deletedSet.has(id));
                    if (hasDeleted) {
                        return { ...b, isDeleted: true };
                    }
                    return b;
                })
            );


        };

        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('driverStatusChanged', handleDriverStatusChanged);
        socket.off('messagesDeleted', handleMessagesDeleted);
        socket.off('broadcastSent', handleBroadcastSent);
        socket.off('broadcastClusterDeleted', handleBroadcastClusterDeleted);


        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('driverStatusChanged', handleDriverStatusChanged);
        socket.on('messagesDeleted', handleMessagesDeleted);
        socket.on('broadcastSent', handleBroadcastSent);
        socket.on('broadcastClusterDeleted', handleBroadcastClusterDeleted);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('driverStatusChanged', handleDriverStatusChanged);
            socket.off('messagesDeleted', handleMessagesDeleted);
            socket.off('broadcastSent', handleBroadcastSent);
            socket.off('broadcastClusterDeleted', handleBroadcastClusterDeleted);
        };
    }, [socket]);

    // ─── Load history when selected driver changes ────────────────────────────
    useEffect(() => {
        if (selectedDriverId === null) return;
        setMessages([]);
        chatService.getHistory(selectedDriverId).then(history => {
            setMessages(history);
            setContacts(prev => {
                const localCounts: Record<number, number> = {};
                prev.forEach(c => { localCounts[Number(c.driverId)] = Number(c.unreadCount) || 0; });

                chatService.getContacts().then(fresh => {
                    setContacts(fresh.map((c: any) => {
                        const id = Number(c.driverId);
                        const local = localCounts[id] ?? 0;
                        const srv = Number(c.unreadCount) || 0;
                        if (id === selectedDriverId) return { ...c, unreadCount: 0 };
                        return { ...c, unreadCount: Math.max(local, srv) };
                    }));
                });

                return prev;
            });
        }).catch(err => console.error('[Chat] Failed to load history:', err));
    }, [selectedDriverId]);

    // ─── Load broadcast history ───────────────────────────────────────────────
    useEffect(() => {
        if (!isBroadcastSelected) return;
        setBroadcasts([]);
        chatService.getBroadcasts().then(data => {
            // Backend now returns messageIds[] and isDeleted per group
            setBroadcasts(data);
        });
    }, [isBroadcastSelected]);

    // ─── Auto-scroll ─────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, broadcasts]);

    // ─── Send message ─────────────────────────────────────────────────────────
    const handleSend = () => {
        if (!typedMessage.trim() || !socket || !selectedContact || !liveSelectedContact) return;
        socket.emit('send_chat_message', {
            senderId: 0,
            recipientId: selectedContact.driverId,
            vehicleNumber: liveSelectedContact.vehicleNumber,
            text: typedMessage
        });
        setTypedMessage('');
    };

    const handleMessageSelectToggle = (messageId: number) => {
        setSelectedMessageIds(prev =>
            prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
        );
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedMessageIds([]);
    };

    const handleDeleteSelectedMessages = () => {
        if (selectedMessageIds.length === 0 || !socket || !selectedContact) return;

        setConfirmDialog({
            open: true,
            title: t('chat:chatView.titleMessage'),
            message: t('chat:chatView.areYouSureYouWantToDeleteThisMessageFromAllDrivers', { count: selectedMessageIds.length }) + ' ' + t('chat:chatView.thisCannotBeUndone'),
            onConfirm: () => {
                socket.emit('delete_chat_messages', {
                    messageIds: selectedMessageIds,
                    senderId: currentUserId,
                    recipientId: selectedContact.driverId
                });
                handleCancelSelection();
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleDeleteBroadcastCluster = (broadcast: any) => {
        if (!socket) return;
        if (!broadcast.messageIds || broadcast.messageIds.length === 0) {
            console.warn('No messageIds on broadcast group');
            return;
        }

        setConfirmDialog({
            open: true,
            title: t('chat:chatView.title'),
            message: t('chat:chatView.areYouSureYouWantToDeleteThisBroadcastFromAllDrivers', { count: broadcast.recipientCount }) + ' ' + t('chat:chatView.thisCannotBeUndone'),
            onConfirm: () => {
                socket.emit('delete_broadcast_cluster', {
                    messageIds: broadcast.messageIds.map(Number),
                    senderId: 0
                });
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 100px)', gap: 2, p: 2 }}>

            {/* ── Left Sidebar ─────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ width: 320, display: 'flex', flexDirection: 'column', borderRadius: 3, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        {t('chat:chatView.messages')}
                    </Typography>
                    <Button
                        variant="outlined" size="small" startIcon={<CampaignIcon />}
                        onClick={() => setBroadcastOpen(true)}
                        sx={{ borderColor: '#a38f6d', color: '#a38f6d', fontSize: '0.7rem', fontWeight: 'bold' }}
                    >
                        {t('chat:chatView.broadcast')}
                    </Button>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Stack spacing={1} sx={{ flex: 1, overflowY: 'auto' }}>
                    {/* Broadcast row */}
                    <Paper
                        onClick={handleSelectBroadcast}
                        sx={{
                            p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', cursor: 'pointer',
                            border: '1px solid',
                            borderColor: selectedContact?.isBroadcastCenter ? '#a38f6d' : 'divider',
                            bgcolor: selectedContact?.isBroadcastCenter ? alpha('#a38f6d', 0.05) : 'transparent',
                            mb: 0.5
                        }}
                    >
                        <Avatar sx={{ bgcolor: '#a38f6d' }}><CampaignIcon /></Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">{t('chat:chatView.broadcastHistory')}</Typography>
                            <Typography variant="caption" color="text.secondary">{t('chat:chatView.viewAllSentAnnouncements')}</Typography>
                        </Box>
                    </Paper>

                    <Divider sx={{ my: 1 }} />

                    {/* Driver contact rows */}
                    {contacts.map((c, idx) => (
                        <Paper
                            key={c.driverId ?? c.id ?? idx}
                            onClick={() => handleSelectContact(c)}
                            sx={{
                                p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', cursor: 'pointer',
                                border: '1px solid',
                                borderColor: selectedDriverId === Number(c.driverId) ? '#a38f6d' : 'divider',
                                bgcolor: selectedDriverId === Number(c.driverId) ? alpha('#a38f6d', 0.05) : 'transparent'
                            }}
                        >
                            <Badge variant="dot" color="success" invisible={!c.isOnline}>
                                <Avatar sx={{ bgcolor: '#a38f6d' }}>{c.driverName?.[0] ?? 'U'}</Avatar>
                            </Badge>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" fontWeight="bold" noWrap>{c.driverName}</Typography>
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                                    {c.lastMessage || t('chat:chatView.noMessages')}
                                </Typography>
                            </Box>
                            {c.unreadCount > 0 && <Badge badgeContent={c.unreadCount} color="error" />}
                        </Paper>
                    ))}
                </Stack>
            </Paper>

            {/* ── Right Thread Panel ────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden' }}>
                {selectedContact ? (
                    selectedContact.isBroadcastCenter ? (
                        /* Broadcast history view */
                        <>
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#a38f6d', 0.02) }}>
                                <Typography variant="subtitle1" fontWeight="bold">Central Broadcast Archive</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {t('chat:chatView.broadcastDesc')}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: isDarkMode ? 'grey.900' : 'grey.50' }}>
                                <Stack spacing={2.5}>
                                    {/* ── SORT BROADCASTS ───────────────────────────────────────────────
                         Deletd messages highest (bottom), then by date (newest on top) */}
                                    {broadcasts.map((b, idx) => {
                                        const isGroupDeleted = b.isDeleted ?? false;

                                        if (isGroupDeleted) {
                                            return (
                                                <Paper
                                                    key={idx}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1.5, px: 2,
                                                        border: '1px dashed',
                                                        borderColor: 'text.disabled',
                                                        bgcolor: isDarkMode
                                                            ? alpha('#ffffff', 0.03)
                                                            : alpha('#000000', 0.03),
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1
                                                    }}
                                                >
                                                    <DeleteIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="caption"
                                                            sx={{ fontStyle: 'italic', color: 'text.disabled', display: 'block' }}>
                                                            {t('chat:chatView.broadcastDeleted')}
                                                        </Typography>
                                                        <Typography variant="caption"
                                                            color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                                            {dayjs(b.createdAt).format('DD.MM.YYYY HH:mm')}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            );
                                        }

                                        return (
                                            <Paper
                                                key={idx}
                                                sx={{
                                                    p: 2,
                                                    borderLeft: '4px solid #a38f6d',
                                                    borderRadius: '8px',
                                                    bgcolor: 'background.paper',
                                                    // Hover highlight delete button
                                                    '&:hover .broadcast-delete-btn': { opacity: 1 }
                                                }}
                                            >
                                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                                    <Typography variant="body1" fontWeight="bold" sx={{ flex: 1 }}>
                                                        {b.messageText}
                                                    </Typography>

                                                    {/* Delete button*/}
                                                    <IconButton
                                                        className="broadcast-delete-btn"
                                                        size="small"
                                                        onClick={() => handleDeleteBroadcastCluster(b)}
                                                        sx={{
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                            color: 'error.main',
                                                            ml: 1,
                                                            '&:hover': { bgcolor: alpha('#d32f2f', 0.08) }
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>

                                                <Stack direction="row" spacing={2} sx={{ mt: 1, opacity: 0.8 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t('chat.sentTo')}:{' '}
                                                        <strong style={{ color: '#a38f6d' }}>
                                                            {b.recipientNames || `${b.recipientCount} ${t('chat.drivers')}`}
                                                        </strong>
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {dayjs(b.createdAt).format('DD.MM.YYYY HH:mm')}
                                                    </Typography>
                                                </Stack>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        </>
                    ) : (
                        /* Direct chat thread */
                        <>
                            {/* Thread header */}
                            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha('#a38f6d', 0.02) }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="bold">{liveSelectedContact?.driverName}</Typography>
                                        <Typography variant="caption" color="text.secondary">@{liveSelectedContact?.username}</Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Button
                                            size="small" variant="outlined" startIcon={<CheckBoxIcon />}
                                            onClick={() => isSelectionMode ? handleCancelSelection() : setIsSelectionMode(true)}
                                            sx={{ borderColor: '#a38f6d', color: '#a38f6d', fontWeight: 'bold' }}
                                        >
                                            {isSelectionMode ? t('chat:cancel') : t('chat:select')}
                                        </Button>
                                        {liveSelectedContact?.vehicleRegNo && (
                                            <Chip label={liveSelectedContact.vehicleRegNo} color="primary" variant="outlined" size="small" />
                                        )}
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Messages */}
                            <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: isDarkMode ? 'grey.900' : 'grey.50' }}>
                                <Stack spacing={2}>
                                    {messages.map((m, idx) => {
                                        const senderId = Number(m.senderId ?? m.sender_id);
                                        const recipientId = Number(m.recipientId ?? m.recipient_id);
                                        const text = m.messageText ?? m.message_text;
                                        const time = m.createdAt ?? m.created_at;
                                        const isMe = senderId === currentUserId;
                                        const isSystem = senderId === -1;
                                        const isBroadcast = m.isBroadcast ?? m.is_broadcast;
                                        const isDeleted = m.isDeleted ?? m.is_deleted;
                                        const msgId = m.messageId ?? m.message_id;

                                        // Filter: only show messages belonging to this driver thread
                                        if (!isSystem && selectedContact) {
                                            const isFromDriver = senderId === Number(selectedContact.driverId);
                                            const isToDriver = recipientId === Number(selectedContact.driverId);
                                            if (!isBroadcast && !isFromDriver && !isToDriver) return null;
                                        }

                                        if (isSystem) {
                                            return (
                                                <Box key={msgId ?? idx} sx={{ alignSelf: 'center', my: 1, width: '100%' }}>
                                                    <Divider sx={{
                                                        '&::before, &::after': {
                                                            borderColor: alpha(theme.palette.text.secondary, 0.2)
                                                        }
                                                    }}>
                                                        <Chip
                                                            size="small"
                                                            variant="outlined"
                                                            label={`${parseSystemMessage(text)} (${dayjs(time).format('DD.MM.YYYY HH:mm')})`}
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                fontWeight: 'bold',
                                                                color: 'text.secondary',
                                                                bgcolor: alpha('#a38f6d', 0.03)
                                                            }}
                                                        />
                                                    </Divider>
                                                </Box>
                                            );
                                        }

                                        if (isDeleted) {
                                            return (
                                                <Box
                                                    key={msgId ?? idx}
                                                    sx={{
                                                        // Position on correct side — isMe left/right align
                                                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                        my: 0.5,
                                                        maxWidth: '60%'
                                                    }}
                                                >
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            p: 0.75, px: 1.5,
                                                            border: '1px dashed',
                                                            borderColor: 'text.disabled',
                                                            bgcolor: isDarkMode
                                                                ? alpha('#ffffff', 0.04)
                                                                : alpha('#000000', 0.03),
                                                            borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.75
                                                        }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                                        <Typography
                                                            variant="caption"
                                                            sx={{ fontStyle: 'italic', color: 'text.disabled', fontSize: '0.72rem' }}
                                                        >
                                                            {t('chat:chatView.msgDeleted')}
                                                        </Typography>
                                                    </Paper>
                                                    <Typography variant="caption" color="text.disabled"
                                                        sx={{ display: 'block', textAlign: isMe ? 'right' : 'left', mt: 0.3, fontSize: '0.62rem' }}>
                                                        {dayjs(time).format('HH:mm')}
                                                    </Typography>
                                                </Box>
                                            );
                                        }

                                        return (
                                            <Stack
                                                key={msgId ?? idx}
                                                direction="row" spacing={1.5} alignItems="center"
                                                sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}
                                            >
                                                {isSelectionMode && isMe && (
                                                    <Checkbox
                                                        size="small"
                                                        checked={selectedMessageIds.includes(msgId)}
                                                        onChange={() => handleMessageSelectToggle(msgId)}
                                                        sx={{ color: '#a38f6d', '&.Mui-checked': { color: '#a38f6d' } }}
                                                    />
                                                )}
                                                <Box sx={{ maxWidth: '100%' }}>
                                                    <Paper sx={{
                                                        p: 1.5,
                                                        bgcolor: isMe ? '#a38f6d' : (isBroadcast ? alpha('#a38f6d', 0.15) : 'background.paper'),
                                                        color: isMe ? 'white' : 'text.primary',
                                                        borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                                        border: isBroadcast && !isMe
                                                            ? '1px solid #a38f6d'
                                                            : isBroadcast && isMe
                                                                ? '1px dashed rgba(255,255,255,0.6)'
                                                                : 'none'
                                                    }}>
                                                        <Stack direction="row" spacing={0.75} alignItems="center">
                                                            {isBroadcast && !isMe && <CampaignIcon sx={{ fontSize: 16, color: '#a38f6d' }} />}
                                                            <Typography variant="body2">{text}</Typography>
                                                        </Stack>
                                                    </Paper>
                                                    <Typography variant="caption" color="text.secondary"
                                                        sx={{ display: 'block', textAlign: isMe ? 'right' : 'left', mt: 0.5 }}>
                                                        {isBroadcast
                                                            ? `${dayjs(time).format('HH:mm')} • ${t('chat:broadcast', { defaultValue: 'Broadcast' })}`
                                                            : dayjs(time).format('HH:mm')
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </Stack>
                            </Box>

                            {/* Input area */}
                            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                {isSelectionMode ? (
                                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                                        <Button
                                            onClick={handleDeleteSelectedMessages}
                                            variant="contained" color="error" startIcon={<DeleteIcon />}
                                            disabled={selectedMessageIds.length === 0}
                                        >
                                            {t('chat:deleteSelected')} ({selectedMessageIds.length})
                                        </Button>
                                    </Stack>
                                ) : (
                                    <Stack direction="row" spacing={2}>
                                        <TextField
                                            fullWidth size="small"
                                            placeholder={t('chat:chatView.typeYourMessage')}
                                            value={typedMessage}
                                            onChange={(e) => setTypedMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        />
                                        <Button variant="contained" onClick={handleSend} sx={{ bgcolor: '#a38f6d' }}>
                                            <SendIcon />
                                        </Button>
                                    </Stack>
                                )}
                            </Box>
                        </>
                    )
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                        {t('chat:chatView.diverSelect')}
                    </Box>
                )}
            </Paper>

            {/* Broadcast dialog */}
            <BroadcastMessageDialog
                open={broadcastOpen}
                onCloseAction={() => setBroadcastOpen(false)}
                contacts={contacts}
                socket={socket}
                senderId={0}
                onSuccessAction={(msg) => {
                    chatService.getContacts().then(setContacts);
                    setSnackbar({ open: true, message: msg, severity: t('common.success') });
                    if (isBroadcastSelected) {
                        setTimeout(() => {
                            chatService.getBroadcasts().then(data => {
                                setBroadcasts(data);
                            });
                        }, 500);
                    }
                }}
            />

            <DeleteConfirmationDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                cancelText={t('chat:cancel')}
                confirmText={t('chat:delete')}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 'bold' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}