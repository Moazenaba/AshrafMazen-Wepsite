import React from 'react';
import type { SocialLink, SocialPlatform } from '../types';

export interface PlatformConfig {
  id: string;
  name: string;
  brandColor: string;
  hoverBg: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

export const PLATFORMS_CONFIG: Record<string, PlatformConfig> = {
  facebook: {
    id: 'facebook',
    name: 'فيسبوك',
    brandColor: '#1877F2',
    hoverBg: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  youtube: {
    id: 'youtube',
    name: 'يوتيوب',
    brandColor: '#FF0000',
    hoverBg: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  x: {
    id: 'x',
    name: 'إكس (تويتر)',
    brandColor: '#000000',
    hoverBg: 'hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  instagram: {
    id: 'instagram',
    name: 'إنستغرام',
    brandColor: '#E4405F',
    hoverBg: 'hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-600 hover:to-purple-600 hover:text-white hover:border-rose-500',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  telegram: {
    id: 'telegram',
    name: 'تيليجرام',
    brandColor: '#26A5E4',
    hoverBg: 'hover:bg-[#26A5E4] hover:text-white hover:border-[#26A5E4]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.895-.964 4.542-1.36 6.467-.168.815-.508 1.087-.832 1.114-.704.058-1.238-.466-1.921-.914-1.07-.701-1.674-1.138-2.712-1.821-1.2-.79-.423-1.224.262-1.936.18-.187 3.3-3.023 3.361-3.284.008-.033.015-.154-.057-.219-.073-.064-.18-.042-.257-.025-.11.024-1.859 1.182-5.247 3.469-.496.34-.946.507-1.349.498-.445-.01-1.3-.252-1.936-.459-.78-.254-1.399-.388-1.345-.819.028-.225.339-.455.932-.693 3.652-1.591 6.088-2.64 7.307-3.149 3.483-1.454 4.207-1.706 4.678-1.713.103-.001.334.024.484.146.126.102.161.24.175.344.015.107.032.327.017.505z" />
      </svg>
    ),
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'واتساب',
    brandColor: '#25D366',
    hoverBg: 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.301-.15-1.777-.878-2.052-.978-.276-.1-.476-.15-.677.15-.2.301-.777.978-.952 1.179-.176.2-.351.226-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.675-2.085-.175-.3-.019-.463.132-.613.136-.135.301-.351.451-.527.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.526-.075-.15-.677-1.632-.927-2.233-.244-.585-.492-.506-.677-.515-.175-.01-.376-.01-.577-.01-.2 0-.526.075-.802.375-.275.3-1.053 1.03-1.053 2.511s1.078 2.912 1.228 3.113c.15.2 2.122 3.24 5.14 4.543.718.31 1.279.496 1.716.634.722.23 1.38.197 1.9.12.58-.086 1.777-.727 2.027-1.428.25-.702.25-1.304.175-1.429-.075-.125-.276-.2-.577-.35zM12.042 0C5.392 0 0 5.392 0 12.042c0 2.124.555 4.197 1.611 6.027L.103 23.904l6.002-1.574a11.996 11.996 0 0 0 5.937 1.554h.005c6.649 0 12.041-5.392 12.041-12.042 0-3.218-1.253-6.242-3.529-8.518C18.283 1.047 15.26 0 12.042 0z" />
      </svg>
    ),
  },
  tiktok: {
    id: 'tiktok',
    name: 'تيك توك',
    brandColor: '#000000',
    hoverBg: 'hover:bg-black dark:hover:bg-stone-800 hover:text-[#00f2fe] hover:border-black',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  soundcloud: {
    id: 'soundcloud',
    name: 'ساوند كلاود',
    brandColor: '#FF5500',
    hoverBg: 'hover:bg-[#FF5500] hover:text-white hover:border-[#FF5500]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.175 12.225c-.051 0-.094.045-.101.1l-.278 3.824.278 3.731c.007.057.05.098.101.098.055 0 .098-.041.101-.098l.31-3.731-.31-3.824c-.003-.055-.046-.1-.101-.1zm1.189-.861c-.066 0-.12.053-.127.119l-.261 4.678.261 4.542c.007.066.061.119.127.119.068 0 .121-.053.125-.119l.295-4.542-.295-4.678c-.004-.066-.057-.119-.125-.119zm1.222-1.391c-.08 0-.146.064-.15.144l-.234 6.069.234 4.545c.004.08.07.144.15.144.079 0 .144-.064.147-.144l.271-4.545-.271-6.069c-.003-.08-.068-.144-.147-.144zm1.233-1.041c-.093 0-.168.075-.17.168l-.208 7.11.208 4.548c.002.093.077.168.17.168.092 0 .167-.075.168-.168l.247-4.548-.247-7.11c-.001-.093-.076-.168-.168-.168zm1.241-.453c-.105 0-.19.085-.19.19l-.18 7.563.18 4.551c0 .105.085.19.19.19.104 0 .19-.085.19-.19l.222-4.551-.222-7.563c0-.105-.086-.19-.19-.19zm1.238.487c-.118 0-.213.095-.213.213l-.155 7.076.155 4.554c0 .118.095.213.213.213.117 0 .213-.095.213-.213l.197-4.554-.197-7.076c0-.118-.096-.213-.213-.213zm1.238.56c-.13 0-.235.105-.235.235l-.13 6.516.13 4.557c0 .13.105.235.235.235.13 0 .235-.105.235-.235l.172-4.557-.172-6.516c0-.13-.105-.235-.235-.235zm1.239.54c-.143 0-.258.115-.258.258l-.104 5.976.104 4.56c0 .143.115.258.258.258.142 0 .258-.115.258-.258l.147-4.56-.147-5.976c0-.143-.116-.258-.258-.258zm1.24.472c-.155 0-.281.126-.281.281l-.078 5.504.078 4.563c0 .155.126.281.281.281.155 0 .281-.126.281-.281l.122-4.563-.122-5.504c0-.155-.126-.281-.281-.281zm2.378-5.32c-.053 0-.104.015-.15.04-.108-.949-.916-1.688-1.9-1.688-.14 0-.276.015-.407.043-.099-.181-.223-.346-.37-.488-.124-.12-.265-.219-.418-.293l-.066 12.285.011.003h3.29c1.97 0 3.568-1.598 3.568-3.568 0-1.971-1.598-3.569-3.568-3.569-.03 0-.06 0-.09.003z" />
      </svg>
    ),
  },
  blogger: {
    id: 'blogger',
    name: 'بلوجر',
    brandColor: '#FF5722',
    hoverBg: 'hover:bg-[#FF5722] hover:text-white hover:border-[#FF5722]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.207 0H3.793C1.7 0 0 1.7 0 3.793v16.414C0 22.3 1.7 24 3.793 24h16.414C22.3 24 24 22.3 24 20.207V3.793C24 1.7 22.3 0 20.207 0zm-3.328 14.593c0 2.062-1.672 3.734-3.734 3.734H8.47a3.734 3.734 0 0 1-3.735-3.734V9.407C4.735 7.345 6.407 5.673 8.47 5.673h4.675c2.062 0 3.734 1.672 3.734 3.734v5.186zM9.333 8.333h2.667v2.667H9.333V8.333zm4.667 5.334H9.333V11h4.667v2.667z" />
      </svg>
    ),
  },
  snapchat: {
    id: 'snapchat',
    name: 'سناب شات',
    brandColor: '#FFFC00',
    hoverBg: 'hover:bg-[#FFFC00] hover:text-stone-950 hover:border-[#FFFC00]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.001 0C5.372 0 4.12 4.417 4.12 6.54c0 1.25.688 2.375 1.156 3.125.188.312.281.656.156 1.031-.156.469-.656.781-1.281 1.031-.594.25-1.406.563-1.406 1.344 0 .781.75 1.063 1.313 1.25.438.156.906.313 1.094.625.25.438.094 1.031-.156 1.656-.25.594-.594 1.406-.219 2.125.406.781 1.406 1.031 2.438 1.125 1.406.125 2.875.469 4.781 2.063 1.906-1.594 3.375-1.938 4.781-2.063 1.031-.094 2.031-.344 2.438-1.125.375-.719.031-1.531-.219-2.125-.25-.625-.406-1.219-.156-1.656.188-.313.656-.469 1.094-.625.563-.188 1.313-.469 1.313-1.25 0-.781-.813-1.094-1.406-1.344-.625-.25-1.125-.563-1.281-1.031-.125-.375-.031-.719.156-1.031.469-.75 1.156-1.875 1.156-3.125C19.88 4.417 18.629 0 12.001 0z" />
      </svg>
    ),
  },
  website: {
    id: 'website',
    name: 'الموقع الإلكتروني',
    brandColor: '#10B981',
    hoverBg: 'hover:bg-emerald-600 hover:text-white hover:border-emerald-600',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  email: {
    id: 'email',
    name: 'البريد الإلكتروني',
    brandColor: '#EA4335',
    hoverBg: 'hover:bg-[#EA4335] hover:text-white hover:border-[#EA4335]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  podcast: {
    id: 'podcast',
    name: 'بودكاست',
    brandColor: '#872EC4',
    hoverBg: 'hover:bg-[#872EC4] hover:text-white hover:border-[#872EC4]',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="2" />
        <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
      </svg>
    ),
  },
};

