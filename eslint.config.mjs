import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Relaja 'any' a warning en lugar de error
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Ignora variables que empiecen con _ (convención para params no usados)
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_", 
        "varsIgnorePattern": "^_" 
      }],
      
      // Permite useEffect warnings (arreglar con useCallback después)
      "react-hooks/exhaustive-deps": "warn",
      
      // Hace img warning en lugar de error (reemplazar gradualmente)
      "@next/next/no-img-element": "warn",
      
      // Variables asignadas pero no usadas
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }
];

export default eslintConfig;
