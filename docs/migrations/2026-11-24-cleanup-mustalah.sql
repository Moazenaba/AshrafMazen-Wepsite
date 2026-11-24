-- تنظيف بيانات (مرة واحدة، وآمن عند إعادة التشغيل):
-- 1) حذف سلسلة التجربة «tessst» (لا دروس فيها).
-- 2) دمج قسمَي «المصطلح» (mustalah) و«مصطلح الحديث» (مصطلح-الحديث): يبقى القسم mustalah برابطه /category/mustalah
--    ويصير اسمه «مصطلح الحديث»، ويُحذف القسم المكرر بعد نقل أي سلسلة فيه.
-- يتوقف كله دون أي تغيير لو وجد في «tessst» درساً.

begin;

do $$
declare
  test_series uuid := 'c282d4f1-cb28-48e2-bff5-a9fba5a793bc';  -- tessst
  keep_cat    uuid := 'f5c7b381-6dc7-4df1-8611-1362f3d3cd54';  -- mustalah (يبقى)
  dup_cat     uuid := 'e432dff3-bc51-4d45-8487-c72e5cea47b8';  -- مصطلح-الحديث (يُحذف)
begin
  if exists (select 1 from lessons where series_id = test_series) then
    raise exception 'السلسلة tessst فيها دروس: لم يُحذف شيء. انقل دروسها أولاً.';
  end if;

  delete from series where id = test_series;

  -- أي سلسلة أخرى في القسم المكرر تنتقل إلى القسم الباقي (لا تضيع)
  update series set category_id = keep_cat where category_id = dup_cat;
  delete from categories where id = dup_cat;

  update categories set name = 'مصطلح الحديث' where id = keep_cat;
end $$;

commit;

-- للتأكد: يجب أن يظهر قسم واحد اسمه «مصطلح الحديث» برابط mustalah، ولا سلسلة باسم tessst
select slug, name, sort_order from categories order by sort_order;
select slug, title from series order by sort_order;
