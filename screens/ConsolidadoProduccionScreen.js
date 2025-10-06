// screens/ConsolidadoProduccionScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getItem, saveItem, removeItem } from '../utils/storage';

const PEDIDOS_STORAGE_KEY = 'pedidos';
const ARCHIVED_PEDIDOS_STORAGE_KEY = 'archived_pedidos';

export default function ConsolidadoProduccionScreen() {
    const [consolidado, setConsolidado] = useState({}); // { postreId: { nombre, cantidad, precioUnitario, total } }
    const [totalGeneral, setTotalGeneral] = useState(0);
    const [cantidadTotalPostres, setCantidadTotalPostres] = useState(0);
    const [pedidos, setPedidos] = useState([]); // Almacena los pedidos actuales para archivar

    useFocusEffect(
        useCallback(() => {
            loadConsolidado();
        }, [])
    );

    const loadConsolidado = async () => {
        try {
            let storedPedidos = await getItem(PEDIDOS_STORAGE_KEY) || [];
            if (!Array.isArray(storedPedidos)) storedPedidos = [];

            setPedidos(storedPedidos); // Guardamos los pedidos para el botón de "Iniciar Nueva Venta"

            const newConsolidado = {};
            let currentTotalGeneral = 0;
            let currentCantidadTotalPostres = 0;

            // Recorremos pedidos solo si tienen items como array (defensa)
            storedPedidos.forEach(pedido => {
                if (!pedido || !Array.isArray(pedido.items)) return;

                pedido.items.forEach(item => {
                    // defensas sobre campos posibles undefined/null
                    const id = item?.id ?? JSON.stringify(item?.nombre ?? Math.random());
                    const nombre = item?.nombre ?? '-';
                    const cantidad = Number(item?.cantidad ?? 0);
                    const precioUnitario = Number(item?.precioUnitario ?? 0);

                    if (!newConsolidado[id]) {
                        newConsolidado[id] = {
                            nombre,
                            cantidad: 0,
                            precioUnitario,
                            total: 0,
                        };
                    }

                    newConsolidado[id].cantidad += cantidad;
                    newConsolidado[id].total += cantidad * precioUnitario;

                    currentCantidadTotalPostres += cantidad;
                    currentTotalGeneral += cantidad * precioUnitario;
                });
            });

            setConsolidado(newConsolidado);
            setTotalGeneral(currentTotalGeneral);
            setCantidadTotalPostres(currentCantidadTotalPostres);
        } catch (error) {
            console.error('Error en loadConsolidado:', error);
            Alert.alert('Error', 'No fue posible cargar el consolidado.');
        }
    };

    const handleCopiarConsolidado = async () => {
        if (Object.keys(consolidado).length === 0) {
            Alert.alert('Información', 'No hay pedidos para consolidar.');
            return;
        }

        let textoConsolidado = "📝 Consolidado de Pedidos:\n\n";
        textoConsolidado += "--------------------------------------\n";

        Object.values(consolidado).forEach(item => {
            const nombre = String(item?.nombre ?? '-');
            const cantidad = Number(item?.cantidad ?? 0);
            const precioUnitario = Number(item?.precioUnitario ?? 0);
            const total = Number(item?.total ?? 0);

            textoConsolidado += `Postre: ${nombre}\n`;
            textoConsolidado += `Cantidad: ${cantidad}\n`;
            textoConsolidado += `Precio Unitario: $${precioUnitario.toLocaleString()}\n`;
            textoConsolidado += `Total: $${total.toLocaleString()}\n`;
            textoConsolidado += "--------------------------------------\n";
        });

        textoConsolidado += `TOTAL GENERAL DE POSTRES: ${Number(cantidadTotalPostres ?? 0)}\n`;
        textoConsolidado += `INGRESO TOTAL: $${Number(totalGeneral ?? 0).toLocaleString()}\n\n`;
        textoConsolidado += "¡Gracias por tu compra! 😊";

        try {
            await Share.share({
                message: textoConsolidado,
                title: 'Consolidado de Pedidos',
            });
        } catch (error) {
            Alert.alert('Error al compartir', (error && error.message) ? error.message : 'Error desconocido');
        }
    };

    const handleIniciarNuevaVenta = async () => {
        if (Object.keys(consolidado).length === 0) {
            Alert.alert('Información', 'No hay pedidos actuales para archivar. Ya puedes iniciar una nueva venta.');
            return;
        }

        Alert.alert(
            'Iniciar Nueva Venta',
            'Esto archivará todos los pedidos actuales y borrará el consolidado. ¿Estás seguro?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sí, Iniciar Nueva Venta',
                    onPress: async () => {
                        try {
                            const archivedPedidos = (await getItem(ARCHIVED_PEDIDOS_STORAGE_KEY)) || [];
                            const updatedArchivedPedidos = Array.isArray(archivedPedidos) ? [...archivedPedidos, ...pedidos] : [...pedidos];
                            await saveItem(ARCHIVED_PEDIDOS_STORAGE_KEY, updatedArchivedPedidos);

                            await removeItem(PEDIDOS_STORAGE_KEY);
                            setConsolidado({});
                            setTotalGeneral(0);
                            setCantidadTotalPostres(0);
                            setPedidos([]); // Limpiar la lista de pedidos actuales
                            Alert.alert('Éxito', '¡Nueva venta iniciada! Pedidos archivados.');
                        } catch (err) {
                            console.error('Error archivando pedidos:', err);
                            Alert.alert('Error', 'No se pudo iniciar nueva venta.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Consolidado y Producción</Text>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.button} onPress={handleCopiarConsolidado}>
                        <Text style={styles.buttonText}>Copiar Consolidado</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.newSaleButton]} onPress={handleIniciarNuevaVenta}>
                        <Text style={styles.buttonText}>Iniciar Nueva Venta</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.tableContainer}>
                    {Object.keys(consolidado).length === 0 ? (
                        <Text style={styles.noDataText}>No hay datos de pedidos actuales para consolidar.</Text>
                    ) : (
                        <View style={styles.table}>
                            {/* Header de la tabla */}
                            <View style={styles.tableRowHeader}>
                                <Text style={[styles.tableCellHeader, styles.cellPostre]}>Postre</Text>
                                <Text style={[styles.tableCellHeader, styles.cellCantidad]}>Cant.</Text>
                                <Text style={[styles.tableCellHeader, styles.cellPrecioUnitario]}>P. Unit.</Text>
                                <Text style={[styles.tableCellHeader, styles.cellTotal]}>Total</Text>
                            </View>

                            {/* Filas de datos */}
                            {Object.values(consolidado).map((item, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.cellPostre]}>{String(item?.nombre ?? '-')}</Text>
                                    <Text style={[styles.tableCell, styles.cellCantidad]}>{Number(item?.cantidad ?? 0)}</Text>
                                    <Text style={[styles.tableCell, styles.cellPrecioUnitario]}>${Number(item?.precioUnitario ?? 0).toLocaleString()}</Text>
                                    <Text style={[styles.tableCell, styles.cellTotal]}>${Number(item?.total ?? 0).toLocaleString()}</Text>
                                </View>
                            ))}

                            {/* Fila de TOTAL */}
                            <View style={[styles.tableRow, styles.totalRow]}>
                                <Text style={[styles.tableCell, styles.cellPostre, styles.totalText]}>TOTAL</Text>
                                <Text style={[styles.tableCell, styles.cellCantidad, styles.totalText]}>{Number(cantidadTotalPostres ?? 0)}</Text>
                                <Text style={[styles.tableCell, styles.cellPrecioUnitario, styles.totalText]}>{''}</Text>
                                <Text style={[styles.tableCell, styles.cellTotal, styles.totalText]}>${Number(totalGeneral ?? 0).toLocaleString()}</Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa', // fondo suave
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#2c3e50', // color principal
        textAlign: 'center',
        marginTop: 10,
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#006d96', // color primario (azul)
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 3,
    },
    newSaleButton: {
        backgroundColor: '#2c3e50', // variante más oscura
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    tableContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 3,
        overflow: 'hidden',
    },
    table: {
        width: '100%',
    },
    tableRowHeader: {
        flexDirection: 'row',
        backgroundColor: '#006d96', // header en azul
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e6f0f4',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    totalRow: {
        backgroundColor: '#eaf6fb', // celda total muy suave
        borderTopWidth: 2,
        borderTopColor: '#006d96',
        paddingVertical: 15,
    },
    tableCellHeader: {
        color: '#fff',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 14,
    },
    tableCell: {
        color: '#333',
        textAlign: 'center',
        fontSize: 14,
        paddingHorizontal: 5,
    },
    cellPostre: {
        flex: 3,
        textAlign: 'left',
        paddingLeft: 12,
    },
    cellCantidad: {
        flex: 1.2,
    },
    cellPrecioUnitario: {
        flex: 1.6,
    },
    cellTotal: {
        flex: 1.8,
        textAlign: 'right',
        paddingRight: 12,
    },
    totalText: {
        fontWeight: '800',
        fontSize: 16,
        color: '#2c3e50',
    },
    noDataText: {
        textAlign: 'center',
        color: '#95a5a6',
        fontSize: 16,
        marginTop: 50,
        paddingHorizontal: 20,
    },
});
