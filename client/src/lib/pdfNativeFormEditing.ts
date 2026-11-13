import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
} from "pdf-lib";

/**
 * Native AcroForm field values—not visible text overlays or PDF page text.
 * We never replace an unknown field, silently drop characters, or flatten
 * the original document to simulate a successful edit.
 */
export type NativeFormField =
  | { name: string; kind: "text"; value: string; readOnly: boolean }
  | { name: string; kind: "checkbox"; value: boolean; readOnly: boolean }
  | { name: string; kind: "dropdown" | "radio" | "list"; value: string; options: string[]; readOnly: boolean };

const FORM_LIMIT = 500;
const TEXT_LIMIT = 20000;

export async function inspectNativeFormFields(bytes: Uint8Array): Promise<NativeFormField[]> {
  const doc = await PDFDocument.load(bytes.slice());
  const fields = doc.getForm().getFields();
  if (fields.length > FORM_LIMIT) throw new Error("This PDF has too many form fields for browser-local editing.");
  const result: NativeFormField[] = [];
  for (const field of fields) {
    const name = field.getName();
    const readOnly = field.isReadOnly();
    if (field instanceof PDFTextField) {
      result.push({ name, kind: "text", value: field.getText() ?? "", readOnly });
    } else if (field instanceof PDFCheckBox) {
      result.push({ name, kind: "checkbox", value: field.isChecked(), readOnly });
    } else if (field instanceof PDFDropdown) {
      // Editable and multi-select dropdowns need a different UI contract.
      // A single-select dropdown must not erase values or free-form text.
      if (!field.isMultiselect() && !field.isEditable() && field.getSelected().length <= 1) {
        result.push({ name, kind: "dropdown", value: field.getSelected()[0] ?? "", options: field.getOptions(), readOnly });
      }
    } else if (field instanceof PDFRadioGroup) {
      result.push({ name, kind: "radio", value: field.getSelected() ?? "", options: field.getOptions(), readOnly });
    } else if (field instanceof PDFOptionList) {
      // A one-choice HTML select must not drop additional PDF selections.
      // Keep multiselect fields untouched until a dedicated multi-value UI exists.
      if (!field.isMultiselect() && field.getSelected().length <= 1) {
        result.push({ name, kind: "list", value: field.getSelected()[0] ?? "", options: field.getOptions(), readOnly });
      }
    }
    // Unsupported widgets remain intact in the original PDF.
  }
  return result;
}

export async function updateNativeFormField(
  bytes: Uint8Array,
  name: string,
  next: string | boolean,
): Promise<Uint8Array> {
  if (!name || name.length > 512) throw new Error("Invalid form field name.");
  const doc = await PDFDocument.load(bytes.slice());
  const form = doc.getForm();
  const field = form.getFields().find((item) => item.getName() === name);
  if (!field) throw new Error("Form field no longer exists in this PDF.");
  if (field.isReadOnly()) throw new Error("This PDF form field is read-only.");

  if (field instanceof PDFTextField) {
    if (typeof next !== "string" || next.length > TEXT_LIMIT) throw new Error("Invalid or oversized text value.");
    field.setText(next);
  } else if (field instanceof PDFCheckBox) {
    if (typeof next !== "boolean") throw new Error("Expected a checkbox value.");
    if (next) field.check();
    else field.uncheck();
  } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup || field instanceof PDFOptionList) {
    if (typeof next !== "string" || !field.getOptions().includes(next)) {
      throw new Error("Choose one of the existing PDF form options.");
    }
    if (field instanceof PDFDropdown && (field.isEditable() || field.isMultiselect())) {
      throw new Error("Editable or multi-select dropdowns are not supported by this single-value editor.");
    }
    if (field instanceof PDFOptionList && field.isMultiselect()) {
      throw new Error("Multi-select list boxes require a multi-value editor.");
    }
    field.select(next);
  } else {
    throw new Error("This PDF form field type is not supported for native editing.");
  }

  // No lossy transliteration. pdf-lib may throw if the existing appearance font
  // cannot encode a character: surface that error without replacing the source.
  const updated = await doc.save();
  const check = await PDFDocument.load(updated.slice());
  const saved = check.getForm().getFields().find((item) => item.getName() === name);
  let valid = false;
  if (saved instanceof PDFTextField) valid = saved.getText() === next;
  else if (saved instanceof PDFCheckBox) valid = saved.isChecked() === next;
  else if (saved instanceof PDFDropdown || saved instanceof PDFOptionList) {
    valid = typeof next === "string" && saved.getSelected().includes(next);
  } else if (saved instanceof PDFRadioGroup) valid = saved.getSelected() === next;
  if (!valid) throw new Error("Saved PDF form value failed verification; original document was preserved.");
  return updated;
}
