/**
 * App Navigator - 导航栈配置
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';

// 路由参数类型定义
export type RootStackParamList = {
    Home: undefined;
    CreateTask: undefined;
    TaskDetail: { taskId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#0F172A' },
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
                <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
