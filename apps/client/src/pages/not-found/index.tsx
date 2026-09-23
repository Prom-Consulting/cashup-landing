import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="text-center">
      <h1 className="display text-[2rem]">Страница не найдена</h1>
      <Link to="/" className="mt-5 inline-block text-lg text-flame-ink underline underline-offset-4">
        К карте
      </Link>
    </div>
  );
}
