import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, AppSettings, ChatMessage, ChatTag } from '../../types';
import { StorageManager } from '../../utils/storage';
import { playNotificationChime } from '../../utils/soundHelper';
import {
  MessageCircle,
  Send,
  Pin,
  Trash2,
  Reply,
  X,
  Smile,
  Volume2,
  VolumeX,
  Search,
  Filter,
  User as UserIcon,
  ShieldCheck,
  CheckCheck,
  Heart,
  Sparkles,
  ArrowDown,
  AlertCircle,
  RotateCcw,
  Edit2,
  Info
} from 'lucide-react';

interface ChatViewProps {
  currentUser: User;
  settings?: AppSettings;
}

const TAG_CONFIG: Record<
  ChatTag,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  UMUM: {
    label: 'Umum',
    icon: '💬',
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700'
  },
  DOA: {
    label: 'Pokok Doa',
    icon: '🙏',
    bg: 'bg-rose-950/70',
    text: 'text-rose-300',
    border: 'border-rose-800/60'
  },
  AYAT: {
    label: 'Ayat Alkitab',
    icon: '✝️',
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-800/60'
  },
  SALAM: {
    label: 'Salam & Sapaan',
    icon: '🕊️',
    bg: 'bg-teal-950/70',
    text: 'text-teal-300',
    border: 'border-teal-800/60'
  },
  INFO: {
    label: 'Warta / Info',
    icon: '📢',
    bg: 'bg-blue-950/70',
    text: 'text-blue-300',
    border: 'border-blue-800/60'
  }
};

