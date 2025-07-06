import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const deepSpaceStyle = {
    backgroundColor: '#000011',
    backgroundImage: `
      radial-gradient(ellipse at 70% 30%, rgba(50, 80, 150, 0.15), transparent 50%),
      radial-gradient(ellipse at 20% 80%, rgba(120, 80, 150, 0.15), transparent 50%),
      radial-gradient(1px 1px at 10px 20px, white, transparent),
      radial-gradient(1px 1px at 40px 50px, white, transparent),
      radial-gradient(1.5px 1.5px at 90px 30px, white, transparent),
      radial-gradient(1px 1px at 150px 100px, white, transparent),
      radial-gradient(1.5px 1.5px at 200px 180px, white, transparent),
      radial-gradient(2px 2px at 300px 200px, #FFFFFF, transparent),
      radial-gradient(2.5px 2.5px at 500px 400px, #DDDDFF, transparent),
      radial-gradient(2px 2px at 550px 100px, #FFFFDD, transparent)
    `,
    backgroundRepeat: `
      no-repeat, no-repeat,
      repeat, repeat, repeat, repeat, repeat,
      repeat, repeat, repeat
    `,
    backgroundSize: `
      100% 100%, 100% 100%,
      250px 250px, 250px 250px, 250px 250px, 250px 250px, 250px 250px,
      650px 650px, 650px 650px, 650px 650px
    `
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0" style={deepSpaceStyle}></div>
      <div className="z-10 flex flex-row items-center justify-center gap-16 p-8">
        <img src="/satellite (2).png" alt="Satellite" className="w-[512px] h-auto" />
        <div className="text-left">
          <h1 className="text-8xl md:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-400 to-slate-200 mb-4">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-slate-300">
            Сигнал потерян
          </h2>
          <p className="text-slate-400 mb-8 max-w-md">
            Кажется, мы потеряли связь с этой страницей. Возможно, она вышла на другую орбиту.
          </p>
          <Button asChild size="lg" className="bg-sky-500 hover:bg-sky-600 text-white">
            <Link to="/">
              Вернуться на станцию
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
