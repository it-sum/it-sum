import { google } from 'googleapis';
import { GoogleDriveAdapter } from './google-drive.adapter';
import type { DriveAdapter } from './types';

export interface OAuthUserDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface SharedDriveConfig {
  serviceAccountJson: string;
  sharedDriveId: string;
}

export function createOAuthUserDrive(config: OAuthUserDriveConfig): DriveAdapter {
  const auth = new google.auth.OAuth2(config.clientId, config.clientSecret);
  auth.setCredentials({ refresh_token: config.refreshToken });
  return new GoogleDriveAdapter({ auth, driveType: 'my_drive' });
}

export function createSharedDrive(config: SharedDriveConfig): DriveAdapter {
  const credentials = JSON.parse(config.serviceAccountJson) as object;
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return new GoogleDriveAdapter({ auth, driveType: 'shared_drive', sharedDriveId: config.sharedDriveId });
}
