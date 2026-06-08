import { AppSidebar } from "@/components/app-sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1626 0%, #2F2935 45%, #1e1b2e 100%)",
      }}
    >
      {/* Orbs decorativos — fixos, atrás de tudo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #4342F5 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #7845F4 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 left-1/3 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #D7FE65 0%, transparent 70%)" }} />
      </div>
      <AppSidebar />
      <main className="relative flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
