import React, { useState } from "react";
import LayoutWithoutFooter from "@/components/LayoutWithoutFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Save } from "lucide-react";

const Settings = () => {
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
  });

  const handleAppearanceSave = () => {
    console.log("Сохранение настроек внешнего вида:", appearanceSettings);
  };

  return (
    <LayoutWithoutFooter>
      <div className="max-w-[1000px] mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Внешний вид
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label>Тема</label>
              <Select 
                value={appearanceSettings.theme} 
                onValueChange={(value) => setAppearanceSettings(prev => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Светлая</SelectItem>
                  <SelectItem value="dark">Темная</SelectItem>
                  <SelectItem value="system">Системная</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAppearanceSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWithoutFooter>
  );
};

export default Settings;