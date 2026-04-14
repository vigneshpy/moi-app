import {
	useFonts as useCormorant,
	CormorantGaramond_500Medium,
	CormorantGaramond_500Medium_Italic,
	CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
	AnekTamil_400Regular,
	AnekTamil_500Medium,
	AnekTamil_700Bold,
} from "@expo-google-fonts/anek-tamil";

/** Load all theme fonts. Returns `true` once ready. */
export function useAppFonts(): boolean {
	const [loaded] = useCormorant({
		CormorantGaramond_500Medium,
		CormorantGaramond_500Medium_Italic,
		CormorantGaramond_700Bold,
		AnekTamil_400Regular,
		AnekTamil_500Medium,
		AnekTamil_700Bold,
	});
	return loaded;
}
