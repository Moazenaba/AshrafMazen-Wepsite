import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Headphones, Video } from 'lucide-react';

// The three ways into the content: watch, listen, read. One bar split in three by tone, not three cards
export const CONTENT_KINDS = [
  { to: '/videos', label: 'شاهد', name: 'المرئيات', note: 'سلاسل الشيخ المصوّرة', Icon: Video },
  { to: '/audio', label: 'استمع', name: 'الصوتيات', note: 'يستمر التشغيل أثناء التصفح', Icon: Headphones },
  { to: '/books', label: 'اقرأ', name: 'المكتبة', note: 'كتب ورسائل بصيغة PDF', Icon: BookOpen },
];

export const ContentKinds: React.FC = () => (
  <nav aria-label="أنواع المحتوى" className="rounded-xl overflow-hidden bg-mushaf-deep">
    <ul className="grid grid-cols-3 gap-1">
      {CONTENT_KINDS.map(({ to, label, name, note, Icon }) => (
        <li key={to}>
          <Link
            to={to}
            className="group flex h-full flex-col items-center sm:items-start gap-1 sm:gap-2 px-2 py-4 sm:px-6 sm:py-5 text-center sm:text-start bg-mushaf text-gold-soft hover:bg-[#0c4232] focus-visible:bg-[#0c4232] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gold" aria-hidden="true" />
              <span className="font-ruqaa text-2xl sm:text-3xl leading-none">{label}</span>
            </span>
            <span className="text-sm font-semibold text-white">{name}</span>
            <span className="hidden sm:block text-sm text-gold-soft/80">{note}</span>
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);
