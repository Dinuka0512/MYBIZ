import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from "react-native";
import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";

const Item = () => {
  const [items, setItems] = useState([
    { id: "1", name: "Rice Packet", price: "Rs 250", stock: "120" },
    { id: "2", name: "Dhal", price: "Rs 180", stock: "45", low: true },
    { id: "3", name: "Sugar", price: "Rs 220", stock: "90" },
  ]);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemStock, setItemStock] = useState("");

  /* ---------------- ADD ITEM ---------------- */
  const handleAddItem = () => {
    if (!itemName || !itemPrice || !itemStock) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name: itemName,
      price: itemPrice,
      stock: itemStock,
      low: Number(itemStock) <= 50, // mark low stock automatically
    };
    setItems([...items, newItem]);
    setItemName("");
    setItemPrice("");
    setItemStock("");
    setAddModal(false);
  };

  /* ---------------- EDIT ITEM ---------------- */
  const handleUpdateItem = () => {
    if (!selectedItem) return;
    const updatedList = items.map((i) =>
      i.id === selectedItem.id
        ? { ...i, name: itemName, price: itemPrice, stock: itemStock, low: Number(itemStock) <= 50 }
        : i
    );
    setItems(updatedList);
    setEditModal(false);
    setSelectedItem(null);
    setActiveItemId(null);
  };

  /* ---------------- DELETE ITEM ---------------- */
  const handleDeleteItem = (id: string) => {
    const filtered = items.filter((i) => i.id !== id);
    setItems(filtered);
    setActiveItemId(null);
  };

  return (
    <ScrollView className="flex-1 px-6 pt-10 bg-gray-100">

      {/* Header */}
      <View className="p-5 mb-4 bg-white shadow-sm rounded-3xl">
        <Text className="text-xs tracking-widest text-gray-400 uppercase">Items</Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900">Inventory</Text>
        <Text className="mt-1 text-sm text-gray-500">Manage your products and stock</Text>
      </View>

      {/* Add Item Button */}
      <TouchableOpacity
        onPress={() => setAddModal(true)}
        className="items-center p-4 mb-5 bg-black rounded-2xl"
      >
        <Text className="font-bold text-white">+ Add New Item</Text>
      </TouchableOpacity>

      {/* Search */}
      <View className="flex-row items-center p-4 mb-4 bg-white shadow-sm rounded-2xl">
        <Feather name="search" size={18} color="#9ca3af" className="mr-2" />
        <TextInput
          placeholder="Search item name"
          placeholderTextColor="#9ca3af"
          className="flex-1 text-gray-900"
        />
      </View>

      {/* Item List */}
      {items.map((i) => (
        <ItemCard
          key={i.id}
          id={i.id}
          name={i.name}
          price={i.price}
          stock={i.stock}
          low={i.low}
          isActive={activeItemId === i.id}
          onPress={() => setActiveItemId(activeItemId === i.id ? null : i.id)}
          onEdit={() => {
            setSelectedItem(i);
            setItemName(i.name);
            setItemPrice(i.price);
            setItemStock(i.stock);
            setEditModal(true);
            setActiveItemId(null);
          }}
          onDelete={() => handleDeleteItem(i.id)}
        />
      ))}

      {/* Add Item Modal */}
      <Modal transparent animationType="slide" visible={addModal}>
        <View className="justify-center flex-1 bg-black/30">
          <View className="p-6 mx-6 bg-white shadow-lg rounded-3xl">
            <Text className="mb-4 text-2xl font-bold text-gray-900">Add New Item</Text>

            <TextInput
              value={itemName}
              onChangeText={setItemName}
              placeholder="Item Name"
              className="p-4 mb-4 bg-gray-100 rounded-2xl"
            />
            <TextInput
              value={itemPrice}
              onChangeText={setItemPrice}
              placeholder="Price (Rs)"
              keyboardType="numeric"
              className="p-4 mb-4 bg-gray-100 rounded-2xl"
            />
            <TextInput
              value={itemStock}
              onChangeText={setItemStock}
              placeholder="Stock"
              keyboardType="numeric"
              className="p-4 mb-6 bg-gray-100 rounded-2xl"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setAddModal(false)}
                className="flex-1 p-4 mr-2 bg-gray-200 rounded-2xl"
              >
                <Text className="font-semibold text-center text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddItem}
                className="flex-1 p-4 ml-2 bg-black rounded-2xl"
              >
                <Text className="font-bold text-center text-white">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal transparent animationType="slide" visible={editModal}>
        <View className="justify-center flex-1 bg-black/30">
          <View className="p-6 mx-6 bg-white shadow-lg rounded-3xl">
            <Text className="mb-4 text-2xl font-bold text-gray-900">Edit Item</Text>

            <TextInput
              value={itemName}
              onChangeText={setItemName}
              placeholder="Item Name"
              className="p-4 mb-4 bg-gray-100 rounded-2xl"
            />
            <TextInput
              value={itemPrice}
              onChangeText={setItemPrice}
              placeholder="Price (Rs)"
              keyboardType="numeric"
              className="p-4 mb-4 bg-gray-100 rounded-2xl"
            />
            <TextInput
              value={itemStock}
              onChangeText={setItemStock}
              placeholder="Stock"
              keyboardType="numeric"
              className="p-4 mb-6 bg-gray-100 rounded-2xl"
            />

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setEditModal(false)}
                className="flex-1 p-4 mr-2 bg-gray-200 rounded-2xl"
              >
                <Text className="font-semibold text-center text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdateItem}
                className="flex-1 p-4 ml-2 bg-blue-600 rounded-2xl"
              >
                <Text className="font-bold text-center text-white">Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

export default Item;

/* ---------- Item Card Component ---------- */
const ItemCard = ({
  id,
  name,
  price,
  stock,
  low,
  isActive,
  onPress,
  onEdit,
  onDelete,
}: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="p-4 mb-3 bg-white shadow-sm rounded-2xl"
  >
    <View className="flex-row items-center justify-between">

      <View>
        <Text className="text-lg font-semibold text-gray-900">{name}</Text>
        <Text className="text-sm text-gray-400">{price}</Text>
      </View>

      <View className="items-end">
        <Text className="text-xs text-gray-400">Stock</Text>
        <Text className={`font-bold ${low ? "text-red-500" : "text-green-600"}`}>
          {stock}
        </Text>

        {isActive && (
          <View className="flex-row mt-3">
            <TouchableOpacity
              onPress={onEdit}
              className="p-2 mr-3 bg-blue-100 rounded-xl"
            >
              <Feather name="edit" size={18} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              className="p-2 bg-red-100 rounded-xl"
            >
              <Feather name="trash" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  </TouchableOpacity>
);
