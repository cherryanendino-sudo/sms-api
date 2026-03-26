import {PermissionsAndroid, Platform} from 'react-native';

/**
 * Request all runtime permissions required by the SMS Gateway.
 * Returns true only if ALL permissions were granted.
 */
export async function requestAllPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
    ]);

    const allGranted = Object.values(results).every(
      result => result === PermissionsAndroid.RESULTS.GRANTED,
    );

    return allGranted;
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
}

/**
 * Check if all required permissions are already granted.
 */
export async function checkAllPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const sms = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
    );
    const phone = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    );

    return sms && phone;
  } catch {
    return false;
  }
}
