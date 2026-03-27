// src/screens/AllScreens.tsx
import React, { ReactNode, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, Image, FlatList, ScrollView,
  TouchableOpacity, TextInput, Platform
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import GlassView from "@/components/GlassView";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Circle, Region } from "react-native-maps";

/* -------------------------------------------------------------------------- */
/*                                   THEME                                    */
/* -------------------------------------------------------------------------- */
export const ui = {
  color: {
    gradFrom: "#a3e5fa",
    gradTo:   "#f7b6d6",
    glass: "rgba(255,255,255,0.25)",
    stroke: "rgba(255,255,255,0.55)",
    text: "#0B0B0C",
    textDim: "rgba(0,0,0,0.6)",
    white: "#FFFFFF",
    shadow: "#000",
    accent: "#1EAAD6",
    success: "#2ECC71",
  },
  radius: { sm:12, md:16, lg:24, xl:32, round:999 },
  space:  { xs:6, sm:10, md:14, lg:20, xl:28 },
  shadowCard: { y:10, blur:28, op:0.18 },
  shadowBtn:  { y:6,  blur:14, op:0.18 },
  font: { title:22, h2:18, body:16, small:13 },
  touch: { min:44 },
};

/* -------------------------------------------------------------------------- */
/*                                 UTIL: MAP                                  */
/* -------------------------------------------------------------------------- */
const toRad = (d: number) => (d * Math.PI) / 180;
const metersToLat = (m: number) => m / 111_320;
const metersToLng = (m: number, lat: number) => m / (111_320 * Math.cos(toRad(lat)));

function seedFromId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = (h ^ id.charCodeAt(i)) * 16777619;
  return (h >>> 0) / 0xffffffff;
}
function prng01(seed: number) {
  const a = 1664525, c = 1013904223, m = 2 ** 32;
  let state = Math.floor(seed * m) >>> 0;
  return () => ((state = (a * state + c) % m) / m);
}
export function maskLocation(id: string, lat: number, lng: number, min = 100, max = 300) {
  const R = prng01(seedFromId(id));
  const radius = min + R() * (max - min);
  const angle = R() * 2 * Math.PI;
  const dLat = metersToLat(Math.cos(angle) * radius);
  const dLng = metersToLng(Math.sin(angle) * radius, lat);
  return { lat: lat + dLat, lng: lng + dLng, privacyRadius: Math.max(120, radius) };
}

/* -------------------------------------------------------------------------- */
/*                               BASE COMPONENTS                               */
/* -------------------------------------------------------------------------- */
export function GradientBackground({ children }: { children: ReactNode }) {
  return (
    <LinearGradient
      colors={[ui.color.gradFrom, ui.color.gradTo]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>{children}</SafeAreaView>
    </LinearGradient>
  );
}

export function SurfaceCard({ children, style }: { children?: ReactNode; style?: any }) {
  return (
    <View
      style={[
        {
          backgroundColor: ui.color.glass,
          borderRadius: ui.radius.lg,
          padding: ui.space.lg,
          borderWidth: 1,
          borderColor: ui.color.stroke,
          shadowColor: ui.color.shadow,
          shadowOpacity: ui.shadowCard.op,
          shadowRadius: ui.shadowCard.blur,
          shadowOffset: { width: 0, height: ui.shadowCard.y },
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PillTab({
  label, active, onPress,
}: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ marginRight: 8 }}>
      <LinearGradient
        colors={active ? [ui.color.gradFrom, ui.color.gradTo] : ["#ffffff", "rgba(255,255,255,0.6)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
          borderWidth: 1, borderColor: active ? "rgba(255,255,255,0.9)" : ui.color.stroke,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: active ? "700" : "600", color: ui.color.text }}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GlassInput(props: any) {
  return (
    <View
      style={{
        backgroundColor: ui.color.glass,
        borderRadius: ui.radius.md,
        borderWidth: 1,
        borderColor: ui.color.stroke,
        paddingHorizontal: 12,
      }}
    >
      <TextInput
        placeholderTextColor="rgba(0,0,0,0.45)"
        style={{ height: 48, fontSize: 16, color: ui.color.text }}
        {...props}
      />
    </View>
  );
}

export function GlassIconButton({
  icon, onPress, size = 48, color = "rgba(0,0,0,0.75)", style,
}: { icon: any; onPress: () => void; size?: number; color?: string; style?: any }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        {
          width: size, height: size, borderRadius: size / 2,
          alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
          shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
          elevation: 6, overflow: "hidden",
        },
        style,
      ]}
    >
      <GlassView intensity={40} tint="light" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={Math.floor(size * 0.46)} color={color} />
      </GlassView>
    </TouchableOpacity>
  );
}

export function GlassFab({ onPress, icon = "add" }: { onPress: () => void; icon?: any }) {
  const S = 64;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        position: "absolute", right: 20, bottom: Platform.OS === "ios" ? 28 : 20,
        shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
        elevation: 10, borderRadius: S / 2, overflow: "hidden",
      }}
    >
      <GlassView intensity={50} tint="light" style={{ borderRadius: S / 2 }}>
        <LinearGradient
          colors={[ui.color.gradFrom + "cc", ui.color.gradTo + "cc"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: S, height: S, borderRadius: S / 2,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: "rgba(255,255,255,0.6)",
          }}
        >
          <Ionicons name={icon} size={28} color={ui.color.text} />
        </LinearGradient>
      </GlassView>
    </TouchableOpacity>
  );
}

