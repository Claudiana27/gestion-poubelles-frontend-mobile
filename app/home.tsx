import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, ImageBackground, ScrollView, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router"; // ✅ ajouté Stack

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            const params = new URLSearchParams(initialUrl.split("?")[1]);
            const userParam = params.get("user");
            if (userParam) {
              const userObj = JSON.parse(decodeURIComponent(userParam));
              setUser(userObj);
              await AsyncStorage.setItem("user", JSON.stringify(userObj));
            }
          }
        }
      } catch (err) {
        console.log("Erreur loadUser:", err);
      }
    };

    loadUser();

    const subscription = Linking.addEventListener("url", async (event) => {
      try {
        const params = new URLSearchParams(event.url.split("?")[1]);
        const userParam = params.get("user");
        if (userParam) {
          const userObj = JSON.parse(decodeURIComponent(userParam));
          setUser(userObj);
          await AsyncStorage.setItem("user", JSON.stringify(userObj));
        }
      } catch (err) {
        console.log("Erreur subscription:", err);
      }
    });

    return () => subscription.remove();
  }, []);

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      {/* 🔹 Enlève le header "Home" */}
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require("../assets/images/perso.jpg")}
        style={styles.background}
      >
        <View style={styles.overlay} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.userName}>{user.display_name}</Text>
        </View>

        {/* Texte bienvenue */}
        <View style={styles.content}>
          <Text style={styles.title}>Bienvenue !</Text>
          <Text style={styles.description}>
            Gérez facilement les poubelles dans votre zone. Signalez rapidement les débordements et trouvez les points de collecte proches.
          </Text>

          {/* Fonctionnalités */}
          <View style={styles.feature}>
            <Ionicons name="search-outline" size={36} color="#fff" style={{ marginRight: 12 }} />
            <Text style={styles.featureText}>
              Recherchez les poubelles à proximité grâce à notre carte interactive.
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="alert-circle-outline" size={36} color="#fff" style={{ marginRight: 12 }} />
            <Text style={styles.featureText}>
              Signalez les débordements pour aider à maintenir la ville propre.
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#fff" style={{ marginRight: 12 }} />
            <Text style={styles.featureText}>
              Suivez vos actions écologiques et contribuez à un environnement plus sain.
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Menu latéral */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuVisible(false)} />
        <View style={styles.sideMenu}>
          <Text style={styles.menuTitle}>Menu</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("./home")}>
            <Ionicons name="home" size={22} color="#333" />
            <Text style={styles.menuText}>Accueil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push("./search")}>
            <Ionicons name="search" size={22} color="#333" />
            <Text style={styles.menuText}>Rechercher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={async () => {
              await AsyncStorage.removeItem("user");
              setUser(null);
              router.replace("./");
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#e53935" />
            <Text style={[styles.menuText, { color: "#e53935" }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { width: "100%", minHeight: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    alignItems: "center",
  },
  userName: { fontSize: 16, color: "#fff", fontWeight: "600" },
  content: { paddingHorizontal: 20, paddingTop: 150 },
  title: { fontSize: 30, color: "#fff", fontWeight: "bold", marginBottom: 12 },
  description: { fontSize: 18, color: "#f0f0f0", lineHeight: 26, marginBottom: 25 },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  featureText: { flex: 1, color: "#fff", fontSize: 18 },

  sideMenu: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 240,
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 70,
    paddingHorizontal: 20,
    elevation: 8,
  },
  menuTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#2e7d32" },
  menuItem: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  menuText: { marginLeft: 10, fontSize: 16, color: "#333" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 18, color: "#2e7d32" },
});
