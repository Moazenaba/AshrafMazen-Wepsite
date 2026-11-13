// Puts the chosen font of the sheikh's name on the page: .font-name (index.css) reads the --name-font variable.
import { nameFontOf } from '../constants/nameFonts';

export function applyNameFont(id: string | null | undefined): void {
  document.documentElement.style.setProperty('--name-font', nameFontOf(id).family);
}
