// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Pantallas
import GestionPostresScreen from './screens/GestionPostresScreen';
import RegistrarPedidoScreen from './screens/RegistrarPedidoScreen';
import ConsolidadoProduccionScreen from './screens/ConsolidadoProduccionScreen';
import GestionEntregasPagosScreen from './screens/GestionEntregasPagosScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = Ionicons;

          switch (route.name) {
            case 'Registrar Pedido':
              IconComponent = MaterialCommunityIcons;
              iconName = focused ? 'clipboard-edit' : 'clipboard-edit-outline';
              break;

            case 'Entregas y Pagos':
              iconName = focused ? 'car' : 'car-outline';
              break;

            case 'Consolidado':
              IconComponent = MaterialCommunityIcons;
              iconName = focused ? 'chart-pie' : 'chart-pie-outline';
              break;

            case 'Gestión de Postres':
              iconName = focused ? 'settings' : 'settings-outline';
              break;

            default:
              iconName = 'ellipse';
              break;
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2c3e50', // Azul gris oscuro
        tabBarInactiveTintColor: '#95a5a6', // Gris claro
        tabBarStyle: {
          backgroundColor: '#ffffff', // Fondo blanco puro
          borderTopWidth: 0.5,
          borderTopColor: '#dcdcdc',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Registrar Pedido" component={RegistrarPedidoScreen} />
      <Tab.Screen name="Entregas y Pagos" component={GestionEntregasPagosScreen} />
      <Tab.Screen name="Consolidado" component={ConsolidadoProduccionScreen} />
      <Tab.Screen name="Gestión de Postres" component={GestionPostresScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
