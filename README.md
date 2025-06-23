# Creador de Informes SEO con IA

Este proyecto crea informes SEO utilizando la API de DataForSEO y el modelo Gemini de Google.

## Estructura del proyecto

*   `App.tsx`: Componente principal de la aplicación.
*   `components/`: Contiene los componentes de la interfaz de usuario.
*   `constants.ts`: Define las constantes utilizadas en la aplicación.
*   `index.tsx`: Punto de entrada de la aplicación.
*   `services/geminiService.ts`: Contiene la lógica para interactuar con la API de Gemini y DataForSEO.
*   `types.ts`: Define los tipos de datos utilizados en la aplicación.
*   `vite.config.ts`: Configuración de Vite.

## Variables de entorno

Las siguientes variables de entorno deben configurarse para que la aplicación funcione correctamente:

*   `GEMINI_API_KEY`: Clave API para el modelo Gemini.
*   `DATA_FOR_SEO_LOGIN`: Usuario para la API de DataForSEO.
*   `DATA_FOR_SEO_PASSWORD`: Contraseña para la API de DataForSEO.

Estas variables se configuran en el archivo `.env.local`.

## Configuración

1.  Clonar el repositorio.
2.  Ejecutar `npm install` para instalar las dependencias.
3.  Crear un archivo `.env.local` y configurar las variables de entorno.
4.  Ejecutar `npm run dev` para iniciar la aplicación en modo de desarrollo.

## Despliegue en Vercel

Este proyecto está configurado para ser desplegado en Vercel. Para configurar las variables de entorno en Vercel, siga estos pasos:

1.  Vaya al panel de control de su proyecto en Vercel.
2.  Haga clic en "Settings".
3.  Haga clic en "Environment Variables".
4.  Agregue las siguientes variables de entorno:
    *   `GEMINI_API_KEY`: Su clave API de Gemini.
    *   `DATA_FOR_SEO_LOGIN`: Su usuario de la API de DataForSEO.
    *   `DATA_FOR_SEO_PASSWORD`: Su contraseña de la API de DataForSEO.
5.  Asegúrese de que los nombres de las variables de entorno coincidan exactamente con los nombres utilizados en el código (por ejemplo, `DATA_FOR_SEO_LOGIN` y no `DATA_FOR_SEO_USER`).
6.  Vuelva a desplegar su proyecto.

## Notas

*   El nombre del modelo Gemini a utilizar se define en la constante `GEMINI_MODEL_NAME` en el archivo `constants.ts` (actualmente "gemini-2.5-flash-preview-04-17").
*   La URL base para la API de DataForSEO se define en la constante `DATA_FOR_SEO_BASE_URL` en el archivo `constants.ts` (actualmente "https://api.dataforseo.com").
*   Las solicitudes a la API de DataForSEO se realizan en **modo "live"** utilizando el endpoint `v3/on_page/instant_pages`. Esto proporciona resultados inmediatos sin necesidad de esperas o reintentos.
