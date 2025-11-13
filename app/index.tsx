import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    // Vérifie d'abord si user existe
    const user = await AsyncStorage.getItem("user");
    if (user) {
      router.replace("/home");
      return;
    }
    Linking.openURL(
      "https://gestion-poubelles-backend-production.up.railway.app/auth/google"
    );
  };

  useEffect(() => {
    const handleRedirect = async (event: { url: string }) => {
      try {
        const params = new URLSearchParams(event.url.split("?")[1]);
        const userParam = params.get("user");
        if (userParam) {
          const userObj = JSON.parse(decodeURIComponent(userParam));
          await AsyncStorage.setItem("user", JSON.stringify(userObj));
          router.replace("/home");
        }
      } catch (err) {
        console.log("Erreur parsing URL:", err);
      }
    };

    const checkInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleRedirect({ url: initialUrl });
      else {
        // Si pas de redirection, vérifie si user existe pour aller direct à /home
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) router.replace("/home");
      }
    };
    checkInitialUrl();

    const subscription = Linking.addEventListener("url", handleRedirect);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ImageBackground
        source={require("../assets/images/trash.jpg")}
        style={styles.background}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)"]}
          style={styles.gradient}
        />

        <View style={styles.content}>
          <Text style={styles.title}>
            Gérez efficacement les déchets{"\n"}et contribuez à un environnement propre
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
            <Text style={styles.buttonText}>Continuer avec Google</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, justifyContent: "flex-end" },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: { paddingHorizontal: 30, paddingBottom: 80, alignItems: "center" },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#f4f4f4",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#fff",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
  },
  buttonText: { color: "#2e7d32", fontSize: 16, fontWeight: "600" },
});
