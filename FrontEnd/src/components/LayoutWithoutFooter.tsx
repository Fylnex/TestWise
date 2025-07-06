import Header from "@/components/Header";

interface LayoutWithoutFooterProps {
  children: React.ReactNode;
}

const LayoutWithoutFooter = ({ children }: LayoutWithoutFooterProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow pb-32">
        {children}
      </main>
    </div>
  );
};

export default LayoutWithoutFooter; 