/**
 * Arabic error translator for Supabase errors
 */
export function translateSupabaseError(error: any): string {
  if (!error) return 'حدث خطأ غير متوقع';

  // Log full technical details to console for debugging
  console.error('[Supabase Technical Error Detail]:', error);

  const message = String(error.message || '').toLowerCase();
  const code = String(error.code || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();

  // Network / Connection errors
  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network') ||
    message.includes('timeout')
  ) {
    return 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت';
  }

  // Missing table, column, relation or storage bucket
  if (
    code === '42p01' || // relation does not exist
    code === '42703' || // column does not exist
    code === 'pgrst204' || // column not found in schema cache
    code === 'pgrst200' || // relationship not found
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('bucket not found') ||
    message.includes('bucket') && message.includes('does not exist')
  ) {
    return 'إعداد قاعدة البيانات غير مكتمل';
  }

  // Permission / RLS errors
  if (
    code === '42501' ||
    message.includes('permission denied') ||
    message.includes('row-level security') ||
    message.includes('not authorized') ||
    message.includes('jwt')
  ) {
    return 'ليس لديك صلاحية لتنفيذ هذه العملية';
  }

  // Duplicate unique constraint (e.g. slug)
  if (code === '23505' || message.includes('duplicate key') || message.includes('already exists')) {
    if (message.includes('slug') || details.includes('slug')) {
      return 'الرابط المختصر (slug) مستخدم بالفعل، يرجى اختيار رابط آخر';
    }
    return 'البيانات المدخلة مكررة ومسجلة مسبقاً';
  }

  // Foreign key constraint (e.g. category has series)
  if (code === '23503' || message.includes('foreign key constraint')) {
    return 'لا يمكن حذف هذا القسم لأنه يحتوي على سلاسل علمية مرتبطة به';
  }

  // Auth credential error
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }

  return 'حدث خطأ أثناء معالجة البيانات، يرجى المحاولة مرة أخرى';
}