export function MapControls({
  onLocate, onZoomIn, onZoomOut, onLayers, position = "right",
}: {
  onLocate: () => void; onZoomIn: () => void; onZoomOut: () => void; onLayers?: () => void; position?: "right" | "left";
}) {
  const insets = useSafeAreaInsets();
  const side = position === "right" ? { right: 12 } : { left: 12 };
  const topOffset = (insets?.top ?? 0) + 72;
  return (
    <View pointerEvents="box-none" style={[{ position: "absolute", top: topOffset, zIndex: 10 }, side]}>
      <GlassIconButton icon="locate-outline" onPress={onLocate} />
      <GlassIconButton icon="add-outline" onPress={onZoomIn} style={{ marginTop: 10 }} />
      <GlassIconButton icon="remove-outline" onPress={onZoomOut} style={{ marginTop: 10 }} />
      {onLayers && <GlassIconButton icon="layers-outline" onPress={onLayers} style={{ marginTop: 10 }} />}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   SCREENS                                   */
/* -------------------------------------------------------------------------- */

// 1) Fil d'actualité (HomeFeed)
export function HomeFeedScreen() {
  const [tab, setTab] = useState("Tous");
  const posts = useMemo(
    () => [
      { id: "p1", author: "ckartier", city: "Montmartre", text: "Grande balade", image: "https://picsum.photos/800/500?1", likes: 12, comments: 3 },
      { id: "p2", author: "emma", city: "Paris", text: "Rendez-vous à 10h", image: "https://picsum.photos/800/500?2", likes: 5, comments: 1 },
    ],
    []
  );

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {["Tous", "Abonnements", "À proximité", "Perdus & Trouvés"].map((t) => (
            <PillTab key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </View>

        {posts.map((p) => (
          <SurfaceCard key={p.id} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, overflow: "hidden", marginRight: 10, backgroundColor: "#fff" }}>
                <Image source={{ uri: "https://i.pravatar.cc/72" }} style={{ width: "100%", height: "100%" }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>{p.author}</Text>
                <Text style={{ color: ui.color.textDim, fontSize: ui.font.small }}>{p.city}</Text>
              </View>
              <Ionicons name="ellipsis-horizontal" size={20} color={ui.color.textDim} />
            </View>

            <Text style={{ marginBottom: 10, fontSize: ui.font.body }}>{p.text}</Text>

            <View style={{ borderRadius: ui.radius.md, overflow: "hidden", marginBottom: 10 }}>
              <Image source={{ uri: p.image }} style={{ width: "100%", height: 220 }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row" }}>
                <Action icon="heart-outline" label={`${p.likes}`} />
                <Action icon="chatbubble-outline" label={`${p.comments}`} />
                <Action icon="share-outline" />
              </View>
              <Action icon="bookmark-outline" />
            </View>
          </SurfaceCard>
        ))}
      </ScrollView>
      <GlassFab onPress={() => {}} />
    </GradientBackground>
  );
}
function Action({ icon, label }: { icon: any; label?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14 }}>
      <Ionicons name={icon} size={20} color={ui.color.textDim} />
      {label && <Text style={{ marginLeft: 6, color: ui.color.textDim }}>{label}</Text>}
    </View>
  );
}

// 2) Profil
export function ProfileScreen() {
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 16 }}>
        <SurfaceCard style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", borderWidth: 3, borderColor: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
            <Image source={{ uri: "https://i.pravatar.cc/192" }} style={{ width: "100%", height: "100%" }} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 4 }}>EmmaLove</Text>
          <Text style={{ color: ui.color.textDim }}>Paris · +FR 0633363636</Text>

          <View style={{ flexDirection: "row", marginTop: 12 }}>
            <PillTab label="Tous" active onPress={() => {}} />
            <PillTab label="Abonnements" onPress={() => {}} />
            <PillTab label="Voir tout" onPress={() => {}} />
          </View>
        </SurfaceCard>

        <SurfaceCard style={{ marginBottom: 16 }}>
          <SectionHeader title="Mes amis" action="Voir tout" />
          <FriendRow username="@leo_duval" />
          <FriendRow username="@claire_martin" />
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader title="Mes animaux" action="+" />
          <AnimalAdd />
        </SurfaceCard>
      </ScrollView>
      <GlassFab onPress={() => {}} icon="create-outline" />
    </GradientBackground>
  );
}
function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ fontSize: ui.font.h2, fontWeight: "800" }}>{title}</Text>
      {action && <Text style={{ color: ui.color.text, fontWeight: "700" }}>{action}</Text>}
    </View>
  );
}
function FriendRow({ username }: { username: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, overflow: "hidden", marginRight: 10, backgroundColor: "#fff" }}>
        <Image source={{ uri: "https://i.pravatar.cc/96" }} style={{ width: "100%", height: "100%" }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700" }}>{username}</Text>
        <Text style={{ color: ui.color.textDim }}>Envoyer un message</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={ui.color.textDim} />
    </View>
  );
}
function AnimalAdd() {
  return (
    <View style={{ height: 120, borderRadius: ui.radius.lg, borderWidth: 1, borderColor: ui.color.stroke, justifyContent: "center", alignItems: "center" }}>
      <Ionicons name="add" size={26} color={ui.color.text} />
      <Text style={{ marginTop: 6, fontWeight: "700" }}>Ajoutez votre premier animal</Text>
    </View>
  );
}

