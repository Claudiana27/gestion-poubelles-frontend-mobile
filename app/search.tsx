import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Search() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [poubelles, setPoubelles] = useState<any[]>([]);
  const [selectedPoubelle, setSelectedPoubelle] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  const BACKEND_URL = "https://gestion-poubelles-backend-production.up.railway.app";

  // ⛔ IMPORTANT : OBLIGATOIRE POUR MapLibre
  MapLibreGL.setAccessToken(null);

  // Chargement utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        await AsyncStorage.getItem("user");
        setUserLoaded(true);
      } catch {
        setUserLoaded(true);
      }
    };
    loadUser();
  }, []);

  // Récupération localisation
  useEffect(() => {
    let timeoutId: any;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission refusée.");
          setLoading(false);
          return;
        }

        timeoutId = setTimeout(() => {
          if (!location) {
            setErrorMsg("Position lente → localisation par défaut.");
            setLoading(false);
          }
        }, 10000);

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setLoading(false);
      } catch {
        setErrorMsg("Erreur de localisation.");
        setLoading(false);
      }
    })();

    return () => clearTimeout(timeoutId);
  }, []);

  // Récupération poubelles
  useEffect(() => {
    const fetchPoubelles = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/poubelles`);
        const data = await res.json();
        setPoubelles(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchPoubelles();
  }, []);

  // Envoi signalement
  const signalerPoubelle = async (poubelle_id: number, capacite: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/signalements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poubelle_id, capacite }),
      });

      alert("Signalement envoyé !");
    } catch {
      alert("Erreur lors du signalement.");
    }
  };

  if (!userLoaded || loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>{errorMsg ?? "Chargement de la localisation..."}</Text>
      </View>
    );
  }

  const userCoords = location || { latitude: -21.4333, longitude: 47.0833 };

  // --- Cercle de 1 KM autour de l'utilisateur
  const circleGeoJSON = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [userCoords.longitude, userCoords.latitude],
        },
        properties: {},
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapLibreGL.MapView style={styles.map}>
        <MapLibreGL.Camera
          zoomLevel={14}
          centerCoordinate={[userCoords.longitude, userCoords.latitude]}
        />

        {/* Cercle 1 km */}
        <MapLibreGL.ShapeSource id="circle" shape={circleGeoJSON}>
          <MapLibreGL.CircleLayer
            id="circleLayer"
            style={{
              circleRadius: 180,
              circleColor: "rgba(46,125,50,0.15)",
              circleStrokeWidth: 2,
              circleStrokeColor: "rgba(46,125,50,0.7)",
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Position de l’utilisateur */}
        <MapLibreGL.PointAnnotation
          id="user"
          coordinate={[userCoords.longitude, userCoords.latitude]}
        />

        {/* Markers poubelles */}
        {poubelles.map((p) => (
          <MapLibreGL.PointAnnotation
            key={p.id}
            id={`p-${p.id}`}
            coordinate={[parseFloat(p.longitude), parseFloat(p.latitude)]}
            onSelected={() => {
              setSelectedPoubelle(p);
              setModalVisible(true);
            }}
          />
        ))}
      </MapLibreGL.MapView>

      {/* Modal signalement */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{selectedPoubelle?.nom}</Text>
            <Text>Latitude: {selectedPoubelle?.latitude}</Text>
            <Text>Longitude: {selectedPoubelle?.longitude}</Text>

            <Text style={{ marginTop: 10 }}>Signaler :</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
              {["moyenne", "pleine", "détruit"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.button}
                  onPress={async () => {
                    await signalerPoubelle(selectedPoubelle.id, c);
                    setModalVisible(false);
                  }}
                >
                  <Text style={{ color: "#fff" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ marginTop: 10, alignSelf: "center" }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#900" }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: 250,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 6,
    borderRadius: 5,
    minWidth: 60,
  },
});
