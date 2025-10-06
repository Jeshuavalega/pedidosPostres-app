// screens/GestionEntregasPagosScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; // <-- Importamos Ionicons
import { useFocusEffect } from '@react-navigation/native';
import { getItem, saveItem } from '../utils/storage';
import Checkbox from 'expo-checkbox';

const PEDIDOS_STORAGE_KEY = 'pedidos';

export default function GestionEntregasPagosScreen() {
    const [pedidos, setPedidos] = useState([]);

    useFocusEffect(
        useCallback(() => {
            loadPedidos();
        }, [])
    );

    const loadPedidos = async () => {
        const storedPedidos = await getItem(PEDIDOS_STORAGE_KEY) || [];
        const sortedPedidos = storedPedidos.sort((a, b) => {
            if (a.estadoEntrega && !b.estadoEntrega) return 1;
            if (!a.estadoEntrega && b.estadoEntrega) return -1;
            return new Date(b.fecha) - new Date(a.fecha);
        });
        setPedidos(sortedPedidos);
    };

    const handleEstadoPagoChange = async (pedidoId, tipoPago) => {
        const updatedPedidos = pedidos.map(p => {
            if (p.id === pedidoId) {
                const nuevoEstadoPago = p.estadoPago === tipoPago ? 'pendiente' : tipoPago;
                return { ...p, estadoPago: nuevoEstadoPago };
            }
            return p;
        });
        setPedidos(updatedPedidos);
        await saveItem(PEDIDOS_STORAGE_KEY, updatedPedidos);
    };

    const handleToggleEntrega = async (pedidoId) => {
        const updatedPedidos = pedidos.map(p =>
            p.id === pedidoId ? { ...p, estadoEntrega: !p.estadoEntrega } : p
        );
        const sortedPedidos = updatedPedidos.sort((a, b) => {
            if (a.estadoEntrega && !b.estadoEntrega) return 1;
            if (!a.estadoEntrega && b.estadoEntrega) return -1;
            return new Date(b.fecha) - new Date(a.fecha);
        });
        setPedidos(sortedPedidos);
        await saveItem(PEDIDOS_STORAGE_KEY, sortedPedidos);
    };

    const handleDeletePedido = async (pedidoId) => {
        Alert.alert(
            "Eliminar Pedido",
            "¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        const updatedPedidos = pedidos.filter(p => p.id !== pedidoId);
                        setPedidos(updatedPedidos);
                        await saveItem(PEDIDOS_STORAGE_KEY, updatedPedidos);
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const getResumenPedidoTexto = (items) => {
        if (!items || items.length === 0) return '0 postres - $0';

        let totalItems = 0;
        let totalMonetary = 0;

        items.forEach(item => {
            const cantidad = parseFloat(item.cantidad) || 0;
            const precio = parseFloat(item.precioUnitario) || 0; // Usamos precioUnitario
            totalItems += cantidad;
            totalMonetary += (cantidad * precio);
        });

        return `${totalItems} postres - $${totalMonetary.toLocaleString()}`;
    };


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Gestión de Entregas y Pagos</Text>
            <Text style={styles.subHeader}>Tu lista de tareas para despachar y cobrar.</Text>

            <ScrollView style={styles.pedidosList}>
                {pedidos.length === 0 ? (
                    <Text style={styles.noPedidosText}>
                        No hay pedidos registrados. ¡Añade algunos en la pantalla "Registrar Pedido"!
                    </Text>
                ) : (
                    pedidos.map(pedido => (
                        <View
                            key={pedido.id}
                            style={styles.pedidoCard}
                        >
                            {/* CABECERA: Nombre del Cliente y Badge de Estado/Total */}
                            <View style={styles.cardTopRow}>
                                <Text style={styles.pedidoClienteName}>{pedido.cliente || 'Sin nombre'}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    pedido.estadoEntrega ? styles.statusBadgeDelivered : styles.statusBadgePending
                                ]}>
                                    <Text style={styles.statusBadgeText}>
                                        {pedido.estadoEntrega ? 'Entregado' : 'Pendiente'}
                                    </Text>
                                </View>
                            </View>

                            {/* Resumen de postres y total */}
                            <Text style={styles.pedidoSummaryText}>
                                {getResumenPedidoTexto(pedido.items)}
                            </Text>

                            {/* Detalle del Pedido */}
                            <Text style={styles.sectionTitle}>Detalle del Pedido</Text>
                            {pedido.items && pedido.items.map((item, index) => {
                                const cantidad = parseFloat(item.cantidad) || 0;
                                const precio = parseFloat(item.precioUnitario) || 0; // Usamos precioUnitario
                                const itemTotal = cantidad * precio;

                                return (
                                    <View key={index} style={styles.itemRow}>
                                        <Text style={styles.itemText}>{cantidad}x {item.nombre}</Text>
                                        <Text style={styles.itemPrice}>${itemTotal.toLocaleString()}</Text>
                                    </View>
                                );
                            })}

                            {/* Estado de Pago */}
                            <Text style={styles.sectionTitle}>Estado de Pago</Text>
                            <View style={styles.paymentMethodContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.paymentMethodButton,
                                        pedido.estadoPago === 'efectivo' && styles.paymentMethodButtonActive,
                                    ]}
                                    onPress={() => handleEstadoPagoChange(pedido.id, 'efectivo')}
                                >
                                    <MaterialCommunityIcons
                                        name="cash-multiple"
                                        size={20}
                                        color={pedido.estadoPago === 'efectivo' ? '#FF69B4' : '#555'}
                                    />
                                    <Text
                                        style={[
                                            styles.paymentMethodText,
                                            pedido.estadoPago === 'efectivo' && styles.paymentMethodTextActive,
                                        ]}
                                    >
                                        Efectivo
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.paymentMethodButton,
                                        pedido.estadoPago === 'transferencia' && styles.paymentMethodButtonActive,
                                    ]}
                                    onPress={() => handleEstadoPagoChange(pedido.id, 'transferencia')}
                                >
                                    <MaterialCommunityIcons
                                        name="credit-card-outline"
                                        size={20}
                                        color={pedido.estadoPago === 'transferencia' ? '#FF69B4' : '#555'}
                                    />
                                    <Text
                                        style={[
                                            styles.paymentMethodText,
                                            pedido.estadoPago === 'transferencia' && styles.paymentMethodTextActive,
                                        ]}
                                    >
                                        Transferencia
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Marcar como Entregado y Botón de Eliminar */}
                            <View style={styles.bottomActionsContainer}>
                                <View style={styles.checkboxContainer}>
                                    <Checkbox
                                        value={pedido.estadoEntrega}
                                        onValueChange={() => handleToggleEntrega(pedido.id)}
                                        color={pedido.estadoEntrega ? '#FF69B4' : '#ccc'}
                                        style={styles.checkbox}
                                    />
                                    <Text style={styles.checkboxLabel}>Marcar como Entregado</Text>
                                </View>

                                {/* Botón de Eliminar con Ionicons */}
                                <TouchableOpacity onPress={() => handleDeletePedido(pedido.id)} style={styles.deleteIconButton}>
                                    <Ionicons name="trash-outline" size={24} color="#e91e63" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f8f8',
        paddingTop: 50,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#003a54',
        textAlign: 'center',
    },
    subHeader: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    noPedidosText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        marginTop: 50,
    },
    pedidoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    pedidoClienteName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    statusBadgePending: {
        backgroundColor: '#fce4ec', // Rosa muy claro
    },
    statusBadgeDelivered: {
        backgroundColor: '#e8f5e9', // Verde muy claro
    },
    statusBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#d81b60', // Rosa fuerte para texto
    },
    pedidoSummaryText: {
        fontSize: 14,
        color: '#777',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        marginTop: 15,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemText: {
        fontSize: 15,
        color: '#555',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
    paymentMethodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        borderRadius: 10,
        padding: 5,
    },
    paymentMethodButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 3,
        backgroundColor: '#f0f2f5ff',
    },
    paymentMethodButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    paymentMethodText: {
        marginLeft: 8,
        fontSize: 15,
        fontWeight: '500',
        color: '#555',
    },
    paymentMethodTextActive: {
        color: '#d81b60',
    },
    bottomActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 15,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        borderRadius: 4,
        width: 20,
        height: 20,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 15,
        color: '#333',
    },
    // Eliminamos 'optionsButton' ya que ahora es un icono de eliminar directo
    deleteIconButton: { // Nuevo estilo para el botón de icono de eliminar
        padding: 5,
    },
});