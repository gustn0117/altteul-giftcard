import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const BUCKET = 'altteul-giftcard';
const ALLOWED = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json({ error: '허용되지 않는 파일 형식입니다. (jpg, png, gif, webp, svg)' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '파일 크기가 5MB를 초과합니다.' }, { status: 400 });
    }

    const folder = (formData.get('folder') as string) || 'uploads';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const supabase = createServiceClient();
    // schema 옵션 무시 - storage는 schema 독립적
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || '업로드에 실패했습니다.' }, { status: 500 });
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return NextResponse.json({ url: publicData.publicUrl, filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : '업로드에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 파일 삭제
export async function DELETE(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get('filename');
    if (!filename) return NextResponse.json({ error: 'filename 필요' }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase.storage.from(BUCKET).remove([filename]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '삭제에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
