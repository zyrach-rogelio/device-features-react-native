export interface TravelEntry {
  id: string;
  imageUri: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
};

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  danger: string;
  inputBg: string;
}