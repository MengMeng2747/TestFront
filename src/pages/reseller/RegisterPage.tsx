// ─── pages/reseller/RegisterPage.tsx ──────────────────────────────────────────
// BR-12: สมัครสำเร็จ → status=pending แสดงหน้ารอ
// BR-13: Email ซ้ำ → error
// BR-14: ชื่อร้านซ้ำ → error
import { useState } from "react";
import type { FC } from "react";
import { FieldWrap, Inp, Txa } from "../../components/Form";
import { T, F }               from "../../styles/tokens";
import type { ResellerUser }  from "../../types";

interface RegisterPageProps {
  onRegister:          (u: ResellerUser) => void;
  onGoLogin:           () => void;
  existingResellers:   ResellerUser[];
}

export const RegisterPage: FC<RegisterPageProps> = ({ onRegister, onGoLogin, existingResellers }) => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", shopName: "", address: "", password: "", confirmPassword: "",
  });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "กรุณากรอกชื่อ-นามสกุล";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = "รูปแบบ Email ไม่ถูกต้อง";
    if (existingResellers.some(r => r.email === form.email)) e.email = "อีเมลนี้ถูกใช้งานแล้ว";       // BR-13
    if (!form.phone || !/^\d{10}$/.test(form.phone.replace(/-/g, ""))) e.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลัก";
    if (!form.shopName.trim()) e.shopName = "กรุณากรอกชื่อร้านค้า";
    const slug = form.shopName.toLowerCase().replace(/\s+/g, "");
    if (existingResellers.some(r => r.shopSlug === slug)) e.shopName = "ชื่อร้านนี้ถูกใช้แล้ว";        // BR-14
    if (!form.address.trim()) e.address = "กรุณากรอกที่อยู่";
    if (!form.password || form.password.length < 8) e.password = "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร";
    if (form.password !== form.confirmPassword) e.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    return e;
  };

  const handleSubmit = (): void => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newUser: ResellerUser = {
        id: Date.now(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        shopName: form.shopName,
        shopSlug: form.shopName.toLowerCase().replace(/\s+/g, ""),
        address: form.address,
        status: "pending",        // BR-12
        password: form.password,
      };
      onRegister(newUser);
    }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(88,166,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(88,166,255,.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ width: 480, position: "relative", zIndex: 1 }}>
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: "0 24px 64px rgba(0,0,0,.5)", overflow: "hidden" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,#58a6ff,#bc8cff,transparent)` }} />
          <div style={{ padding: "28px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
              <h1 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 4px", ...F }}>สมัครเป็นตัวแทนขาย</h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FieldWrap label="ชื่อ-นามสกุล" required error={errors.name}>
                <Inp value={form.name} onChange={e => set("name", e.target.value)} placeholder="ชื่อ นามสกุล" error={errors.name} />
              </FieldWrap>
              <FieldWrap label="เบอร์โทรศัพท์" required error={errors.phone}>
                <Inp value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0812345678" error={errors.phone} />
              </FieldWrap>
            </div>

            <FieldWrap label="Email" required error={errors.email}>
              <Inp type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="your@email.com" error={errors.email} />
            </FieldWrap>

            <FieldWrap label="ชื่อร้านค้า" required error={errors.shopName}>
              <Inp value={form.shopName} onChange={e => set("shopName", e.target.value)} placeholder="MyShop (ใช้เป็น URL ร้าน)" error={errors.shopName} />
              {form.shopName && !errors.shopName && (
                <p style={{ color: T.accent, fontSize: 11, margin: "4px 0 0", ...F }}>
                  URL ร้านของคุณ: /shop/{form.shopName.toLowerCase().replace(/\s+/g, "")}
                </p>
              )}
            </FieldWrap>

            <FieldWrap label="ที่อยู่" required error={errors.address}>
              <Txa value={form.address} onChange={e => set("address", e.target.value)} placeholder="ที่อยู่สำหรับติดต่อ" error={errors.address} style={{ minHeight: 60 }} />
            </FieldWrap>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FieldWrap label="รหัสผ่าน (≥ 8 ตัว)" required error={errors.password}>
                <Inp type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" error={errors.password} />
              </FieldWrap>
              <FieldWrap label="ยืนยันรหัสผ่าน" required error={errors.confirmPassword}>
                <Inp type="password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="••••••••" error={errors.confirmPassword} />
              </FieldWrap>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: 11, background: loading ? "rgba(88,166,255,.3)" : T.accent, border: "none", borderRadius: 9, color: loading ? T.muted : "#0d1117", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", ...F, marginTop: 4 }}>
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก →"}
            </button>

            <p style={{ textAlign: "center", color: T.muted, fontSize: 13, marginTop: 16, ...F }}>
              มีบัญชีแล้ว?{" "}
              <button onClick={onGoLogin} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, padding: 0, ...F }}>
                เข้าสู่ระบบ
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
