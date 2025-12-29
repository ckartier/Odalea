import { Platform } from 'react-native';

import GooglePlaceMarkerNative from './GooglePlaceMarker.native';
import GooglePlaceMarkerWeb from './GooglePlaceMarker.web';

const GooglePlaceMarker = Platform.OS === 'web' ? GooglePlaceMarkerWeb : GooglePlaceMarkerNative;

export default GooglePlaceMarker;
