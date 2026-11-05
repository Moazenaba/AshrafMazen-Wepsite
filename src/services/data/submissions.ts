// Visitor requests (suggestions, corrections, removals) and the admin review.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';

export type SubmissionKind = 'book' | 'audio' | 'video' | 'correction' | 'removal';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  kind: SubmissionKind;
  title: string;
  url: string;
  author: string;
  details: string;
  target: string;
  contact: string;
  status: SubmissionStatus;
  admin_note: string;
  created_at: string;
  reviewed_at: string | null;
}

export async function getSubmissions(status?: SubmissionStatus): Promise<Submission[]> {
  let query = supabase.from('submissions').select('*').order('created_at', { ascending: false }).limit(300);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new Error(translateSupabaseError(error));
  return data || [];
}

export async function getPendingSubmissionsCount(): Promise<number> {
  const { count, error } = await supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  if (error) return 0;
  return count || 0;
}

export async function reviewSubmission(id: string, status: SubmissionStatus, adminNote = ''): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ status, admin_note: adminNote.trim().slice(0, 1000), reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
}

export async function deleteSubmission(id: string): Promise<void> {
  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) throw new Error(translateSupabaseError(error));
}
