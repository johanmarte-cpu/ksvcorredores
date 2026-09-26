import * as XLSX from "xlsx";

export type ClientImportKey =
  | "tipo"
  | "nombre"
  | "apellido"
  | "empresa"
  | "cedulaRnc"
  | "email"
  | "telefono"
  | "direccion"
  | "ciudad"
  | "fechaNacimiento";

type ColumnDef = { key: ClientImportKey; header: string; test: (normalized: string) => boolean };

const COLUMNS: ColumnDef[] = [
  { key: "tipo", header: "Tipo (Persona/Empresa)", test: (h) => h.includes("tipo") },
  { key: "nombre", header: "Nombre", test: (h) => h.includes("nombre") && !h.includes("empresa") },
  { key: "apellido", header: "Apellido", test: (h) => h.includes("apellido") },
  { key: "empresa", header: "Nombre de empresa", test: (h) => h.includes("nombre") && h.includes("empresa") },
  { key: "cedulaRnc", header: "Cédula/RNC", test: (h) => h.includes("cedula") || h.includes("rnc") },
  { key: "email", header: "Correo", test: (h) => h.includes("correo") || h.includes("email") },
  { key: "telefono", header: "Teléfono", test: (h) => h.includes("telefono") || h.includes("celular") },
  { key: "direccion", header: "Dirección", test: (h) => h.includes("direccion") },
  { key: "ciudad", header: "Ciudad", test: (h) => h.includes("ciudad") },
  { key: "fechaNacimiento", header: "Fecha de nacimiento (AAAA-MM-DD)", test: (h) => h.includes("nacimiento") },
];

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export type ParsedClientRow = {
  row: number;
  type: "PERSON" | "COMPANY";
  firstName?: string;
  lastName?: string;
  companyName?: string;
  taxId: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  birthDate?: Date;
};

export type ClientImportError = { row: number; message: string };

/** Parses an uploaded .xlsx/.xls/.csv buffer into client rows, tolerant of reordered or reworded (but not renamed-beyond-recognition) column headers. */
export function parseClientImportWorkbook(buffer: Buffer): { rows: ParsedClientRow[]; errors: ClientImportError[] } {
  // codepage 65001 (UTF-8) lets .csv files with accented characters parse correctly even without a BOM;
  // it's ignored for .xlsx/.xls, which carry their own encoding.
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, codepage: 65001 });
  const sheetName = workbook.SheetNames.find((n) => n.toLowerCase() !== "instrucciones") ?? workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: [{ row: 0, message: "El archivo no tiene hojas." }] };

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (raw.length === 0) return { rows: [], errors: [{ row: 0, message: "El archivo está vacío." }] };

  const headerRow = (raw[0] ?? []).map((h) => normalizeHeader(h));
  const columnIndex = new Map<ClientImportKey, number>();
  for (const col of COLUMNS) {
    const idx = headerRow.findIndex((h) => h && col.test(h));
    if (idx !== -1) columnIndex.set(col.key, idx);
  }

  const get = (line: unknown[], key: ClientImportKey): unknown => {
    const idx = columnIndex.get(key);
    if (idx === undefined) return "";
    const value = line[idx];
    return value === undefined || value === null ? "" : value;
  };
  const getString = (line: unknown[], key: ClientImportKey) => String(get(line, key)).trim();

  const rows: ParsedClientRow[] = [];
  const errors: ClientImportError[] = [];

  for (let i = 1; i < raw.length; i++) {
    const line = raw[i] ?? [];
    const rowNumber = i + 1; // 1 = header row, matches what a spreadsheet app shows

    const isEmpty = line.every((c) => c === "" || c === undefined || c === null);
    if (isEmpty) continue;

    const tipoRaw = normalizeHeader(get(line, "tipo"));
    let type: "PERSON" | "COMPANY" | null = null;
    if (tipoRaw.includes("empresa") || tipoRaw.includes("company") || tipoRaw.includes("juridic")) type = "COMPANY";
    else if (tipoRaw.includes("persona") || tipoRaw.includes("fisica") || tipoRaw.includes("person")) type = "PERSON";

    if (!type) {
      errors.push({ row: rowNumber, message: 'Tipo inválido: escribe "Persona" o "Empresa".' });
      continue;
    }

    const taxId = getString(line, "cedulaRnc");
    if (!taxId) {
      errors.push({ row: rowNumber, message: "La cédula/RNC es requerida." });
      continue;
    }

    const firstName = getString(line, "nombre");
    const lastName = getString(line, "apellido");
    const companyName = getString(line, "empresa");

    if (type === "PERSON" && !firstName) {
      errors.push({ row: rowNumber, message: "El nombre es requerido para personas físicas." });
      continue;
    }
    if (type === "COMPANY" && !companyName) {
      errors.push({ row: rowNumber, message: "El nombre de empresa es requerido." });
      continue;
    }

    const email = getString(line, "email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNumber, message: `Correo inválido: "${email}".` });
      continue;
    }

    let birthDate: Date | undefined;
    const birthRaw = get(line, "fechaNacimiento");
    if (birthRaw instanceof Date && !isNaN(birthRaw.getTime())) {
      birthDate = birthRaw;
    } else if (typeof birthRaw === "string" && birthRaw.trim()) {
      const parsed = new Date(birthRaw.trim());
      if (isNaN(parsed.getTime())) {
        errors.push({ row: rowNumber, message: `Fecha de nacimiento inválida: "${birthRaw}".` });
        continue;
      }
      birthDate = parsed;
    }

    rows.push({
      row: rowNumber,
      type,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      companyName: companyName || undefined,
      taxId,
      email: email || undefined,
      phone: getString(line, "telefono") || undefined,
      address: getString(line, "direccion") || undefined,
      city: getString(line, "ciudad") || undefined,
      birthDate,
    });
  }

  return { rows, errors };
}

/** Builds the downloadable sample workbook admins fill in and re-upload for bulk client import. */
export function buildClientImportTemplate(): Buffer {
  const headerRow = COLUMNS.map((c) => c.header);
  const exampleRows = [
    ["Persona", "Juan", "Pérez", "", "001-1234567-8", "juan.perez@example.com", "809-555-0101", "Calle Principal #12", "Santo Domingo", "1990-05-20"],
    ["Empresa", "", "", "Comercial Ejemplo SRL", "1-30-12345-6", "contacto@comercialejemplo.com", "809-555-0202", "Av. Central #45", "Santiago", ""],
  ];

  const sheet = XLSX.utils.aoa_to_sheet([headerRow, ...exampleRows]);
  sheet["!cols"] = headerRow.map((h) => ({ wch: Math.max(h.length, 18) }));

  const instructions = XLSX.utils.aoa_to_sheet([
    ["Instrucciones para la carga masiva de clientes"],
    [""],
    ["1. No cambies los nombres de las columnas en la hoja \"Clientes\"."],
    ["2. Tipo: escribe \"Persona\" o \"Empresa\"."],
    ["3. Para personas físicas completa Nombre y Apellido. Para empresas completa Nombre de empresa."],
    ["4. Cédula/RNC es obligatoria. Si ya existe un cliente con esa cédula/RNC, la fila se omite."],
    ["5. Fecha de nacimiento en formato AAAA-MM-DD (ej. 1990-05-20), opcional y solo aplica a personas físicas."],
    ["6. Puedes borrar las filas de ejemplo antes de subir tus datos reales."],
    ["7. Formatos aceptados para subir: .xlsx, .xls o .csv."],
  ]);
  instructions["!cols"] = [{ wch: 90 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Clientes");
  XLSX.utils.book_append_sheet(workbook, instructions, "Instrucciones");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
