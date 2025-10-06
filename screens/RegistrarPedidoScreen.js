// screens/RegistrarPedidoScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { saveItem, getItem } from '../utils/storage';
import uuid from 'react-native-uuid';
import { colors, globalStyles } from '../utils/theme';


const POSTRES_STORAGE_KEY = 'postres';
const PEDIDOS_STORAGE_KEY = 'pedidos';

export default function RegistrarPedidoScreen() {
    const [nombreCliente, setNombreCliente] = useState('');
    const [postresDisponibles, setPostresDisponibles] = useState([]);
    const [pedidoActual, setPedidoActual] = useState({});
    const [totalPedido, setTotalPedido] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadPostresDisponibles();
        }, [])
    );

    useEffect(() => {
        calculateTotal();
    }, [pedidoActual]);

    const loadPostresDisponibles = async () => {
        const storedPostres = await getItem(POSTRES_STORAGE_KEY);
        if (storedPostres) {
            const disponibles = storedPostres.filter(p => p.disponibleHoy);
            setPostresDisponibles(disponibles);
            const newPedidoActual = {};
            disponibles.forEach(p => {
                if (pedidoActual[p.id]) {
                    newPedidoActual[p.id] = pedidoActual[p.id];
                }
            });
            setPedidoActual(newPedidoActual);
        }
    };

    const handleQuantityChange = (postreId, change) => {
        setPedidoActual(prev => {
            const currentQuantity = prev[postreId] || 0;
            const newQuantity = currentQuantity + change;
            if (newQuantity < 0) return prev;

            const updated = { ...prev };
            if (newQuantity === 0) {
                delete updated[postreId];
            } else {
                updated[postreId] = newQuantity;
            }
            return updated;
        });
    };

    const calculateTotal = () => {
        let sum = 0;
        postresDisponibles.forEach(postre => {
            const quantity = pedidoActual[postre.id] || 0;
            sum += quantity * postre.precio;
        });
        setTotalPedido(sum);
    };

    const handleGuardarPedido = async () => {
        if (!nombreCliente.trim()) {
            Alert.alert('Error', 'Por favor, ingresa el nombre del cliente.');
            return;
        }

        const itemsPedido = Object.keys(pedidoActual)
            .filter(postreId => pedidoActual[postreId] > 0)
            .map(postreId => {
                const postreInfo = postresDisponibles.find(p => p.id === postreId);
                if (!postreInfo) return null;
                return {
                    id: postreId,
                    nombre: postreInfo.nombre,
                    precioUnitario: postreInfo.precio,
                    cantidad: pedidoActual[postreId],
                };
            }).filter(Boolean);

        if (itemsPedido.length === 0) {
            Alert.alert('Error', 'El pedido no puede estar vacío.');
            return;
        }

        const newPedido = {
            id: uuid.v4(),
            cliente: nombreCliente.trim(),
            fecha: new Date().toISOString(),
            items: itemsPedido,
            total: totalPedido,
            estadoPago: 'pendiente',
            estadoEntrega: false,
        };

        const storedPedidos = await getItem(PEDIDOS_STORAGE_KEY) || [];
        const updatedPedidos = [...storedPedidos, newPedido];
        await saveItem(PEDIDOS_STORAGE_KEY, updatedPedidos);

        Alert.alert('Éxito', 'Pedido guardado correctamente.');
        setNombreCliente('');
        setPedidoActual({});
        setTotalPedido(0);
    };

    const getResumenPedido = () => {
        const items = Object.keys(pedidoActual)
            .filter(postreId => pedidoActual[postreId] > 0)
            .map(postreId => {
                const postreInfo = postresDisponibles.find(p => p.id === postreId);
                if (!postreInfo) return null;
                return `${pedidoActual[postreId]}x ${postreInfo.nombre} $${postreInfo.precio.toLocaleString()}`;
            })
            .filter(Boolean);

        if (items.length === 0) return 'Añade postres al pedido';

        return `${items.join('\n')}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={globalStyles.container}>
                <Text style={globalStyles.header}>Registrar Pedido</Text>
                <Text style={globalStyles.subHeader}>Libreta digital</Text>

                <View style={styles.inputSection}>
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Nombre del Cliente"
                        placeholderTextColor="#95a5a6"
                        value={nombreCliente}
                        onChangeText={setNombreCliente}
                    />
                </View>

                <ScrollView contentContainerStyle={styles.postresList}>
                    <View style={styles.postresGrid}>
                        {postresDisponibles.length === 0 ? (
                            <Text style={styles.noPostresText}>
                                No hay postres disponibles hoy. Ve a "Gestión de Postres" para activarlos.
                            </Text>
                        ) : (
                            postresDisponibles.map(postre => (
                                <View key={postre.id} style={styles.postreCard}>
                                    <View>
                                        <Text style={styles.postreCardName}>{postre.nombre}</Text>
                                        <Text style={styles.postreCardPrice}>${postre.precio.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.quantityControl}>
                                        <TouchableOpacity
                                            onPress={() => handleQuantityChange(postre.id, -1)}
                                            style={styles.quantityButton}>
                                            <Text style={styles.quantityButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{pedidoActual[postre.id] || 0}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleQuantityChange(postre.id, 1)}
                                            style={styles.quantityButton}>
                                            <Text style={styles.quantityButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                <View style={styles.summaryPanel}>
                    <Text style={styles.summaryPanelHeader}>Nuevo Pedido</Text>
                    <View style={styles.summaryInfo}>
                        <Text style={styles.summaryLabel}>Cliente:</Text>
                        <Text style={styles.summaryValue}>{nombreCliente || 'Ej: Jeshua'}</Text>
                        <Text style={styles.summaryLabel}>Resumen:</Text>
                        <Text style={styles.summaryValue}>{getResumenPedido()}</Text>
                    </View>

                    <View style={styles.totalBox}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>${totalPedido.toLocaleString()}</Text>
                    </View>

                    <TouchableOpacity onPress={handleGuardarPedido} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Guardar Pedido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
    container: { flex: 1, paddingHorizontal: 15, backgroundColor: '#f8f9fa' },

    header: { fontSize: 26, fontWeight: 'bold', marginBottom: 5, color: '#2c3e50', textAlign: 'center', marginTop: 10 },
    subHeader: { fontSize: 14, color: '#95a5a6', marginBottom: 20, textAlign: 'center' },

    inputSection: { marginBottom: 20 },
    input: {
        borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#fff',
        color: '#2c3e50'
    },

    ppostresList: {
        flexGrow: 1,
        paddingBottom: 100, // deja espacio para el panel inferior
    },

    postresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    noPostresText: { textAlign: 'center', color: '#95a5a6', fontSize: 16, marginTop: 50 },

    postreCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        width: '48%', // dos columnas con pequeño margen
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },

    postreCardName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003a54',
        textAlign: 'center',
    },

    postreCardPrice: {
        fontSize: 14,
        color: '#666',
        marginTop: 3,
        textAlign: 'center',
    },

    quantityControl: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },

    quantityButton: {
        backgroundColor: '#e3f2fd',
        width: 35,
        height: 35,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    quantityButtonText: { fontSize: 20, fontWeight: 'bold', color: '#006d96' },
    quantityText: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', minWidth: 25, textAlign: 'center' },

    summaryPanel: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingVertical: 10,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },

    summaryPanelHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: '#003a54',
        textAlign: 'center',
        marginBottom: 8,
    },

    summaryInfo: {
        backgroundColor: '#fdf6f0',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e8b4b8',
    },

    summaryLabel: {
        fontSize: 15,          // un poco más grande
        fontWeight: '600',     // más negrita
        color: '#003a54',      // color rosa principal para destacar
        marginBottom: 2,
    },

    summaryValue: {
        fontSize: 15,
        fontWeight: '400',
        color: '#333',
        marginBottom: 6,
    },

    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: 10,
    },

    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#003a54',
    },

    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#006d96',
    },

    saveButton: {
        backgroundColor: '#003a54',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },

    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

});