export function isValidSocialUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:')
  );
}

export function getPlatformConfig(platformKey: string): PlatformConfig {
  const normalized = (platformKey || '').trim().toLowerCase();
  if (PLATFORMS_CONFIG[normalized]) {
    return PLATFORMS_CONFIG[normalized];
  }
  return {
    id: normalized || 'generic',
    name: normalized || 'رابط خارجي',
    brandColor: '#059669',
    hoverBg: 'hover:bg-emerald-700 hover:text-white hover:border-emerald-700',
    icon: ({ className = 'w-4 h-4' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  };
}

interface SocialIconsProps {
  links: SocialLink[];
  className?: string;
  itemClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SocialIcons: React.FC<SocialIconsProps> = ({
  links,
  className = '',
  itemClassName = '',
  size = 'sm',
}) => {
  const validLinks = links.filter((l) => l.is_active && isValidSocialUrl(l.url));

  if (validLinks.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className={`flex items-center flex-wrap gap-1.5 ${className}`}>
      {validLinks.map((link) => {
        const config = getPlatformConfig(link.platform);
        const IconComponent = config.icon;

        return (
          <a
            key={link.id || `${link.platform}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={config.name}
            title={config.name}
            className={`rounded-full flex items-center justify-center border border-stone-200/90 dark:border-[#22302a] bg-white/80 dark:bg-[#151f1a]/80 text-stone-600 dark:text-[#9fb0a6] shadow-xs transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 ${config.hoverBg} ${sizeClasses} ${itemClassName}`}
          >
            <IconComponent className={iconSizes} />
          </a>
        );
      })}
    </div>
  );
};
