"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { upsertKnowledgeForm } from "../knowledge-form-actions";
import {
  THIRD_PARTY_TYPE_LABELS,
  ID_TYPE_LABELS,
  SEX_LABELS,
  CORRESPONDENCE_ADDRESS_LABELS,
  ECONOMIC_ACTIVITY_LABELS,
  MONTHLY_INCOME_RANGE_LABELS,
  INSURANCE_BRANCH_LABELS,
  RISK_LEVEL_LABELS,
  DUE_DILIGENCE_TYPE_LABELS,
} from "@/lib/labels";

type KnowledgeFormData = Record<string, unknown> & { thirdPartyTypes?: string[] };

type BeneficialOwnerData = {
  id?: string;
  fullName: string;
  idType: string | null;
  idNumber: string | null;
  ownershipPercent: string | null;
  isPep: boolean | null;
  isPepDetail: string | null;
};

function toDateInput(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function toBoolString(value: unknown) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

export function KnowledgeForm({
  clientId,
  clientType,
  data,
  beneficialOwners,
}: {
  clientId: string;
  clientType: string;
  data: KnowledgeFormData | null;
  beneficialOwners: BeneficialOwnerData[];
}) {
  const [state, formAction, pending] = useActionState(upsertKnowledgeForm, undefined);
  const d = data ?? {};
  const checkedTypes = new Set(d.thirdPartyTypes ?? []);

  const [riskLevel, setRiskLevel] = useState((d.riskLevel as string) || "");
  const [isPep, setIsPep] = useState(toBoolString(d.isPep));
  const [relativeIsPep, setRelativeIsPep] = useState(toBoolString(d.relativeIsPep));
  const requiresEnhancedDiligence = riskLevel === "ALTO" || isPep === "true" || relativeIsPep === "true";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="clientId" value={clientId} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de tercero</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {Object.entries(THIRD_PARTY_TYPE_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <Checkbox name="thirdPartyTypes" value={value} defaultChecked={checkedTypes.has(value)} />
              {label}
            </label>
          ))}
          <div className="w-full max-w-xs space-y-1">
            <Label htmlFor="branch">Sucursal</Label>
            <Input id="branch" name="branch" defaultValue={String(d.branch ?? "")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información básica</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Tipo de identificación</Label>
            <Select name="idType" defaultValue={(d.idType as string) || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="idNumber">Número</Label>
            <Input id="idNumber" name="idNumber" defaultValue={String(d.idNumber ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="idExpirationDate">Fecha vencimiento</Label>
            <Input id="idExpirationDate" name="idExpirationDate" type="date" defaultValue={toDateInput(d.idExpirationDate)} />
          </div>
          <div className="space-y-1">
            <Label>Sexo</Label>
            <Select name="sex" defaultValue={(d.sex as string) || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEX_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
            <Input id="birthDate" name="birthDate" type="date" defaultValue={toDateInput(d.birthDate)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nationality">Nacionalidad</Label>
            <Input id="nationality" name="nationality" defaultValue={String(d.nationality ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="birthCity">Ciudad de nacimiento</Label>
            <Input id="birthCity" name="birthCity" defaultValue={String(d.birthCity ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="birthProvince">Provincia de nacimiento</Label>
            <Input id="birthProvince" name="birthProvince" defaultValue={String(d.birthProvince ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profession">Profesión</Label>
            <Input id="profession" name="profession" defaultValue={String(d.profession ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="occupation">Ocupación/Cargo</Label>
            <Input id="occupation" name="occupation" defaultValue={String(d.occupation ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employer">Empresa</Label>
            <Input id="employer" name="employer" defaultValue={String(d.employer ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employerPhone">Teléfono del trabajo</Label>
            <Input id="employerPhone" name="employerPhone" defaultValue={String(d.employerPhone ?? "")} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="employerAddress">Dirección donde labora</Label>
            <Input id="employerAddress" name="employerAddress" defaultValue={String(d.employerAddress ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employerCity">Ciudad</Label>
            <Input id="employerCity" name="employerCity" defaultValue={String(d.employerCity ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="employerProvince">Provincia</Label>
            <Input id="employerProvince" name="employerProvince" defaultValue={String(d.employerProvince ?? "")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domicilio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="residenceCity">Ciudad residencia</Label>
            <Input id="residenceCity" name="residenceCity" defaultValue={String(d.residenceCity ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residenceProvince">Provincia</Label>
            <Input id="residenceProvince" name="residenceProvince" defaultValue={String(d.residenceProvince ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residenceCountry">País</Label>
            <Input id="residenceCountry" name="residenceCountry" defaultValue={String(d.residenceCountry ?? "República Dominicana")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residencePhone">Teléfono</Label>
            <Input id="residencePhone" name="residencePhone" defaultValue={String(d.residencePhone ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="residenceCell">Celular</Label>
            <Input id="residenceCell" name="residenceCell" defaultValue={String(d.residenceCell ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" name="sector" defaultValue={String(d.sector ?? "")} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="residenceAddress">Dirección residencia</Label>
            <Input id="residenceAddress" name="residenceAddress" defaultValue={String(d.residenceAddress ?? "")} />
          </div>
          <div className="space-y-1">
            <Label>Enviar correspondencia a</Label>
            <Select name="correspondenceAddress" defaultValue={(d.correspondenceAddress as string) || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CORRESPONDENCE_ADDRESS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad económica</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Actividad</Label>
            <Select name="economicActivity" defaultValue={(d.economicActivity as string) || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ECONOMIC_ACTIVITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="economicActivityOther">Si es &quot;Otro&quot;, ¿cuál?</Label>
            <Input id="economicActivityOther" name="economicActivityOther" defaultValue={String(d.economicActivityOther ?? "")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información financiera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Ingresos mensuales actividad principal</Label>
              <Select name="monthlyIncomeRange" defaultValue={(d.monthlyIncomeRange as string) || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MONTHLY_INCOME_RANGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="otherIncomeAmount">Otros ingresos promedio mensual (RD$)</Label>
              <Input
                id="otherIncomeAmount"
                name="otherIncomeAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={d.otherIncomeAmount != null ? String(d.otherIncomeAmount) : ""}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="otherIncomeDescription">Descripción actividad económica secundaria</Label>
            <Textarea id="otherIncomeDescription" name="otherIncomeDescription" defaultValue={String(d.otherIncomeDescription ?? "")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debida diligencia (PEP)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <YesNoField
            question="¿Ha manejado o maneja recursos públicos durante los últimos 3 años?"
            name="hasManagedPublicFunds"
            detailName="hasManagedPublicFundsDetail"
            value={toBoolString(d.hasManagedPublicFunds)}
            detailValue={String(d.hasManagedPublicFundsDetail ?? "")}
          />
          <YesNoField
            question="¿Ha poseído o posee algún grado de poder público durante los últimos 3 años?"
            name="hasHeldPublicOffice"
            detailName="hasHeldPublicOfficeDetail"
            value={toBoolString(d.hasHeldPublicOffice)}
            detailValue={String(d.hasHeldPublicOfficeDetail ?? "")}
          />
          <YesNoField
            question="¿Es persona reconocida o de influencia pública?"
            name="isPep"
            detailName="isPepDetail"
            value={isPep}
            onValueChange={setIsPep}
            detailValue={String(d.isPepDetail ?? "")}
          />
          <YesNoField
            question="¿Es afirmativa alguna de las preguntas anteriores para su cónyuge, padres, abuelos, hijos, nietos, suegros, nueras o yernos?"
            name="relativeIsPep"
            detailName="relativeIsPepDetail"
            value={relativeIsPep}
            onValueChange={setRelativeIsPep}
            detailValue={String(d.relativeIsPepDetail ?? "")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debida diligencia</CardTitle>
          <CardDescription>
            Ley 155-17 y Guía de Debida Diligencia UAF-CONCLAFIT. Aplica principalmente a seguros de vida y seguros con
            componente de inversión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Nivel de riesgo</Label>
              <Select value={riskLevel} onValueChange={setRiskLevel} name="riskLevel">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Considera: tipo de cliente, producto/servicio, zona geográfica y canal de distribución.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Tipo de debida diligencia aplicada</Label>
              <Select name="diligenceType" defaultValue={(d.diligenceType as string) || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DUE_DILIGENCE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="riskFactorsDetail">Factores de riesgo considerados</Label>
            <Textarea id="riskFactorsDetail" name="riskFactorsDetail" defaultValue={String(d.riskFactorsDetail ?? "")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="businessRelationshipPurpose">Propósito y naturaleza de la relación comercial</Label>
            <Textarea
              id="businessRelationshipPurpose"
              name="businessRelationshipPurpose"
              defaultValue={String(d.businessRelationshipPurpose ?? "")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="sourceOfFunds">Origen de fondos</Label>
              <Textarea
                id="sourceOfFunds"
                name="sourceOfFunds"
                placeholder="Actividad que genera los fondos y cómo se acumularon"
                defaultValue={String(d.sourceOfFunds ?? "")}
              />
            </div>
            <div className="space-y-1">
              <Label>¿Sustentado con documentos?</Label>
              <Select name="sourceOfFundsDocumented" defaultValue={toBoolString(d.sourceOfFundsDocumented) || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Verificado en listas ONU (Consejo de Seguridad)</Label>
              <Select name="sanctionsListChecked" defaultValue={toBoolString(d.sanctionsListChecked) || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sanctionsListCheckedDate">Fecha de verificación</Label>
              <Input
                id="sanctionsListCheckedDate"
                name="sanctionsListCheckedDate"
                type="date"
                defaultValue={toDateInput(d.sanctionsListCheckedDate)}
              />
            </div>
            <div className="space-y-1">
              <Label>Revisión en prensa/internet</Label>
              <Select name="adverseMediaChecked" defaultValue={toBoolString(d.adverseMediaChecked) || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1 md:max-w-xs">
            <Label htmlFor="nextReviewDate">Próxima actualización</Label>
            <Input id="nextReviewDate" name="nextReviewDate" type="date" defaultValue={toDateInput(d.nextReviewDate)} />
          </div>

          {requiresEnhancedDiligence && (
            <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                Debida diligencia ampliada requerida (riesgo alto y/o cliente/relacionado es PEP)
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="seniorManagementApproved" defaultChecked={d.seniorManagementApproved === true} />
                Aprobado por alta gerencia
              </label>
              <div className="space-y-1">
                <Label htmlFor="ongoingMonitoringNotes">Notas de monitoreo continuo</Label>
                <Textarea
                  id="ongoingMonitoringNotes"
                  name="ongoingMonitoringNotes"
                  defaultValue={String(d.ongoingMonitoringNotes ?? "")}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {clientType === "COMPANY" && <BeneficialOwnersSection initialOwners={beneficialOwners} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitud de seguro</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Ramo</Label>
            <Select name="insuranceBranch" defaultValue={(d.insuranceBranch as string) || undefined}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSURANCE_BRANCH_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="insuranceBranchOther">Si es &quot;Otro&quot;, especifique</Label>
            <Input id="insuranceBranchOther" name="insuranceBranchOther" defaultValue={String(d.insuranceBranchOther ?? "")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verificación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="verificationDate">Fecha</Label>
            <Input id="verificationDate" name="verificationDate" type="date" defaultValue={toDateInput(d.verificationDate)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="verifierCode">Código del corredor/agente/empleado que verifica</Label>
            <Input id="verifierCode" name="verifierCode" defaultValue={String(d.verifierCode ?? "")} />
          </div>
        </CardContent>
      </Card>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar formulario"}
        </Button>
        {state?.success && <span className="text-sm text-primary">Guardado.</span>}
      </div>
    </form>
  );
}

function YesNoField({
  question,
  name,
  detailName,
  value,
  detailValue,
  onValueChange,
}: {
  question: string;
  name: string;
  detailName: string;
  value: string;
  detailValue: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b pb-4 last:border-b-0 last:pb-0 md:grid-cols-3">
      <p className="text-sm md:col-span-1">{question}</p>
      <div className="space-y-1">
        <Select
          name={name}
          {...(onValueChange ? { value, onValueChange } : { defaultValue: value || undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Sí</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Input name={detailName} placeholder="Especifique (si aplica)" defaultValue={detailValue} />
      </div>
    </div>
  );
}

let ownerRowKey = 0;

type OwnerRow = {
  key: number;
  fullName: string;
  idType: string;
  idNumber: string;
  ownershipPercent: string;
  isPep: string;
  isPepDetail: string;
};

function emptyOwnerRow(): OwnerRow {
  return { key: ownerRowKey++, fullName: "", idType: "", idNumber: "", ownershipPercent: "", isPep: "", isPepDetail: "" };
}

function BeneficialOwnersSection({ initialOwners }: { initialOwners: BeneficialOwnerData[] }) {
  const [rows, setRows] = useState<OwnerRow[]>(() =>
    initialOwners.length > 0
      ? initialOwners.map((o) => ({
          key: ownerRowKey++,
          fullName: o.fullName ?? "",
          idType: o.idType ?? "",
          idNumber: o.idNumber ?? "",
          ownershipPercent: o.ownershipPercent ?? "",
          isPep: toBoolString(o.isPep),
          isPepDetail: o.isPepDetail ?? "",
        }))
      : [emptyOwnerRow()],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Beneficiario final</CardTitle>
        <CardDescription>
          Persona física que ejerce control efectivo o posee al menos el 20% del capital de la empresa (Guía UAF-CONCLAFIT).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.key} className="grid grid-cols-1 gap-3 border-b pb-4 last:border-b-0 last:pb-0 md:grid-cols-6">
            <div className="space-y-1 md:col-span-2">
              <Label>Nombre completo</Label>
              <Input name="boFullName" defaultValue={row.fullName} />
            </div>
            <div className="space-y-1">
              <Label>Tipo ID</Label>
              <Select name="boIdType" defaultValue={row.idType || undefined}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Número</Label>
              <Input name="boIdNumber" defaultValue={row.idNumber} />
            </div>
            <div className="space-y-1">
              <Label>% Participación</Label>
              <Input name="boOwnershipPercent" type="number" step="0.01" min="0" max="100" defaultValue={row.ownershipPercent} />
            </div>
            <div className="flex items-end gap-2 md:col-span-1">
              <div className="flex-1 space-y-1">
                <Label>¿Es PEP?</Label>
                <Select name="boIsPep" defaultValue={row.isPep || undefined}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setRows((r) => r.filter((_, i) => i !== index))}
                aria-label="Quitar beneficiario"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1 md:col-span-5">
              <Label>Detalle si es PEP</Label>
              <Input name="boIsPepDetail" defaultValue={row.isPepDetail} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, emptyOwnerRow()])}>
          <Plus className="mr-1 h-4 w-4" /> Agregar beneficiario
        </Button>
      </CardContent>
    </Card>
  );
}
