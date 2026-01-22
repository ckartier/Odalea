import { Platform } from 'react-native';
import NativeMapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import WebMapFallback from './WebMapFallback';

const MapView = Platform.OS === 'web' ? WebMapFallback : NativeMapView;

export default MapView;
export { PROVIDER_GOOGLE };