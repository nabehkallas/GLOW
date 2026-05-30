import { Platform } from 'react-native';

const MOBILE_IP = '172.20.10.2'; // your machine's LAN IP for Expo Go on phone

export const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000/api'
  : `http://${MOBILE_IP}:8000/api`;
