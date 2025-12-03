import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Hereda las reglas recomendadas para Next.js core web vitals y TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Permite usar 'any' pero con advertencia
      "@typescript-eslint/no-explicit-any": "warn",
      // No marcar error por variables no usadas si empiezan con "_"
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ],
      // React hooks useEffect: advertencia por dependencias faltantes
      "react-hooks/exhaustive-deps": "warn",
      // Uso de <img> en lugar de <Image> genera advertencia
      "@next/next/no-img-element": "warn",
    }
  }
];

export default eslintConfig;