const QUICK_BLESSINGS = [
  '🙏 Amin',
  '🕊️ Syalom',
  '✝️ Puji Tuhan',
  '❤️ Haleluya',
  '🙌 Tuhan Berkati',
  '⛪ Salam Kasih'
];

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => StorageManager.getChatMessages());
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTag, setSelectedTag] = useState<ChatTag>('UMUM');
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [filterTag, setFilterTag] = useState<'ALL' | ChatTag | 'PINNED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Guest Nickname State for visitors who are not logged in
  const isGuest = currentUser.user_id === 'guest' || !currentUser.user_id;
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('cms_chat_guest_name') || 'Jemaat Tamu';
  });
  const [isEditingGuestName, setIsEditingGuestName] = useState(false);
  const [tempGuestName, setTempGuestName] = useState(guestName);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const effectiveDisplayName = isGuest ? guestName : currentUser.nama || currentUser.username;

  // Sync custom theme color
  const themeHex = settings?.warna_tema?.trim() || '#CD5C5C';

  // Load and subscribe to storage & real-time changes
  useEffect(() => {
    const handleDataChange = () => {
      const latest = StorageManager.getChatMessages();
      setMessages((prev) => {
        if (latest.length > prev.length && soundEnabled) {
          playNotificationChime();
        }
        return latest;
      });
    };

    window.addEventListener('cms_data_changed', handleDataChange);
    window.addEventListener('storage', handleDataChange);

    // Heartbeat sync check every 4 seconds
    const interval = setInterval(() => {
      const latest = StorageManager.getChatMessages();
      setMessages((prev) => {
        if (latest.length !== prev.length) {
          return latest;
        }
        return prev;
      });
    }, 4000);

    return () => {
      window.removeEventListener('cms_data_changed', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
      clearInterval(interval);
    };
  }, [soundEnabled]);

  // Auto-scroll to bottom on first mount and new messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages.length]);

  // Track scroll position to show "Scroll to Bottom" button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isNearBottom);
  };

  // Save guest nickname
  const handleSaveGuestName = () => {
    const trimmed = tempGuestName.trim();
    if (trimmed) {
      setGuestName(trimmed);
      localStorage.setItem('cms_chat_guest_name', trimmed);
    }
    setIsEditingGuestName(false);
  };

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    let senderRole: 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT' | 'TAMU' = 'JEMAAT';
    if (currentUser.role === 'SUPER_ADMIN') senderRole = 'SUPER_ADMIN';
    else if (currentUser.role === 'ADMIN') senderRole = 'ADMIN';
    else if (isGuest) senderRole = 'TAMU';

    const newMsg = StorageManager.addChatMessage({
      sender_name: effectiveDisplayName,
      sender_id: currentUser.user_id,
      sender_role: senderRole,
      message: trimmed,
      tag: selectedTag,
      reply_to: replyTarget
        ? {
            id: replyTarget.id,
            sender_name: replyTarget.sender_name,
            message: replyTarget.message.slice(0, 100)
          }
        : undefined
    });

    setMessages(StorageManager.getChatMessages());
    setInputMessage('');
    setReplyTarget(null);
    setSelectedTag('UMUM');

    if (soundEnabled) {
      playNotificationChime();
    }

    setTimeout(() => {
      scrollToBottom(true);
    }, 50);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Delete message
  const handleDeleteMessage = (id: string) => {
    const msg = messages.find((m) => m.id === id);
    const isPinned = msg?.is_pinned;
    if (
      window.confirm(
        isPinned
          ? 'Pesan ini sedang DI-SEMATKAN (Pinned). Anda yakin ingin menghapus pesan ini?'
          : 'Hapus pesan ini dari ruang chat?'
      )
    ) {
      StorageManager.deleteChatMessage(id);
      setMessages(StorageManager.getChatMessages());
      if (isAdmin) {
        StorageManager.logActivity(
          currentUser.username,
          `Menghapus pesan chat: ${msg?.message.slice(0, 35) || id}`,
          'Ruang Chat'
        );
      }
    }
  };

  // Toggle Pin message (Admin only)
  const handleTogglePin = (id: string) => {
    StorageManager.togglePinChatMessage(id);
    setMessages(StorageManager.getChatMessages());
  };

  // Clear all messages (Admin only)
  const handleClearAllChat = () => {
    StorageManager.clearChatMessages();
    setMessages([]);
    setShowClearConfirm(false);
  };

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // Filter by tag
      if (filterTag === 'PINNED') {
        if (!msg.is_pinned) return false;
      } else if (filterTag !== 'ALL') {
        if (msg.tag !== filterTag) return false;
      }

      // Filter by search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = msg.message.toLowerCase().includes(query);
        const matchesSender = msg.sender_name.toLowerCase().includes(query);
        return matchesText || matchesSender;
      }

      return true;
    });
  }, [messages, filterTag, searchQuery]);

  const pinnedMessages = useMemo(() => {
    return messages.filter((m) => m.is_pinned);
  }, [messages]);

  // Format timestamp nicely
  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      if (isToday) {
        return `${hours}:${minutes}`;
      }

      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${day} ${monthNames[date.getMonth()]} ${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] max-w-5xl mx-auto rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden animate-fade-in relative">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-xl flex flex-col gap-3 shrink-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ backgroundColor: themeHex }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  Ruang Chat Komunitas
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Terbuka untuk seluruh jemaat, pelayan & pengurus gereja
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Notifikasi' : 'Aktifkan Suara Notifikasi'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300 hover:bg-indigo-900/80'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Bersihkan Semua Percakapan (Admin)"
                className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* User Identity Bar (Specially helpful for guests/visitors) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold shrink-0">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-slate-400 font-medium">Kirim pesan sebagai:</span>
            {isEditingGuestName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempGuestName}
                  onChange={(e) => setTempGuestName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveGuestName()}
                  placeholder="Ketik nama Anda..."
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-indigo-500 text-white text-xs focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveGuestName}
                  className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setIsEditingGuestName(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-black text-white truncate">{effectiveDisplayName}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {currentUser.role === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : currentUser.role === 'ADMIN'
                    ? 'Admin Gereja'
                    : isGuest
                    ? 'Tamu'
                    : 'Jemaat'}
                </span>
                {isGuest && (
                  <button
                    onClick={() => {
                      setTempGuestName(guestName);
                      setIsEditingGuestName(true);
                    }}
                    title="Ubah Nama Tampilan"
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>{messages.length} Total Pesan</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Tag Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setFilterTag('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterTag === 'ALL'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Semua
            </button>
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setFilterTag('PINNED')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  filterTag === 'PINNED'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 text-amber-400 hover:bg-amber-950/40 border border-amber-800/40'
                }`}
              >
                <Pin className="w-3 h-3 fill-current" />
                <span>Disematkan ({pinnedMessages.length})</span>
              </button>
            )}
            {(['DOA', 'AYAT', 'SALAM', 'INFO'] as ChatTag[]).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  filterTag === tag
                    ? `${TAG_CONFIG[tag].bg} ${TAG_CONFIG[tag].text} border ${TAG_CONFIG[tag].border} shadow-md`
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{TAG_CONFIG[tag].icon}</span>
                <span>{TAG_CONFIG[tag].label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative shrink-0 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pesan / jemaat..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pinned Messages Banner (if any) */}
      {pinnedMessages.length > 0 && filterTag !== 'PINNED' && (
        <div className="bg-amber-950/30 border-b border-amber-800/30 px-4 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
            <span className="font-bold text-amber-300 shrink-0">Pesan Penting:</span>
            <span className="text-slate-300 truncate">
              {pinnedMessages[pinnedMessages.length - 1].sender_name}: {pinnedMessages[pinnedMessages.length - 1].message}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={() => handleDeleteMessage(pinnedMessages[pinnedMessages.length - 1].id)}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/15 hover:bg-rose-500/25 px-2 py-0.5 rounded-lg border border-rose-500/30 cursor-pointer transition-all"
                title="Admin: Hapus Pesan yang Sedang Disematkan Ini"
              >
                <Trash2 className="w-3 h-3" />
                <span>Hapus</span>
              </button>
            )}
            <button
              onClick={() => setFilterTag('PINNED')}
              className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
            >
              Lihat ({pinnedMessages.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Messages Feed */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-900/60 scroll-smooth"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <MessageCircle className="w-7 h-7" />
            </div>
            <p className="font-bold text-white text-sm">Belum ada percakapan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Jadilah yang pertama mengirimkan salam kasih atau pokok doa di Ruang Chat ini!
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMine =
              (!isGuest && msg.sender_id === currentUser.user_id) ||
              (isGuest && msg.sender_name === effectiveDisplayName);

            const isSenderAdmin =
              msg.sender_role === 'ADMIN' || msg.sender_role === 'SUPER_ADMIN';

            const tagInfo = msg.tag && msg.tag !== 'UMUM' ? TAG_CONFIG[msg.tag] : null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group animate-fade-in`}
              >
                {/* Sender Identity & Role Badge */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-xs font-black text-slate-300">
                    {isMine ? 'Anda' : msg.sender_name}
                  </span>
                  {isSenderAdmin && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  )}
                  {msg.sender_role === 'TAMU' && !isSenderAdmin && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400">
                      Tamu
                    </span>
                  )}
                  {msg.is_pinned && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                      <Pin className="w-2.5 h-2.5 fill-current" />
                      Disematkan
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-md md:max-w-lg p-3.5 rounded-2xl shadow-lg relative group transition-all ${
                    isMine
                      ? 'text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                  style={isMine ? { backgroundColor: themeHex } : {}}
                >
                  {/* Quoted Reply Preview */}
                  {msg.reply_to && (
                    <div className="mb-2 p-2 rounded-xl bg-black/25 border-l-4 border-amber-400 text-xs">
                      <span className="font-bold text-amber-300 block text-[11px]">
                        Membalas {msg.reply_to.sender_name}:
                      </span>
                      <span className="line-clamp-2 text-slate-300 italic opacity-90 text-[11px]">
                        "{msg.reply_to.message}"
                      </span>
                    </div>
                  )}

                  {/* Category Tag Badge */}
                  {tagInfo && (
                    <div className="mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${tagInfo.bg} ${tagInfo.text} ${tagInfo.border}`}
                      >
                        <span>{tagInfo.icon}</span>
                        <span>{tagInfo.label}</span>
                      </span>
                    </div>
                  )}

                  {/* Text Message Content */}
                  <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed font-normal">
                    {msg.message}
                  </p>

                  {/* Timestamp & Meta */}
                  <div
                    className={`flex items-center justify-end gap-1.5 mt-2 text-[10px] ${
                      isMine ? 'text-white/80' : 'text-slate-500'
                    }`}
                  >
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isMine && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Action Bar (Reply, Pin, Delete) - Visible on mobile/touch, hover on desktop */}
                <div className="flex items-center gap-1.5 mt-1.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-1 text-[11px]">
                  <button
                    onClick={() => {
                      setReplyTarget(msg);
                      inputRef.current?.focus();
                    }}
                    title="Balas Pesan"
                    className="flex items-center gap-1 text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                  >
                    <Reply className="w-3 h-3" />
                    <span>Balas</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleTogglePin(msg.id)}
                      title={msg.is_pinned ? 'Lepas Sematan' : 'Sematkan Pesan'}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer ${
                        msg.is_pinned
                          ? 'text-amber-400 bg-amber-950/40 border border-amber-800/30'
                          : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{msg.is_pinned ? 'Lepas Semat' : 'Sematkan'}</span>
                    </button>
                  )}

                  {(isAdmin || isMine) && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      title={isAdmin ? 'Admin: Hapus Pesan Ini (Termasuk yang Disematkan)' : 'Hapus Pesan Anda'}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-36 right-6 p-2.5 rounded-full bg-indigo-600 text-white shadow-2xl hover:bg-indigo-500 transition-all z-20 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowDown className="w-4 h-4" />
          <span>Ke Pesan Baru</span>
        </button>
      )}

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 shrink-0 z-10 flex flex-col gap-2">
        {/* Active Reply Banner */}
        {replyTarget && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Reply className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-white block">
                  Membalas {replyTarget.sender_name}
                </span>
                <span className="text-slate-400 text-[11px] truncate block">
                  "{replyTarget.message}"
                </span>
              </div>
            </div>
            <button
              onClick={() => setReplyTarget(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Blessings / Praise Emojis */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 hidden sm:inline">
            Cepat:
          </span>
          {QUICK_BLESSINGS.map((blessing) => (
            <button
              key={blessing}
              type="button"
              onClick={() => setInputMessage((prev) => (prev ? `${prev} ${blessing}` : blessing))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs whitespace-nowrap transition-all border border-slate-700 cursor-pointer hover:scale-105 active:scale-95"
            >
              {blessing}
            </button>
          ))}
        </div>

        {/* Tag Selector for Message */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Kategori:</span>
          {(['UMUM', 'DOA', 'AYAT', 'SALAM', 'INFO'] as ChatTag[]).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                selectedTag === tag
                  ? `${TAG_CONFIG[tag].bg} ${TAG_CONFIG[tag].text} border ${TAG_CONFIG[tag].border}`
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <span className="mr-1">{TAG_CONFIG[tag].icon}</span>
              <span>{TAG_CONFIG[tag].label}</span>
            </button>
          ))}
        </div>

        {/* Input Text Form */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder={`Tulis pesan atau pokok doa di sini (Tekan Enter untuk kirim)...`}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            style={{
              backgroundColor: inputMessage.trim() ? themeHex : undefined
            }}
            className={`p-3.5 rounded-2xl flex items-center justify-center font-bold text-white transition-all shrink-0 cursor-pointer shadow-lg active:scale-95 ${
              inputMessage.trim()
                ? 'hover:brightness-110'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Modal Konfirmasi Bersihkan Chat (Admin Only) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Bersihkan Semua Percakapan?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tindakan ini akan mengosongkan riwayat percakapan di ruang chat ini untuk seluruh perangkat.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleClearAllChat}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Ya, Bersihkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
