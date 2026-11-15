// One row of the social links table: order arrows, platform, link, on/off switch and the edit and delete buttons.
import React from 'react';
import { Trash2, Edit2, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { PLATFORMS_CONFIG } from '../../SocialIcons';
import { type SocialLink } from '../../../types';

interface SocialLinkRowProps {
  link: SocialLink;
  position: number;
  first: boolean;
  last: boolean;
  onMove: (direction: 'up' | 'down') => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SocialLinkRow: React.FC<SocialLinkRowProps> = ({ link, position, first, last, onMove, onToggle, onEdit, onDelete }) => {
  const platformConfig = PLATFORMS_CONFIG[link.platform] || PLATFORMS_CONFIG.default;
  const IconComp = platformConfig.icon;

  return (
    <tr
      key={link.id}
      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
    >
      {/* Sort Controls */}
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove('up')}
            disabled={first}
            aria-label="تقديم الترتيب"
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove('down')}
            disabled={last}
            aria-label="تأخير الترتيب"
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs text-stone-400 px-1">
            #{position}
          </span>
        </div>
      </td>
  
      {/* Platform */}
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: platformConfig.brandColor }}
          >
            <IconComp className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-stone-800 dark:text-stone-200">
            {platformConfig.name}
          </span>
        </div>
      </td>
  
      {/* URL */}
      <td className="py-3 px-3 max-w-xs truncate">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-amber-400 font-mono text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <span className="truncate">{link.url}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </td>
  
      {/* Active Status Toggle */}
      <td className="py-3 px-3 text-center whitespace-nowrap">
        <button
          type="button"
          onClick={() => onToggle()}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            link.is_active
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40'
              : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-300/40'
          }`}
        >
          {link.is_active ? 'مفعل' : 'معطل'}
        </button>
      </td>
  
      {/* Actions */}
      <td className="py-3 px-3 text-center whitespace-nowrap">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit()}
            className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="تعديل"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete()}
            className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
