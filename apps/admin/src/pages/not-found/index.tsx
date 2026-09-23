import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <h1 className="display text-[2.5rem]">Страница не найдена</h1>
        <Link to="/" className="mt-6 inline-block text-lg text-flame-ink underline underline-offset-4">
          В начало
        </Link>
      </div>
    </section>
  );
}
