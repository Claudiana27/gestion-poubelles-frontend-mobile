import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import MapboxGL from "@rnmapbox/maps";
import * as Location from "expo-location";
import { Stack } from "expo-router";

MapboxGL.setAccessToken(null); // on utilise les tuiles MapLibre, pas de token Mapbox

export default function Search() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [poubelles, setPoubelles] = useState<any[]>([]);
  const [selectedPoubelle, setSelectedPoubelle] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const BACKEND_URL = "https://gestion-poubelles-backend-production.up.railway.app";

  const defaultRegion = {
    latitude: -21.4333,
    longitude: 47.0833,
  };

  // Récupération localisation
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission refusée pour accéder à la localisation.");
          setLoading(false);
          return;
        }

        timeoutId = setTimeout(() => {
          if (!location) {
            setErrorMsg("Position non trouvée, position par défaut utilisée.");
            setLoading(false);
          }
        }, 10000);

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setLoading(false);
      } catch (err) {
        console.log(err);
        setErrorMsg("Erreur lors de la récupération de la position.");
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

  // Fonction signalement
  const signalerPoubelle = async (poubelle_id: number, capacite: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/signalements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poubelle_id, capacite }),
      });
      alert("Signalement envoyé !");
    } catch (err) {
      console.log(err);
      alert("Erreur lors du signalement.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text>Chargement de la localisation...</Text>
      </View>
    );
  }

  const userCoord = location
    ? [location.longitude, location.latitude]
    : [defaultRegion.longitude, defaultRegion.latitude];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <MapboxGL.MapView
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
      >
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={userCoord}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* ---- Cercle 1km autour de l'utilisateur (ShapeSource require Feature avec properties) ---- */}
        <MapboxGL.ShapeSource
          id="circle"
          shape={{
            type: "Feature",
            properties: {},                     // <-- IMPORTANT : required by the type
            geometry: {
              type: "Point",
              coordinates: userCoord,
            },
          }}
        >
          <MapboxGL.CircleLayer
            id="circleLayer"
            style={{
              circleRadius: 120,
              circleColor: "rgba(46,125,50,0.15)",
              circleStrokeColor: "rgba(46,125,50,0.7)",
              circleStrokeWidth: 2,
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Position utilisateur */}
        <MapboxGL.PointAnnotation id="user" coordinate={userCoord}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#2e7d32",
              borderWidth: 3,
              borderColor: "#fff",
            }}
          />
        </MapboxGL.PointAnnotation>

        {/* Poubelles */}
        {poubelles.map((p) => (
          <MapboxGL.PointAnnotation
            key={p.id.toString()}
            id={`p${p.id}`}
            coordinate={[parseFloat(p.longitude), parseFloat(p.latitude)]}
            onSelected={() => {
              setSelectedPoubelle(p);
              setModalVisible(true);
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#009688",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            />
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>

      {/* Modal signalement */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>{selectedPoubelle?.nom}</Text>
            <Text>Latitude: {selectedPoubelle?.latitude}</Text>
            <Text>Longitude: {selectedPoubelle?.longitude}</Text>

            <Text style={{ marginTop: 10 }}>Signaler l’état :</Text>

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
                  <Text style={{ color: "#fff", textAlign: "center" }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={{ marginTop: 10, alignSelf: "center" }} onPress={() => setModalVisible(false)}>
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
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: 250, backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  button: { backgroundColor: "#2e7d32", padding: 6, borderRadius: 5, minWidth: 60 },
});
