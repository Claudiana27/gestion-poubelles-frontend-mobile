import React from "react";
import { Stack } from "expo-router";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Stack>{children}</Stack>;
}
