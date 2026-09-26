"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateClient } from "../actions";
import { useCloseDialogOnSuccess } from "@/lib/use-close-on-success";

type ClientForEdit = {
  id: string;
  type: "PERSON" | "COMPANY";
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  taxId: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  birthDate: Date | null;
};

export function EditClientDialog({ client }: { client: ClientForEdit }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"PERSON" | "COMPANY">(client.type);
  const [state, formAction, pending] = useActionState(updateClient, undefined);

  useCloseDialogOnSuccess(state, setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={client.id} />
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select name="type" value={type} onValueChange={(v) => setType(v as "PERSON" | "COMPANY")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSON">Persona física</SelectItem>
                <SelectItem value="COMPANY">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="type" value={type} />
          </div>

          {type === "PERSON" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" name="firstName" defaultValue={client.firstName ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" name="lastName" defaultValue={client.lastName ?? ""} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={client.birthDate ? client.birthDate.toISOString().slice(0, 10) : ""}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="companyName">Razón social</Label>
              <Input id="companyName" name="companyName" defaultValue={client.companyName ?? ""} required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="taxId">Cédula / RNC</Label>
            <Input id="taxId" name="taxId" defaultValue={client.taxId} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" defaultValue={client.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={client.phone ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={client.address ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" defaultValue={client.city ?? ""} />
            </div>
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
