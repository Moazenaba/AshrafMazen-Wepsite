export type FileKind = 'pdf' | 'cover' | 'audio' | 'logo' | 'hero' | 'video';
export const FILE_RULES: Record<FileKind, { folder: string; extensions: string[]; maxMb: number; type: string }>;
export const acceptOf: (kind: FileKind) => string;
export const describeRule: (kind: FileKind) => string;
export const checkFile: (kind: FileKind, name: string, size: number) => string | null;
