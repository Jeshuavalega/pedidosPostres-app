// screens/GestionPostresScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveItem, getItem } from '../utils/storage';
import uuid from 'react-native-uuid';

const POSTRES_STORAGE_KEY = 'postres';

export default function GestionPostresScreen() {
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');
    const [postres, setPostres] = useState([]);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadPostres();
    }, []);

    const loadPostres = async () => {
        const storedPostres = await getItem(POSTRES_STORAGE_KEY);
        if (storedPostres) setPostres(storedPostres);
    };

    const handleAddUpdatePostre = async () => {
        if (!nombre.trim() || !precio.trim()) {
            Alert.alert('Error', 'Por favor, ingresa el nombre y el precio del postre.');
            return;
        }

        const precioNum = parseFloat(precio);
        if (isNaN(precioNum) || precioNum <= 0) {
            Alert.alert('Error', 'Por favor, ingresa un precio válido.');
            return;
        }

        let updatedPostres;
        if (editingId) {
            updatedPostres = postres.map(p =>
                p.id === editingId ? { ...p, nombre: nombre.trim(), precio: precioNum } : p
            );
            setEditingId(null);
        } else {
            const newPostre = {
                id: uuid.v4(),
                nombre: nombre.trim(),
                precio: precioNum,
                disponibleHoy: true,
            };
            updatedPostres = [...postres, newPostre];
        }

        setPostres(updatedPostres);
        await saveItem(POSTRES_STORAGE_KEY, updatedPostres);
        setNombre('');
        setPrecio('');
    };

    const handleDeletePostre = async (id) => {
        Alert.alert(
            'Eliminar Postre',
            '¿Seguro que deseas eliminar este postre?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    onPress: async () => {
                        const updatedPostres = postres.filter(p => p.id !== id);
                        setPostres(updatedPostres);
                        await saveItem(POSTRES_STORAGE_KEY, updatedPostres);
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    const toggleDisponibilidad = async (id) => {
        const updatedPostres = postres.map(p =>
            p.id === id ? { ...p, disponibleHoy: !p.disponibleHoy } : p
        );
        setPostres(updatedPostres);
        await saveItem(POSTRES_STORAGE_KEY, updatedPostres);
    };

    const renderPostreItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.nombre}</Text>
                <Text style={styles.cardPrice}>${item.precio.toLocaleString()}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleDeletePostre(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#e91e63" />
                </TouchableOpacity>
                <Switch
                    onValueChange={() => toggleDisponibilidad(item.id)}
                    value={item.disponibleHoy}
                    trackColor={{ false: "#ccc", true: "#006e9670" }}
                    thumbColor={item.disponibleHoy ? "#006d96" : "#f4f3f4"}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Gestión de Postres</Text>
            <Text style={styles.subHeader}>
                Tu catálogo personal. Añade, edita y gestiona la disponibilidad de tus postres.
            </Text>

            <View style={styles.inputGroup}>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre del Postre"
                    value={nombre}
                    onChangeText={setNombre}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Precio Unitario"
                    keyboardType="numeric"
                    value={precio}
                    onChangeText={setPrecio}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddUpdatePostre}>
                    <Text style={styles.addButtonText}>
                        {editingId ? 'Actualizar Postre' : 'Añadir Postre'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tu Menú</Text>
                <Text style={styles.sectionSubtitle}>
                    Activa el interruptor para los postres disponibles hoy.
                </Text>
            </View>

            <FlatList
                data={postres}
                renderItem={renderPostreItem}
                keyExtractor={item => item.id.toString()}
                style={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // fondo suave
        padding: 20,
        paddingTop: 50,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 25,
        color: '#2c3e50', // color principal
        textAlign: 'left',
    },
    subHeader: {
        fontSize: 14,
        color: '#2c3e50', // color principal
        marginBottom: 25,
        marginTop: 4,
    },
    inputGroup: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#eee',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        color: '#333', // texto oscuro
    },
    addButton: {
        backgroundColor: '#006d96', // color primario (azul)
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    sectionHeader: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2c3e50', // color principal
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#2c3e50', // color principal
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50', // color principal
    },
    cardPrice: {
        fontSize: 14,
        color: '#333', // texto oscuro
        marginTop: 4,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
});