// 3) Carte (confidentialité incluse)
type Animal = { id: string; name: string; lat: number; lng: number; isFriend?: boolean };
export function MapScreen() {
  const animals: Animal[] = [
    { id: "a1", name: "Moka", lat: 48.858, lng: 2.294, isFriend: false },
    { id: "a2", name: "Luna", lat: 48.861, lng: 2.296, isFriend: true },
  ];
  const mapRef = useRef<MapView | null>(null);
  const initial: Region = { latitude: 48.858, longitude: 2.294, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const animateZoom = (delta: number) => {
    if (!mapRef.current) return;
    mapRef.current.getCamera().then((cam) => {
      cam.zoom = (cam.zoom ?? 12) + delta;
      mapRef.current?.animateCamera(cam, { duration: 180 });
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initial} testID="map-primary" />
      <MapControls
        onLocate={() => {}}
        onZoomIn={() => animateZoom(+1)}
        onZoomOut={() => animateZoom(-1)}
      />
      {animals.map((a) => {
        const showExact = !!a.isFriend;
        const coord = showExact ? { latitude: a.lat, longitude: a.lng } : maskLocation(a.id, a.lat, a.lng, 100, 300);
        return (
          <View key={a.id} pointerEvents="none" />
        );
      })}
      {/* Markers + Circles overlay (separate MapView overlay for clarity) */}
      <MapView pointerEvents="none" style={StyleSheet.absoluteFill} initialRegion={initial} testID="map-overlay">
        {animals.map((a) => {
          const showExact = !!a.isFriend;
          if (showExact) {
            return <Marker key={a.id} coordinate={{ latitude: a.lat, longitude: a.lng }} title={a.name} />;
          }
          const m = maskLocation(a.id, a.lat, a.lng, 100, 300);
          return (
            <React.Fragment key={a.id}>
              <Marker coordinate={{ latitude: m.lat, longitude: m.lng }} title={`${a.name} (approx.)`} />
              <Circle center={{ latitude: m.lat, longitude: m.lng }} radius={m.privacyRadius} strokeWidth={1}
                strokeColor="rgba(30,170,214,0.35)" fillColor="rgba(30,170,214,0.15)" />
            </React.Fragment>
          );
        })}
      </MapView>
      <GlassFab onPress={() => {}} icon="paw-outline" />
    </View>
  );
}

// 4) Messages (liste)
export function MessagesScreen() {
  const convs = [{ id: "c1", user: "leo_duval", last: "On se voit au parc ?", time: "14:02" }];
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <SurfaceCard>
          <SectionHeader title="Messages" />
          {convs.map((c) => (
            <View key={c.id} style={{ flexDirection: "row", paddingVertical: 10, alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", marginRight: 10, backgroundColor: "#fff" }}>
                <Image source={{ uri: "https://i.pravatar.cc/88" }} style={{ width: "100%", height: "100%" }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>@{c.user}</Text>
                <Text style={{ color: ui.color.textDim }}>{c.last}</Text>
              </View>
              <Text style={{ color: ui.color.textDim }}>{c.time}</Text>
            </View>
          ))}
        </SurfaceCard>
      </ScrollView>
    </GradientBackground>
  );
}

// 5) Boutique
export function ShopScreen() {
  const items = [
    { id: "s1", name: "Harnais", price: 29.9, img: "https://picsum.photos/400/300?pet1" },
    { id: "s2", name: "Jouet", price: 12.5, img: "https://picsum.photos/400/300?pet2" },
  ];
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <SectionHeader title="Boutique" />
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {items.map((i) => (
            <SurfaceCard key={i.id} style={{ width: "48%", padding: 12 }}>
              <Image source={{ uri: i.img }} style={{ width: "100%", height: 120, borderRadius: ui.radius.md, marginBottom: 8 }} />
              <Text style={{ fontWeight: "700" }}>{i.name}</Text>
              <Text style={{ color: ui.color.textDim }}>{i.price.toFixed(2)} €</Text>
              <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 8 }}>
                <LinearGradient colors={[ui.color.gradFrom, ui.color.gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: ui.radius.md, minHeight: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: ui.color.stroke }}>
                  <Text style={{ fontWeight: "800" }}>Acheter</Text>
                </LinearGradient>
              </TouchableOpacity>
            </SurfaceCard>
          ))}
        </View>
      </ScrollView>
      <GlassFab onPress={() => {}} icon="cart-outline" />
    </GradientBackground>
  );
}

// 6) Cat-Sitter: liste
export function CatSitterListScreen() {
  const [tab, setTab] = useState("Tous");
  const sitters = [
    { id: "cs1", name: "Julie", priceFrom: 18, rating: 4.8, img: "https://i.pravatar.cc/120?img=5" },
    { id: "cs2", name: "Max", priceFrom: 15, rating: 4.6, img: "https://i.pravatar.cc/120?img=6" },
  ];
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {["Tous", "Dispo", "Prix", "Proches"].map((t) => (
            <PillTab key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </View>
        {sitters.map((s) => (
          <SurfaceCard key={s.id} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={{ uri: s.img }} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800" }}>{s.name}</Text>
                <Text style={{ color: ui.color.textDim }}>Dès {s.priceFrom} €/h · ★ {s.rating}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={ui.color.textDim} />
            </View>
          </SurfaceCard>
        ))}
      </ScrollView>
      <GlassFab onPress={() => {}} icon="filter-outline" />
    </GradientBackground>
  );
}

// 7) Cat-Sitter: profil + réservation (simplifié)
export function CatSitterProfileScreen() {
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <SurfaceCard style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={{ uri: "https://i.pravatar.cc/160?img=7" }} style={{ width: 72, height: 72, borderRadius: 36, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: ui.font.h2, fontWeight: "800" }}>Julie</Text>
              <Text style={{ color: ui.color.textDim }}>★ 4.8 · Paris</Text>
            </View>
            <Pill small text="Pro vérifié" />
          </View>
          <Text style={{ marginTop: 10 }}>Services: Garde à domicile, Promenade, Visite.</Text>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader title="Réserver" />
          <GlassInput placeholder="Date de début" />
          <View style={{ height: 10 }} />
          <GlassInput placeholder="Date de fin" />
          <View style={{ height: 10 }} />
          <GlassInput placeholder="Animal" />
          <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 12 }}>
            <LinearGradient colors={[ui.color.gradFrom, ui.color.gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: ui.radius.md, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: ui.color.stroke }}>
              <Text style={{ fontWeight: "800" }}>Confirmer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SurfaceCard>
      </ScrollView>
    </GradientBackground>
  );
}
function Pill({ text, small }: { text: string; small?: boolean }) {
  return (
    <LinearGradient
      colors={[ui.color.gradFrom, ui.color.gradTo]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: small ? 4 : 6, borderWidth: 1, borderColor: ui.color.stroke }}
    >
      <Text style={{ fontWeight: "700" }}>{text}</Text>
    </LinearGradient>
  );
}

