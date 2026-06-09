//frontend/src/components/chat/FloatingChatWidget.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    Fab, Badge, Popover, Paper, Stack, TextField, IconButton,
    Typography, Box, useTheme, alpha, Checkbox, Button,
    Tabs, Tab, Avatar
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CampaignIcon from '@mui/icons-material/Campaign';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import useSocket from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { chatService } from '@/services/chatService';
import DeleteConfirmationDialog from '@/components/common/DeleteConfirmationDialog';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

export const FloatingChatWidget = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const { t } = useTranslation(['chat', 'common']);
    const currentUserId = user?.driverNumericId || 0;
    const isDriver = user?.roles.includes('Kuljettaja');
    const { socket } = useSocket();

    const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [tabIndex, setTabIndex] = useState(0);
    const [activePartner, setActivePartner] = useState<any>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<number[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [driverContacts, setDriverContacts] = useState<any[]>([]);
    const [typedMessage, setTypedMessage] = useState('');
    const [supportUnread, setSupportUnread] = useState(0);
    const [driverUnread, setDriverUnread] = useState(0);
    const totalUnread = supportUnread + driverUnread;

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

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ── Refs ──────────────────────────────────────────────────────────────────
    const openRef = useRef(false);
    const tabIndexRef = useRef(0);
    const activePartnerIdRef = useRef<number | null>(null);

    useEffect(() => { openRef.current = open; }, [open]);
    useEffect(() => { tabIndexRef.current = tabIndex; }, [tabIndex]);
    useEffect(() => {
        activePartnerIdRef.current = activePartner?.driverId ?? null;
    }, [activePartner]);

    // ── Socket ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !currentUserId) return;
        socket.emit('join_chat_room', currentUserId);

        const handleReceiveMessage = (msg: any) => {
            const senderId = Number(msg.sender_id ?? msg.senderId);
            const recipientId = Number(msg.recipient_id ?? msg.recipientId);
            const isSupportMessage = senderId === 0 || recipientId === 0;

            if (isSupportMessage) {
                const visible = openRef.current &&
                    tabIndexRef.current === 0 &&
                    activePartnerIdRef.current === null;
                if (visible) {
                    setMessages(prev => {
                        const id = msg.messageId ?? msg.message_id;
                        if (id && prev.some(m => (m.messageId ?? m.message_id) === id)) return prev;
                        return [...prev, msg];
                    });
                } else {
                    setSupportUnread(prev => prev + 1);
                }
            } else {
                const visible =
                    openRef.current &&
                    tabIndexRef.current === 1 &&
                    activePartnerIdRef.current !== null &&
                    (senderId === activePartnerIdRef.current ||
                        recipientId === activePartnerIdRef.current);
                if (visible) {
                    setMessages(prev => {
                        const id = msg.messageId ?? msg.message_id;
                        if (id && prev.some(m => (m.messageId ?? m.message_id) === id)) return prev;
                        return [...prev, msg];
                    });
                } else if (recipientId === currentUserId) {
                    setDriverUnread(prev => prev + 1);
                }
            }
        };

        const handleMessagesDeleted = (data: { messageIds: number[] }) => {
            const deletedSet = new Set(
                data.messageIds
                    .filter(id => id !== null && id !== undefined)
                    .map(Number)
                    .filter(id => !isNaN(id) && id > 0)
            );
            if (deletedSet.size === 0) return;
            setMessages(prev =>
                prev.map(m => {
                    const msgId = Number(m.messageId ?? m.message_id);
                    return deletedSet.has(msgId)
                        ? { ...m, isDeleted: true, is_deleted: true }
                        : m;
                })
            );
        };

        const handleBroadcastClusterDeleted = (data: { messageIds: number[] }) => {
            const deletedSet = new Set(
                data.messageIds
                    .filter(id => id !== null && id !== undefined)
                    .map(Number)
                    .filter(id => !isNaN(id) && id > 0)
            );
            if (deletedSet.size === 0) return;
            setMessages(prev =>
                prev.map(m => {
                    const msgId = Number(m.messageId ?? m.message_id);
                    const isBroadcast = !!(m.isBroadcast ?? m.is_broadcast);
                    if (isBroadcast && deletedSet.has(msgId)) {
                        return { ...m, isDeleted: true, is_deleted: true };
                    }
                    return m;
                })
            );
        };

        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('messagesDeleted', handleMessagesDeleted);
        socket.off('broadcastClusterDeleted', handleBroadcastClusterDeleted);
        socket.on('receiveMessage', handleReceiveMessage);
        socket.on('messagesDeleted', handleMessagesDeleted);
        socket.on('broadcastClusterDeleted', handleBroadcastClusterDeleted);

        return () => {
            socket.off('receiveMessage', handleReceiveMessage);
            socket.off('messagesDeleted', handleMessagesDeleted);
            socket.off('broadcastClusterDeleted', handleBroadcastClusterDeleted);
        };
    }, [socket, currentUserId]);

    useEffect(() => {
        if (!open) return;
        if (tabIndex === 0 && !activePartner) setSupportUnread(0);
        if (tabIndex === 1 && activePartner) setDriverUnread(0);
    }, [open, tabIndex, activePartner]);

    useEffect(() => {
        if (open && isDriver && tabIndex === 0 && !activePartner) {
            chatService.getHistory(0).then(setMessages);
            setSupportUnread(0);
        }
    }, [open, isDriver, tabIndex, activePartner]);

    useEffect(() => {
        if (open && tabIndex === 1 && !activePartner) {
            chatService.getDriverContacts().then(setDriverContacts);
        }
    }, [open, tabIndex, activePartner]);

    useEffect(() => {
        if (open && activePartner) {
            chatService.getHistory(activePartner.driverId).then(setMessages);
            setDriverUnread(0);
        }
    }, [open, activePartner]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!typedMessage.trim() || !socket) return;
        if (tabIndex === 1 && !activePartner) return;
        const targetRecipientId = tabIndex === 0 ? 0 : activePartner.driverId;
        socket.emit('send_chat_message', {
            senderId: currentUserId,
            recipientId: targetRecipientId,
            vehicleNumber: null,
            text: typedMessage
        });
        setTypedMessage('');
    };

    const handleSelectDriver = (driver: any) => {
        activePartnerIdRef.current = Number(driver.driverId); // ← sync ref
        setMessages([]);
        setActivePartner(driver);
        handleCancelSelection();
        setDriverUnread(0);
    };

    // ── Back arrow fix — sync ref immediately ─────────────────────────────────
    const handleBackToList = () => {
        activePartnerIdRef.current = null;          // ← sync ref, no lag
        setActivePartner(null);
        setMessages([]);
        setTypedMessage('');
        handleCancelSelection();
        chatService.getDriverContacts().then(setDriverContacts);
    };

    const handleMessageSelectToggle = (messageId: number) => {
        setSelectedMessageIds(prev =>
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedMessageIds([]);
    };

    const handleDeleteSelectedMessages = () => {
        if (selectedMessageIds.length === 0 || !socket) return;
        setConfirmDialog({
            open: true,
            title: t('chat:deleteMessages'),
            message: t('chat:deleteMessagesConfirm', { count: selectedMessageIds.length }),
            onConfirm: () => {
                const targetRecipientId = tabIndex === 0 ? 0 : activePartner?.driverId;
                socket.emit('delete_chat_messages', {
                    messageIds: selectedMessageIds,
                    senderId: currentUserId,
                    recipientId: targetRecipientId
                });
                handleCancelSelection();
                setConfirmDialog(prev => ({ ...prev, open: false }));
            }
        });
    };

    const handleFabClick = (e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
        const willOpen = !open;
        setOpen(willOpen);
        if (willOpen) {
            if (supportUnread > 0) {
                setTabIndex(0);
                setActivePartner(null);
                activePartnerIdRef.current = null;
            } else if (driverUnread > 0) {
                setTabIndex(1);
                setActivePartner(null);
                activePartnerIdRef.current = null;
            }
        }
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
            {/* FAB */}
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Fab color="primary" onClick={handleFabClick}
                    sx={{ bgcolor: '#a38f6d', '&:hover': { bgcolor: '#8e7a5a' } }}>
                    <Badge badgeContent={totalUnread} color="error">
                        <ChatIcon />
                    </Badge>
                </Fab>
                {supportUnread > 0 && (
                    <Box sx={{
                        position: 'absolute', bottom: -4, left: -4,
                        bgcolor: '#1976d2', color: 'white',
                        borderRadius: '10px', minWidth: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 'bold',
                        border: '2px solid white', zIndex: 1
                    }}>{supportUnread}</Box>
                )}
                {driverUnread > 0 && (
                    <Box sx={{
                        position: 'absolute', bottom: -4, right: -4,
                        bgcolor: '#2e7d32', color: 'white',
                        borderRadius: '10px', minWidth: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 'bold',
                        border: '2px solid white', zIndex: 1
                    }}>{driverUnread}</Box>
                )}
            </Box>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        width: 340, height: 480,
                        borderRadius: '16px', overflow: 'hidden', boxShadow: 6
                    }
                }}
            >
                <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Header */}
                    <Box sx={{ p: 1.5, bgcolor: '#a38f6d', color: 'white', flexShrink: 0 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                {activePartner && (
                                    <IconButton
                                        size="small"
                                        onClick={handleBackToList}
                                        sx={{ color: 'white', flexShrink: 0 }}
                                    >
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                )}
                                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                    {activePartner ? activePartner.driverName : t('chatView.liveChat')}
                                </Typography>
                            </Stack>
                            {!(tabIndex === 1 && !activePartner) && (
                                <Button
                                    size="small" variant="outlined"
                                    onClick={() => isSelectionMode
                                        ? handleCancelSelection()
                                        : setIsSelectionMode(true)}
                                    sx={{
                                        color: 'white',
                                        borderColor: 'rgba(255,255,255,0.4)',
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        flexShrink: 0,
                                        ml: 1,
                                        '&:hover': { borderColor: 'rgba(255,255,255,0.6)' },
                                    }}
                                >
                                    {isSelectionMode ? t('chat:cancel') : t('chat:select')}
                                </Button>
                            )}
                        </Stack>
                    </Box>

                    {/* Tabs */}
                    {!activePartner && (
                        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                            <Tabs
                                value={tabIndex}
                                onChange={(_, v) => {
                                    setTabIndex(v);
                                    if (v === 0) setSupportUnread(0);
                                }}
                                variant="fullWidth"
                                sx={{
                                    '& .MuiTabs-indicator': { bgcolor: '#a38f6d' },
                                    '& .MuiTab-root.Mui-selected': { color: '#a38f6d' }
                                }}
                            >
                                <Tab
                                    icon={
                                        <Badge badgeContent={supportUnread} color="error"
                                            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                                            <SupportAgentIcon />
                                        </Badge>
                                    }
                                    label="Support" iconPosition="start" sx={{ fontSize: '0.75rem' }}
                                />
                                <Tab
                                    icon={
                                        <Badge badgeContent={driverUnread} color="success"
                                            sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}>
                                            <PeopleIcon />
                                        </Badge>
                                    }
                                    label="Drivers" iconPosition="start" sx={{ fontSize: '0.75rem' }}
                                />
                            </Tabs>
                        </Box>
                    )}

                    {/* Body */}
                    <Box sx={{
                        flex: 1,
                        overflowY: 'auto',
                        bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                        // ── Correct padding for message alignment ──────────
                        px: 1.5,
                        py: 1.5
                    }}>
                        {tabIndex === 1 && !activePartner ? (
                            // ── Contacts list ─────────────────────────────
                            <Stack spacing={1}>
                                <Typography variant="caption" fontWeight="bold"
                                    color="text.secondary" sx={{ mb: 0.5, px: 0.5 }}>
                                    {t('chat:drivers')}
                                </Typography>
                                {driverContacts.map((c, idx) => (
                                    <Paper
                                        key={`${c.driverId}_${idx}`}
                                        onClick={() => handleSelectDriver(c)}
                                        sx={{
                                            p: 1.2, display: 'flex', gap: 1.5,
                                            alignItems: 'center', cursor: 'pointer',
                                            border: '1px solid', borderColor: 'divider',
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: alpha('#a38f6d', 0.06) }
                                        }}
                                    >
                                        <Badge variant="dot" color="success" invisible={!c.isOnline}>
                                            <Avatar sx={{
                                                bgcolor: '#a38f6d', width: 34, height: 34,
                                                fontSize: '0.9rem'
                                            }}>
                                                {c.driverName?.[0] ?? 'U'}
                                            </Avatar>
                                        </Badge>
                                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                            <Typography variant="body2" fontWeight="bold" noWrap>
                                                {c.driverName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary"
                                                noWrap sx={{ display: 'block' }}>
                                                {c.vehicleRegNo
                                                    ? t('chat:vehicle', { regNo: c.vehicleRegNo })
                                                    : t('chat:noActiveVehicle')}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            // ── Messages thread ───────────────────────────
                            // IMPORTANT: Stack width 100% + flex column
                            <Stack
                                spacing={1}
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {messages.map((m, idx) => {
                                    const senderId = Number(m.senderId ?? m.sender_id);
                                    const recipientId = Number(m.recipientId ?? m.recipient_id);
                                    const text = m.messageText ?? m.message_text;
                                    const time = m.createdAt ?? m.created_at;
                                    const isMe = senderId === currentUserId;
                                    const isSystem = senderId === -1;
                                    const isBroadcast = !!(m.isBroadcast ?? m.is_broadcast);
                                    const isDeleted = !!(m.isDeleted ?? m.is_deleted);
                                    const msgId = m.messageId || m.message_id;

                                    // Strict tab filter
                                    if (!isSystem) {
                                        const isSupportMsg = senderId === 0 || recipientId === 0;
                                        if (tabIndex === 0 && !isSupportMsg) return null;
                                        if (tabIndex === 1) {
                                            if (isSupportMsg) return null;
                                            if (!activePartner) return null;
                                            const pid = Number(activePartner.driverId);
                                            if (senderId !== pid && recipientId !== pid) return null;
                                        }
                                    }

                                    // ── System message ────────────────────
                                    if (isSystem) {
                                        return (
                                            <Box key={idx} sx={{
                                                width: '100%', textAlign: 'center', my: 1
                                            }}>
                                                <Typography variant="caption" color="text.secondary"
                                                    sx={{
                                                        display: 'block', fontStyle: 'italic',
                                                        fontSize: '0.72rem', fontWeight: 600
                                                    }}>
                                                    {parseSystemMessage(text)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary"
                                                    sx={{ display: 'block', fontSize: '0.62rem', mt: 0.2 }}>
                                                    {dayjs(time).format('DD.MM.YYYY HH:mm')}
                                                </Typography>
                                            </Box>
                                        );
                                    }

                                    // ── Deleted tombstone ─────────────────
                                    if (isDeleted) {
                                        return (
                                            <Box key={msgId || idx} sx={{
                                                width: '100%', textAlign: 'center', my: 0.5
                                            }}>
                                                <Paper variant="outlined" sx={{
                                                    p: 0.5, px: 1.5,
                                                    border: '1px dashed',
                                                    borderColor: 'text.disabled',
                                                    bgcolor: 'transparent',
                                                    borderRadius: '8px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center', gap: 0.5
                                                }}>
                                                    <DeleteIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                                                    <Typography variant="caption" sx={{
                                                        fontStyle: 'italic',
                                                        color: 'text.disabled',
                                                        fontSize: '0.68rem'
                                                    }}>
                                                        {t('chat:messageDeleted')}
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        );
                                    }

                                    // ── Normal message bubble ─────────────
                                    return (
                                        // OUTER BOX: full width, flex, align by isMe
                                        <Box
                                            key={msgId || idx}
                                            sx={{
                                                width: '100%',
                                                display: 'flex',
                                                // isMe → right, other → left
                                                justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                alignItems: 'flex-end',
                                                gap: 0.5
                                            }}
                                        >
                                            {/* Checkbox — left of bubble for own msgs */}
                                            {isSelectionMode && isMe && !isBroadcast && (
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedMessageIds.includes(msgId)}
                                                    onChange={() => handleMessageSelectToggle(msgId)}
                                                    sx={{
                                                        color: '#a38f6d',
                                                        '&.Mui-checked': { color: '#a38f6d' },
                                                        p: 0, mb: 2.5
                                                    }}
                                                />
                                            )}

                                            {/* Bubble + timestamp */}
                                            <Box sx={{
                                                maxWidth: '75%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isMe ? 'flex-end' : 'flex-start'
                                            }}>
                                                <Paper sx={{
                                                    p: 1, px: 1.5,
                                                    bgcolor: isMe
                                                        ? '#a38f6d'
                                                        : isBroadcast
                                                            ? alpha('#a38f6d', 0.15)
                                                            : theme.palette.mode === 'dark'
                                                                ? 'grey.800'
                                                                : 'white',
                                                    color: isMe ? 'white' : 'text.primary',
                                                    // Correct bubble tail direction
                                                    borderRadius: isMe
                                                        ? '12px 12px 2px 12px'
                                                        : '12px 12px 12px 2px',
                                                    border: isBroadcast && !isMe
                                                        ? '1px solid #a38f6d'
                                                        : 'none',
                                                    boxShadow: 1,
                                                    wordBreak: 'break-word'
                                                }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        {isBroadcast && !isMe && (
                                                            <CampaignIcon sx={{ fontSize: 14, color: '#a38f6d', flexShrink: 0 }} />
                                                        )}
                                                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                                                            {text}
                                                        </Typography>
                                                    </Stack>
                                                </Paper>
                                                {/* Timestamp */}
                                                <Typography variant="caption" color="text.disabled"
                                                    sx={{ fontSize: '0.62rem', mt: 0.3, px: 0.5 }}>
                                                    {dayjs(time).format('HH:mm')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </Stack>
                        )}
                    </Box>

                    {/* Input */}
                    {!(tabIndex === 1 && !activePartner) && (
                        <Box sx={{
                            p: 1.5, borderTop: '1px solid',
                            borderColor: 'divider', flexShrink: 0
                        }}>
                            {isSelectionMode ? (
                                <Stack direction="row" spacing={1}
                                    alignItems="center" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedMessageIds.length}{' '}
                                        {t('chat:selected')}
                                    </Typography>
                                    <Button
                                        onClick={handleDeleteSelectedMessages}
                                        size="small" variant="contained" color="error"
                                        startIcon={<DeleteIcon />}
                                        disabled={selectedMessageIds.length === 0}
                                    >
                                        {t('chat:delete')}
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack direction="row" spacing={1}>
                                    <TextField
                                        size="small" fullWidth
                                        placeholder={
                                            tabIndex === 0
                                                ? t('chat:writeToSupport')
                                                : t('chat:writeAMessage')
                                        }
                                        value={typedMessage}
                                        onChange={(e) => setTypedMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        InputProps={tabIndex === 0 ? {
                                            startAdornment: (
                                                <SupportAgentIcon sx={{
                                                    fontSize: 16, color: '#a38f6d', mr: 0.5
                                                }} />
                                            )
                                        } : undefined}
                                    />
                                    <IconButton onClick={handleSend} sx={{
                                        bgcolor: '#a38f6d', color: 'white',
                                        '&:hover': { bgcolor: '#8e7a5a' }
                                    }}>
                                        <SendIcon />
                                    </IconButton>
                                </Stack>
                            )}
                        </Box>
                    )}
                </Paper>
            </Popover>

            {/* Delete confirmation dialog */}
            <DeleteConfirmationDialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                cancelText={t('chat:cancel')}
                confirmText={t('chat:delete')}
            />
        </Box>
    );
};

export default FloatingChatWidget;