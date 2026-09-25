import { prisma } from "@/lib/prisma";
import { clientDisplayName } from "@/lib/format";
import { NewClaimForm } from "./new-claim-form";

export default async function NewClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ policyId?: string }>;
}) {
  const { policyId } = await searchParams;
  const policies = await prisma.policy.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nueva reclamación</h1>
      <NewClaimForm
        policies={policies.map((p) => ({ id: p.id, policyNumber: p.policyNumber, clientName: clientDisplayName(p.client) }))}
        defaultPolicyId={policyId}
      />
    </div>
  );
}
