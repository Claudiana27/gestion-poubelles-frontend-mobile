// app/tabs/layout.tsx
import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="explore" options={{ title: "Explorer" }} />
    </Tabs>
  );
}
