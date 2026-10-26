import { redirect } from "next/navigation";

// Короткая реферальная ссылка «приведи заведение» (loal.kg/r/{code}) ведёт на
// форму «Бизнесу» с подставленным кодом реферера. Страница не индексируется —
// это редирект, не контент.
export const metadata = { robots: { index: false, follow: false } };

export default async function BusinessReferralRedirect({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  redirect(`/become-partner?ref=${encodeURIComponent(code.slice(0, 64))}#form`);
}
