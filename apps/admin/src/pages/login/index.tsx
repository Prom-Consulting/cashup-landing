import { LoginForm } from "@loal/app-kit";
import { Logo } from "@loal/ui/logo";
import { useNavigate } from "react-router";


export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-5 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] bg-paper p-7 sm:p-10">
        <Logo />
        <h1 className="display mt-6 text-[2rem]">Админка платформы</h1>
        <p className="mt-2 text-lg text-slate">Вход для сотрудников Loal.</p>
        <div className="mt-8">
          <LoginForm onDone={() => navigate("/", { replace: true })} />
        </div>
      </div>
    </div>
  );
}
