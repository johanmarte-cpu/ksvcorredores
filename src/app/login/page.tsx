"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuroraBackground } from "@/components/effects/aurora-background";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <AuroraBackground className="flex items-center justify-center px-4 py-12">
      {/* CSS animation (not framer-motion) so the form is visible even before/without JS. */}
      <div className="w-full max-w-sm animate-in space-y-6 fade-in slide-in-from-bottom-6 fill-mode-backwards duration-700 ease-out motion-reduce:animate-none">
        <div className="flex justify-center rounded-2xl bg-white px-8 py-6 shadow-lg">
          <Image src="/logo-ksv.jpg" alt="KSV Corredores de Seguros" width={280} height={94} className="h-16 w-auto" priority />
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Bienvenido</CardTitle>
            <CardDescription>Inicia sesión para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" placeholder="nombre@empresa.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-white/70">KSV Corredores de Seguros</p>
      </div>
    </AuroraBackground>
  );
}
