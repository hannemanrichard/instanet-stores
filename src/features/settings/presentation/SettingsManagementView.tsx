"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAnalyticsSettings, useUpdateSetting } from "../application";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import type { SettingKey } from "../domain";

const SETTING_KEYS: SettingKey[] = [
  "facebook_pixel_id",
  "tiktok_pixel_id",
  "google_analytics_id",
  "microsoft_clarity_id",
  "meta_conversion_api_access_token",
];

const isSettingKey = (key: string): key is SettingKey =>
  SETTING_KEYS.includes(key as SettingKey);

export const SettingsManagementView = () => {
  const t = useTranslations("dashboard.settings");
  const { data: settings, isLoading } = useAnalyticsSettings();
  const updateMutation = useUpdateSetting();
  const { toast } = useToast();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleChange = (key: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: SettingKey) => {
    const value = localValues[key] ?? settings?.find((s) => s.key === key)?.value ?? null;
    
    try {
      await updateMutation.mutateAsync({
        key,
        value: value || null,
      });
      
      toast({
        title: t("updatedTitle"),
        description: t("updatedDescription", { label: t(`labels.${key}`) }),
      });
      
      // Clear local value after successful save
      setLocalValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch {
      toast({
        title: t("errorTitle"),
        description: t("errorDescription"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="hidden text-3xl font-bold md:block">{t("title")}</h1>
        <p className="mt-2 hidden text-muted-foreground md:block">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-6">
        {settings?.map((setting) => {
          if (!isSettingKey(setting.key)) return null;

          const key = setting.key;
          const label = t(`labels.${key}`);
          const currentValue = localValues[key] ?? setting.value ?? "";
          const isDirty = localValues[key] !== undefined && localValues[key] !== (setting.value ?? "");

          return (
            <Card key={setting.key}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                {setting.description && (
                  <CardDescription>{setting.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={setting.key}>{label}</Label>
                    <Input
                      id={setting.key}
                      type={setting.key === "meta_conversion_api_access_token" ? "password" : "text"}
                      value={currentValue}
                      onChange={(e) => handleChange(setting.key, e.target.value)}
                      placeholder={t(`placeholders.${key}`)}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <Button
                    onClick={() => handleSave(key)}
                    disabled={!isDirty || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? t("saving") : t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
