



// ─── components/admin/ProductFormModal.tsx ────────────────────────────────────
// BR-07: ราคาขั้นต่ำ < ราคาทุน → บันทึกไม่ได้
import { useState, useEffect } from "react";
import type { FC, ChangeEvent } from "react";
import { Modal }     from "../Modal";
import { Alert }     from "../Alert";
import { Btn }       from "../Btn";
import { FieldWrap, Inp, Txa } from "../Form";
import { T, F }      from "../../styles/tokens";
import type { Product, Order, ProductFormData } from "../../types";

type FormErrors = Partial<Record<keyof ProductFormData | "image", string>>;

const emptyForm: ProductFormData = {
  name: "", imagePreview: null, description: "", cost: "", minPrice: "", stock: "",
};

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Product, "id">) => void;
  product: Product | null;
  orders: Order[];
}

export const ProductFormModal: FC<ProductFormModalProps> = ({ open, onClose, onSave, product, orders }) => {
  const [form,   setForm]   = useState<ProductFormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [warn,   setWarn]   = useState<string>("");

  useEffect(() => {
    setForm(product
      ? { name: product.name, imagePreview: product.imagePreview, description: product.description, cost: product.cost, minPrice: product.minPrice, stock: product.stock }
      : emptyForm
    );
    setErrors({});
    setWarn("");
  }, [product, open]);

  const set = <K extends keyof ProductFormData>(k: K, v: ProductFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleImg = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setErrors(er => ({ ...er, image: "ไฟล์ต้องเป็น JPG หรือ PNG เท่านั้น" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(er => ({ ...er, image: "ขนาดไฟล์ต้องไม่เกิน 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => set("imagePreview", ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrors(er => ({ ...er, image: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!String(form.name).trim()) e.name = "กรุณากรอกชื่อสินค้า";
    if (!form.cost || +form.cost <= 0) e.cost = "ราคาทุนต้องมากกว่า 0";
    if (!form.minPrice) e.minPrice = "กรุณากรอกราคาขั้นต่ำ";
    if (+form.minPrice < +form.cost) e.minPrice = "ราคาขั้นต่ำ < ราคาทุน ไม่ได้"; // BR-07
    if (form.stock === "" || +form.stock < 0) e.stock = "สต็อกต้อง >= 0";
    return e;
  };

  const handleSave = (): void => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (product && orders.some(o => o.productId === product.id && o.status === "pending")) {
      setWarn("มีออเดอร์ค้างอยู่ — บันทึกได้แต่ลบไม่ได้");
    }
    onSave({
      name: String(form.name),
      imagePreview: form.imagePreview,
      description: String(form.description),
      cost: +form.cost,
      minPrice: +form.minPrice,
      stock: +form.stock,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={product ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"} width={520}>
      {warn && <Alert type="warning" message={warn} onClose={() => setWarn("")} />}

      <FieldWrap label="ชื่อสินค้า" required error={errors.name}>
        <Inp value={String(form.name)} onChange={e => set("name", e.target.value)} placeholder="เช่น เสื้อยืดคอกลม สีดำ" error={errors.name} />
      </FieldWrap>

      <FieldWrap label="รูปสินค้า (JPG/PNG ≤ 5MB)" error={errors.image}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {form.imagePreview && (
            <div style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
              <img src={form.imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <label style={{ flex: 1, padding: "10px", background: T.bg, border: `1px dashed ${errors.image ? T.red : T.border}`, borderRadius: 8, color: T.muted, cursor: "pointer", fontSize: 13, textAlign: "center", ...F }}>
            {form.imagePreview ? "เปลี่ยนรูป" : "📁 คลิกเพื่ออัปโหลด"}
            <input type="file" accept="image/jpeg,image/png" onChange={handleImg} style={{ display: "none" }} />
          </label>
        </div>
      </FieldWrap>

      <FieldWrap label="รายละเอียด">
        <Txa value={String(form.description)} onChange={e => set("description", e.target.value)} placeholder="ไม่บังคับ" />
      </FieldWrap>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FieldWrap label="ราคาทุน (บาท)" required error={errors.cost}>
          <Inp type="number" value={String(form.cost)} onChange={e => set("cost", e.target.value)} placeholder="0" min="0" error={errors.cost} />
        </FieldWrap>
        <FieldWrap label="ราคาขั้นต่ำ (บาท)" required error={errors.minPrice}>
          <Inp type="number" value={String(form.minPrice)} onChange={e => set("minPrice", e.target.value)} placeholder="0" min="0" error={errors.minPrice} />
          {+form.minPrice >= +form.cost && +form.cost > 0 && (
            <p style={{ color: T.green, fontSize: 11, margin: "4px 0 0", ...F }}>
              กำไรขั้นต่ำ: ฿{(+form.minPrice - +form.cost).toLocaleString()}
            </p>
          )}
        </FieldWrap>
      </div>

      <FieldWrap label="จำนวนสต็อก" required error={errors.stock}>
        <Inp type="number" value={String(form.stock)} onChange={e => set("stock", e.target.value)} placeholder="0" min="0" error={errors.stock} />
      </FieldWrap>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>ยกเลิก</Btn>
        <Btn variant="primary" onClick={handleSave}>💾 บันทึก</Btn>
      </div>
    </Modal>
  );
};
