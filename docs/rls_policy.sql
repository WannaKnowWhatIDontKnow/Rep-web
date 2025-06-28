-- 읽기 정책 (사용자는 자신의 데이터만 읽을 수 있음)
CREATE POLICY "사용자는 자신의 데이터만 읽을 수 있음" ON "public"."reps"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 쓰기 정책 (사용자는 자신의 데이터만 추가할 수 있음)
CREATE POLICY "사용자는 자신의 데이터만 추가할 수 있음" ON "public"."reps"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 수정 정책 (사용자는 자신의 데이터만 수정할 수 있음)
CREATE POLICY "사용자는 자신의 데이터만 수정할 수 있음" ON "public"."reps"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 삭제 정책 (사용자는 자신의 데이터만 삭제할 수 있음)
CREATE POLICY "사용자는 자신의 데이터만 삭제할 수 있음" ON "public"."reps"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
