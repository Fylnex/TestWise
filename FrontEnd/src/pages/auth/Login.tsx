import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import LayoutAuth from "@/components/LayoutAuth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Явно предотвращаем перезагрузку
    setError("");

    try {
      console.log("Attempting login with", { username, password });
      const success = await login(username, password);
      if (success) {
        console.log("Login successful, navigating to /");
        navigate("/", { replace: true });
      } else {
        setError("Неверное имя пользователя или пароль");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Произошла ошибка при входе");
      console.error("Login error:", err);
    }
  };

  return (
    <LayoutAuth>
      <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Вход в систему</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </Card>
    </LayoutAuth>
  );
};

export default Login;