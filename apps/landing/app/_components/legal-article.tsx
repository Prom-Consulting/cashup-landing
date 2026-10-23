/**
 * Рендер юридического документа из простого текста (docs/additional). Формат
 * регулярный: первая строка — заголовок (его показывает страница как h1, здесь
 * пропускаем), строки вида «N. Название» — разделы (h2), «N.M. …» и прочее —
 * абзацы. Пустая строка разделяет блоки; одиночный перенос внутри блока
 * (реквизиты оператора) сохраняем как перенос строки.
 */
export function LegalArticle({ text }: { text: string }) {
  const body = text.replace(/\r\n/g, "\n").trim().split("\n").slice(1).join("\n").trim();
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="mt-10 flex max-w-[72ch] flex-col gap-5 text-[1.0625rem] leading-relaxed text-graphite/90">
      {blocks.map((block, i) => {
        // Раздел: одна строка «N. Заголовок» (без второго номера, как у «N.M.»)
        const isHeading = !block.includes("\n") && /^\d+\.\s+\D/.test(block);
        if (isHeading) {
          return (
            <h2 key={i} className="mt-6 text-xl font-bold text-graphite first:mt-0 sm:text-2xl">
              {block}
            </h2>
          );
        }
        const lines = block.split("\n");
        return (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
