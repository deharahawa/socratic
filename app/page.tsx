export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        Socratic Forge
      </h1>
      <p className="max-w-md text-center text-sm text-zinc-400">
        Fundo Pitch Black (<span className="text-forge-xp">#050505</span>) e
        acentos:{" "}
        <span className="text-forge-discovery">discovery</span>,{" "}
        <span className="text-forge-handsOn">hands-on</span>,{" "}
        <span className="text-forge-noc">NOC</span>.
      </p>
    </main>
  );
}
