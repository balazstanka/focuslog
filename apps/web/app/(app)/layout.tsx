import { Navbar } from "@/components/navbar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col px-4 py-6">{children}</main>
    </>
  );
}
