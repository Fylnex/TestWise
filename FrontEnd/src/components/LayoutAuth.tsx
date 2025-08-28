interface LayoutAuthProps {
  children: React.ReactNode;
}

const LayoutAuth = ({ children }: LayoutAuthProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-grow flex items-center justify-center">
        {children}
      </main>
    </div>
  );
};

export default LayoutAuth;
