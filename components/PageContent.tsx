/**
 * 관리자가 입력한 페이지 내용을 화면에 그린다.
 *
 * 작성 규칙 (관리자 편집 화면에도 동일하게 안내):
 *   # 제목        → 소제목
 *   - 항목        → 점 목록
 *   그냥 텍스트    → 문단
 *   빈 줄         → 문단 구분
 *
 * HTML 을 넣을 수 없게 텍스트로만 렌더한다(보안).
 */
export default function PageContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = (k: string) => {
    if (!para.length) return;
    blocks.push(
      <p key={k} className="text-[13px] text-zinc-600 leading-relaxed whitespace-pre-line">
        {para.join('\n')}
      </p>,
    );
    para = [];
  };
  const flushList = (k: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={k} className="list-disc pl-5 space-y-1 text-[13px] text-zinc-600 leading-relaxed">
        {list.map((it, i) => <li key={i}>{it}</li>)}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) {
      flushPara(`p${i}`); flushList(`l${i}`);
      blocks.push(
        <h2 key={`h${i}`} className="text-[14.5px] font-bold text-zinc-900 pt-2">
          {line.slice(2).trim()}
        </h2>,
      );
    } else if (line.startsWith('- ')) {
      flushPara(`p${i}`);
      list.push(line.slice(2).trim());
    } else if (line.trim() === '') {
      flushPara(`p${i}`); flushList(`l${i}`);
    } else {
      flushList(`l${i}`);
      para.push(line);
    }
  });
  flushPara('pE'); flushList('lE');

  return <div className="space-y-3">{blocks}</div>;
}
