import { Container } from "@/components/layout/container";
import { WorkspaceGate } from "@/features/dashboard/workspace-gate";
import { WorkspaceNav } from "@/features/dashboard/workspace-nav";
import { approvalLabel } from "@/features/dashboard/workspace-gate";
import { loadWorkspace } from "@/features/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return (
      <Container as="section" className="py-12 md:py-16">
        <h1 className="font-serif text-4xl text-forest-900">Producer workspace</h1>
        <WorkspaceGate workspace={workspace} />
      </Container>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 md:grid-cols-[220px_minmax(0,1fr)] md:px-8 md:py-10">
      <WorkspaceNav name={workspace.business.name} approval={approvalLabel(workspace.business.approval)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
