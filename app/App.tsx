import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { AppProvider } from './context/AppContext';
import { I18nProvider } from './context/I18nContext';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <WalletProvider>
        <ThemeProvider>
          <I18nProvider defaultLanguage="en">
            <AppProvider>
              <AppNavigator />
            </AppProvider>
          </I18nProvider>
        </ThemeProvider>
      </WalletProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}



