import { redirect } from 'next/navigation';

// 블라인드(글 단위 잠금) 시스템은 폐기되고 회원별 연락처 열람 권한 시스템으로 대체됨
export default function Page() {
  redirect('/admin/grants');
}
