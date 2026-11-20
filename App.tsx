import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";


type Course = "Starter" | "Main" | "Dessert" | "Drink";


type MenuItem = {
  id: string;            
  name: string;         
  description: string;   
  ingredients: string[]; 
  price: number;         // IMPORTANT: number (not string), e.g., 89.99
  course: Course;        
};


const INGREDIENT_OPTIONS = ["Tomato", "Mozzarella", "Chicken", "Basil"] as const;

// ---------- App Root Component ----------
export default function App() {
  // "screen" keeps track of which view we are showing.
  // We keep navigation simple by switching on this value.
  const [screen, setScreen] = useState<"Home" | "Add" | "Filter" | "Average">(
    "Home"
  );

  // This array holds all menu items added by the user in memory.
  // We are not saving to a database yet 
  const [menu, setMenu] = useState<MenuItem[]>([]);

  // For the Filter screen, we store the current course filter.
  const [filterCourse, setFilterCourse] = useState<Course | "All">("All");

  // Count how many menu items exist.
 

  const totalMenuItems = menu.length;

  // ---------- Small Top Icon Navigation ----------

  const NavBar = () => (
    <View style={styles.nav}>
      <NavIcon
        icon="home"
        label="Home"
        active={screen === "Home"}
        onPress={() => setScreen("Home")}
      />
      <NavIcon
        icon="add-circle"
        label="Add"
        active={screen === "Add"}
        onPress={() => setScreen("Add")}
      />
      <NavIcon
        icon="filter"
        label="Filter"
        active={screen === "Filter"}
        onPress={() => setScreen("Filter")}
      />
      <NavIcon
        icon="stats-chart"
        label="Avg"
        active={screen === "Average"}
        onPress={() => setScreen("Average")}
      />
    </View>
  );

  // ---------- Main Layout ----------
  return (
    <View style={styles.container}>
      <Header />
      <NavBar />
      <View style={{ flex: 1 }}>
        {screen === "Home" && (
          <HomeScreen
            menu={menu}
            totalMenuItems={totalMenuItems}
            onRemoveItem={(id) =>
              setMenu((prev) => prev.filter((m) => m.id !== id))
            }
          />
        )}

        {screen === "Add" && (
          <AddItemScreen
            // When a new item is added on the Add screen,
            // we push it into the "menu" array here in App.
            onAdd={(item) => setMenu((prev) => [item, ...prev])}
          />
        )}

        {screen === "Filter" && (
          <FilterScreen
            menu={menu}
            filterCourse={filterCourse}
            onChangeCourse={setFilterCourse}
          />
        )}

        {screen === "Average" && <AverageByIngredientScreen menu={menu} />}
      </View>
    </View>
  );
}

// ---------- Header with a logo ----------
const Header = () => {
  return (
    <View style={styles.header}>
      
      <Image
  source={require("./assets/logo.png")}
  style={styles.logo}
  resizeMode="contain"
/>

      <View>
        <Text style={styles.title}>Chef’s Ingredient Menu</Text>
        <Text style={styles.subtitle}>Create, view, filter & analyze</Text>
      </View>
    </View>
  );
};

// ---------- Reusable small nav icon button ----------
function NavIcon({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.navItem, active && styles.navItemActive]}
    >
      <Ionicons name={icon} size={24} style={{ opacity: active ? 1 : 0.7 }} />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------- HOME SCREEN ----------
