import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, ShieldCheck, Lock } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const [name, setName] = useState("Ahmet Yılmaz");
  const [sicil, setSicil] = useState("THY-04821");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sicil.trim()) {
      setErr("Ad Soyad ve Sicil No alanlarını doldurun.");
      return;
    }
    login({ name: name.trim(), sicil: sicil.trim() });
    navigate(from, { replace: true });
  };

  const demoLogin = () => {
    login({ name: "Demo Kullanıcı", sicil: "DEMO-001" });
    navigate(from, { replace: true });
  };

  return (
    <div className="bg-command h-screen w-screen flex items-center justify-center text-white p-4">
      <form
        onSubmit={submit}
        className="glass rounded-2xl w-[400px] max-w-full p-8"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="w-16 h-16 mb-3" />
          <div className="text-2xl font-extrabold tracking-[0.15em]">
            ORB<span className="text-thy">IS</span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            Global Komuta Platformu · Personel Girişi
          </div>
        </div>

        {err && (
          <div className="mb-3 text-xs text-thy bg-thy/10 border border-thy/30 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <div className="space-y-3">
          <Field icon={User} label="Ad Soyad">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Ad Soyad"
              className="bg-transparent outline-none text-sm flex-1"
              placeholder="Ad Soyad"
            />
          </Field>
          <Field icon={ShieldCheck} label="Sicil No">
            <input
              value={sicil}
              onChange={(e) => setSicil(e.target.value)}
              aria-label="Sicil No"
              className="bg-transparent outline-none text-sm flex-1"
              placeholder="THY-00000"
            />
          </Field>
          <Field icon={Lock} label="Şifre">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              aria-label="Şifre"
              className="bg-transparent outline-none text-sm flex-1"
              placeholder="••••••••"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="w-full mt-5 py-2.5 rounded-xl bg-thy hover:bg-red-600 transition text-sm font-semibold"
        >
          Giriş Yap
        </button>

        <button
          type="button"
          onClick={demoLogin}
          className="w-full mt-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-sm font-medium text-white/70"
        >
          Demo ile Giriş
        </button>
      </form>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs text-white/55 mb-1 block">{label}</label>
      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-thy transition">
        <Icon size={15} className="text-white/50" />
        {children}
      </div>
    </div>
  );
}