// 8) Défis: hub
export function ChallengesHubScreen() {
  const [tab, setTab] = useState("En cours");
  const items = [
    { id: "ch1", title: "Selfie avec ton animal", end: "2j", cover: "https://picsum.photos/800/400?challenge1" },
    { id: "ch2", title: "Balade la plus longue", end: "5j", cover: "https://picsum.photos/800/400?challenge2" },
  ];
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {["Tous", "En cours", "À venir", "Terminés"].map((t) => (
            <PillTab key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
          ))}
        </View>
        {items.map((c) => (
          <SurfaceCard key={c.id} style={{ marginBottom: 12 }}>
            <Image source={{ uri: c.cover }} style={{ width: "100%", height: 140, borderRadius: ui.radius.md, marginBottom: 8 }} />
            <Text style={{ fontSize: ui.font.h2, fontWeight: "800" }}>{c.title}</Text>
            <Text style={{ color: ui.color.textDim }}>Se termine dans {c.end}</Text>
            <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Pill text="Participer" />
            </TouchableOpacity>
          </SurfaceCard>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

// 9) Défi: détail
export function ChallengeDetailScreen() {
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <SurfaceCard style={{ marginBottom: 12 }}>
          <Image source={{ uri: "https://picsum.photos/800/400?challengeX" }} style={{ width: "100%", height: 160, borderRadius: ui.radius.md, marginBottom: 8 }} />
          <Text style={{ fontSize: ui.font.h2, fontWeight: "800" }}>Selfie avec ton animal</Text>
          <Text style={{ color: ui.color.textDim, marginTop: 6 }}>
            Règles: Photo nette, pas de filtre agressif, ton animal doit être visible.
          </Text>
          <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 12, alignSelf: "flex-start" }}>
            <Pill text="Soumettre" />
          </TouchableOpacity>
        </SurfaceCard>
      </ScrollView>
    </GradientBackground>
  );
}

// 10) Défi: soumission
export function ChallengeSubmitScreen() {
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <SurfaceCard>
          <SectionHeader title="Soumettre au défi" />
          <GlassInput placeholder="Lien photo/vidéo ou uploader" />
          <View style={{ height: 10 }} />
          <GlassInput placeholder="Légende" />
          <TouchableOpacity activeOpacity={0.85} style={{ marginTop: 12 }}>
            <LinearGradient colors={[ui.color.gradFrom, ui.color.gradTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: ui.radius.md, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: ui.color.stroke }}>
              <Text style={{ fontWeight: "800" }}>Envoyer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SurfaceCard>
      </ScrollView>
    </GradientBackground>
  );
}

// 11) Admin: collections (UI)
export function AdminCollectionsScreen() {
  // Branche sur Firestore pour compter les docs; ici statique pour la démo
  const cols = [
    { name: "users", count: 124 },
    { name: "pets", count: 88 },
    { name: "posts", count: 240 },
    { name: "friendRequests", count: 7 },
    { name: "bookings", count: 15 },
    { name: "notifications", count: 340 },
    { name: "challenges", count: 3 },
  ];
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
        <SectionHeader title="Collections Firestore" />
        {cols.map((c) => (
          <SurfaceCard key={c.name} style={{ marginBottom: 10, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontWeight: "800", fontSize: 16, flex: 1 }}>{c.name}</Text>
            <Text style={{ color: ui.color.textDim }}>{c.count}</Text>
          </SurfaceCard>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}