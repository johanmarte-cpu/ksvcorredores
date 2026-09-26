import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import { PAYMENT_FREQUENCY_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";
import { PrintTrigger } from "./print-trigger";

export default async function PrintPaymentAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      client: true,
      insurer: true,
      product: true,
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!policy) notFound();

  const totalPaid = policy.payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = Number(policy.totalAmount) - totalPaid;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-[#0f1b2a] print:p-0">
      <PrintTrigger />

      <style>{`
        @page { size: letter; margin: 18mm 16mm; }
        @media print {
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <header className="flex items-start justify-between border-b-2 border-[#06336c] pb-4">
        <Image src="/logo-ksv.jpg" alt="KSV Corredores de Seguros" width={200} height={67} className="h-14 w-auto" priority />
        <div className="text-right">
          <h1 className="text-lg font-semibold text-[#06336c]">Acuerdo de Pago</h1>
          <p className="text-xs text-gray-500">Generado el {formatDate(new Date())}</p>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</h2>
          <p className="font-medium">{clientDisplayName(policy.client)}</p>
          <p>Cédula/RNC: {policy.client.taxId}</p>
          {policy.client.email && <p>{policy.client.email}</p>}
          {policy.client.phone && <p>{policy.client.phone}</p>}
        </div>
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Póliza</h2>
          <p>
            Número: <span className="font-medium">{policy.policyNumber}</span>
          </p>
          <p>Aseguradora: {policy.insurer.name}</p>
          <p>Producto: {policy.product.name}</p>
          <p>
            Vigencia: {formatDate(policy.startDate)} – {formatDate(policy.endDate)}
          </p>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-3 rounded-md border border-gray-200 p-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Prima</p>
          <p className="font-medium">{formatCurrency(policy.premium.toString())}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">ITBIS (16%)</p>
          <p className="font-medium">{formatCurrency(policy.itbisAmount.toString())}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total a pagar</p>
          <p className="text-base font-semibold text-[#06336c]">{formatCurrency(policy.totalAmount.toString())}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Plan de pagos ({PAYMENT_FREQUENCY_LABELS[policy.paymentFrequency]})
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 pr-2">Cuota</th>
              <th className="py-2 pr-2">Fecha de vencimiento</th>
              <th className="py-2 pr-2">Monto</th>
              <th className="py-2 pr-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {policy.payments.map((payment, index) => (
              <tr key={payment.id} className="border-b border-gray-200">
                <td className="py-2 pr-2">{index + 1}</td>
                <td className="py-2 pr-2">{formatDate(payment.dueDate)}</td>
                <td className="py-2 pr-2">{formatCurrency(payment.amount.toString())}</td>
                <td className="py-2 pr-2">{PAYMENT_STATUS_LABELS[payment.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex justify-end gap-8 text-sm">
          <p>
            Pagado: <span className="font-medium">{formatCurrency(totalPaid)}</span>
          </p>
          <p>
            Pendiente: <span className="font-medium">{formatCurrency(totalPending)}</span>
          </p>
        </div>
      </section>

      <p className="mt-8 text-xs text-gray-500">
        Este documento resume el acuerdo de pago entre el cliente y KSV Corredores de Seguros para la póliza indicada arriba. El
        incumplimiento de las fechas de pago puede afectar la vigencia de la cobertura según los términos de la aseguradora.
      </p>

      <section className="mt-16 grid grid-cols-2 gap-12 text-sm">
        <div>
          <div className="border-t border-gray-400 pt-2">Firma del cliente</div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-2">Firma del corredor</div>
        </div>
      </section>
    </div>
  );
}
