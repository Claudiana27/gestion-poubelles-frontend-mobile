// app/tabs/index.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function TabsHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue dans le tableau de bord !</Text>
      {/* Ici tu peux afficher des stats, boutons, etc. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});
