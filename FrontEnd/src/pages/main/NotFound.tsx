import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <img
          src="/errors_404.png"
          alt="404"
          className="w-full max-w-2xl h-auto object-contain mb-8"
          style={{ maxHeight: '60vh' }}
        />
        <Button onClick={() => navigate(-1)} size="lg">
          Назад
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