// Shows a count of items and the full menu list.
// Also lets the chef delete items from the menu.
function HomeScreen({
  menu,
  totalMenuItems,
  onRemoveItem,
}: {
  menu: MenuItem[];
  totalMenuItems: number;
  onRemoveItem: (id: string) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      {/* Stats row shows the total count of menu items. */}
      <View style={styles.statsRow}>
        <StatCard label="Menu items" value={String(totalMenuItems)} />
      </View>

      {/* If there are no items yet, we show a friendly empty state. */}
      {menu.length === 0 ? (
        <EmptyState
          title="No menu yet"
          message="Add your first dish from the Add screen."
        />
      ) : (
        // Otherwise we list all menu items.
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardCourse}>{item.course}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardIngredients}>
                  Ingredients: {item.ingredients.join(", ")}
                </Text>
                <Text style={styles.cardPrice}>
                  Price: R {item.price.toFixed(2)}
                </Text>
              </View>

              {/* Delete button to remove the item from the menu */}
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Remove item",
                    `Delete "${item.name}" from the menu?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => onRemoveItem(item.id),
                      },
                    ]
                  )
                }
                style={styles.deleteBtn}
              >
                <Ionicons name="trash" size={20} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ---------- ADD ITEM SCREEN ----------
// This screen is where the chef adds new dishes.

function AddItemScreen({ onAdd }: { onAdd: (item: MenuItem) => void }) {
  // Input fields for building a new menu item.
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [course, setCourse] = useState<Course>("Starter");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [priceText, setPriceText] = useState("");

  // Toggle an ingredient chip on/off.
  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) => {
      // If it was already selected, we remove it.
      if (prev.includes(ing)) return prev.filter((x) => x !== ing);
      // If we already have 4, we warn the user.
      if (prev.length >= 4) {
        Alert.alert("Limit reached", "You can select up to 4 ingredients.");
        return prev;
      }
      // Otherwise we add it.
      return [...prev, ing];
    });
  };

  // Clear the form after a successful save.
  const clearForm = () => {
    setName("");
    setDesc("");
    setCourse("Starter");
    setSelectedIngredients([]);
    setPriceText("");
  };

  // Save action: validate, build a MenuItem, and tell App to add it.
  const handleAdd = () => {
    // Convert the price text to a number to ensure we store a number not a string.
    const price = Number(priceText);

    // Basic validations to help users avoid mistakes.
    if (!name.trim()) return Alert.alert("Validation", "Please enter a name.");
    if (!desc.trim())
      return Alert.alert("Validation", "Please enter a description.");
    if (selectedIngredients.length === 0)
      return Alert.alert(
        "Validation",
        "Please select at least one ingredient."
      );
    if (Number.isNaN(price) || price <= 0)
      return Alert.alert(
        "Validation",
        "Please enter a valid price (number > 0)."
      );

    // Build the item object to match the MenuItem type.
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: name.trim(),
      description: desc.trim(),
      course,
      ingredients: selectedIngredients,
      price, // keep as number (NOT string)
    };

    // Add the new item to the "menu" array in App() via onAdd.
    onAdd(newItem);

    // Reset the form and inform the user.
    clearForm();
    Alert.alert("Saved", "Menu item added to Home.");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formHeading}>Add a Menu Item</Text>

        <Text style={styles.label}>Ingredient Name (Dish name)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Caprese Salad"
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Short tasty description..."
          style={[styles.input, { height: 80 }]}
          multiline
        />

        <Text style={styles.label}>Course</Text>
        <View style={styles.courseRow}>
          {(["Starter", "Main", "Dessert", "Drink"] as Course[]).map((c) => {
            const active = course === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCourse(c)}
                style={[
                  styles.pill,
                  active && {
                    backgroundColor: "#2e7d32",
                    borderColor: "#2e7d32",
                  },
                ]}
              >
                <Text style={[styles.pillText, active && { color: "#fff" }]}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Select up to 4 Ingredients</Text>
        <View style={styles.ingredientsWrap}>
          {INGREDIENT_OPTIONS.map((ing) => {
            const active = selectedIngredients.includes(ing);
            return (
              <Pressable
                key={ing}
                onPress={() => toggleIngredient(ing)}
                style={[
                  styles.ingredientChip,
                  active && {
                    backgroundColor: "#e8f5e9",
                    borderColor: "#2e7d32",
                  },
                ]}
              >
                <Ionicons
                  name={active ? "checkbox" : "square-outline"}
                  size={18}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.ingredientText}>{ing}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Price (Rands)</Text>
        <TextInput
          value={priceText}
          onChangeText={setPriceText}
          placeholder="e.g., 89.99"
          // Using decimal-pad encourages numeric entry on mobile
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Pressable onPress={handleAdd} style={styles.primaryBtn}>
          <Ionicons name="save" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Add to Menu</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}



















// ---------- FILTER SCREEN (with full, plain-English comments) ----------


function FilterScreen({
  menu,
  filterCourse,
  onChangeCourse,
}: {
  menu: MenuItem[];
  filterCourse: Course | "All";
  onChangeCourse: (c: Course | "All") => void;
}) {

  const filtered = useMemo(() => {
   
    const result: MenuItem[] = [];

 
    for (let i = 0; i < menu.length; i++) {
      const item = menu[i]; 

  
      if (filterCourse === "All" || item.course === filterCourse) {
        result.push(item);
      }
    }


    return result;
  }, [menu, filterCourse]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={styles.formHeading}>Filter by Course</Text>

     
        <View style={styles.courseRow}>
          {(["All", "Starter", "Main", "Dessert", "Drink"] as const).map(
            (c) => {
              const active = filterCourse === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => onChangeCourse(c)}
                  style={[
                    styles.pill,
                    active && {
                      backgroundColor: "#2e7d32",
                      borderColor: "#2e7d32",
                    },
                  ]}
                >
                  <Text style={[styles.pillText, active && { color: "#fff" }]}>
                    {c}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      </View>

    
      {filtered.length === 0 ? (
        <EmptyState
          title="No results"
          message="Try a different course or add items from the Add screen."
        />
      ) : (

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardCourse}>{item.course}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardIngredients}>
                  Ingredients: {item.ingredients.join(", ")}
                </Text>
                <Text style={styles.cardPrice}>
                  Price: R {item.price.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ---------- AVERAGE BY INGREDIENT SCREEN (COMPLETED) ----------

function AverageByIngredientScreen({ menu }: { menu: MenuItem[] }) {
  
  const rows = useMemo(() => {
   
    const out: { ingredient: string; count: number; average: number | null }[] =
      [];

    
    for (let i = 0; i < INGREDIENT_OPTIONS.length; i++) {
      const ingName = INGREDIENT_OPTIONS[i];

      
     
      let sum = 0;     
      let count = 0;    

      
      let index = 0; 
      while (index < menu.length) {
        const item = menu[index];

       
        if (item.ingredients.includes(ingName)) {
          sum = sum + item.price;
          count = count + 1;
        }

        
        index = index + 1;
      }

     
      const average = count > 0 ? sum / count : null;

      
      out.push({ ingredient: ingName, count, average });
    }

    return out;
  }, [menu]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.formHeading}>Average Price by Ingredient</Text>

      
      {menu.length === 0 ? (
        <EmptyState
          title="No data yet"
          message="Add some menu items first, then come back to see averages."
        />
      ) : (
        <View>
          
          {rows.map((row) => (
            <View key={row.ingredient} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{row.ingredient}</Text>
                <Text style={styles.cardDesc}>
                  Items using this ingredient: {row.count}
                </Text>
                <Text style={styles.cardPrice}>
                  Average price:{" "}
                  {row.average === null
                    ? "N/A"
                    : `R ${row.average.toFixed(2)}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------- Small UI helpers ----------
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="restaurant" size={48} style={{ marginBottom: 8 }} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMsg}>{message}</Text>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f5" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#e8f5e9",
    gap: 12,
  },
  logo: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#1b5e20" },
  subtitle: { fontSize: 12, color: "#2e7d32" },

  nav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c8e6c9",
    backgroundColor: "#fff",
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  navItemActive: { backgroundColor: "#e8f5e9" },
  navLabel: { fontSize: 12, marginTop: 4, color: "#333" },
  navLabelActive: { fontWeight: "700", color: "#1b5e20" },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dce8dc",
  },
  statLabel: { fontSize: 12, color: "#607d8b" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1b5e20", marginTop: 4 },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dce8dc",
    marginTop: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#263238" },
  cardCourse: { fontSize: 12, color: "#2e7d32", marginTop: 2 },
  cardDesc: { fontSize: 13, color: "#546e7a", marginTop: 6 },
  cardIngredients: { fontSize: 12, color: "#37474f", marginTop: 8 },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#1b5e20", marginTop: 8 },
  deleteBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd8dc",
    alignSelf: "flex-start",
  },

  formHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b5e20",
    marginBottom: 12,
  },
  label: { fontSize: 12, color: "#607d8b", marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd8dc",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  courseRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    backgroundColor: "#fff",
  },
  pillText: { fontSize: 13, color: "#37474f" },

  ingredientsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    backgroundColor: "#fff",
  },
  ingredientText: { fontSize: 13, color: "#37474f" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#1b5e20",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 8 },
  emptyMsg: { fontSize: 13, color: "#607d8b", textAlign: "center", marginTop: 6 },
});
