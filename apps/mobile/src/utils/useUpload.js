import { useState, useCallback, useRef } from 'react';
import { UploadClient } from '@uploadcare/upload-client';
import { Alert } from 'react-native';

// Konstanten für Upload-Limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'application/pdf'
];

// Upload Client mit Fehlerbehandlung
let client;
try {
  const publicKey = process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY;
  if (publicKey) {
    client = new UploadClient({ publicKey });
  } else {
    console.warn('EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY not set - upload functionality may be limited');
  }
} catch (error) {
  console.error('Failed to initialize UploadClient:', error);
}

/**
 * Hook für sichere Datei-Uploads mit umfassender Validierung
 * @returns {[Function, Object]} Upload-Funktion und Loading-Status
 */
function useUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Input-Validierung
  const validateInput = useCallback((input) => {
    if (!input) {
      throw new Error('Keine Upload-Daten bereitgestellt');
    }

    // Validierung für React Native Asset
    if ("reactNativeAsset" in input && input.reactNativeAsset) {
      const asset = input.reactNativeAsset;
      
      if (asset.file) {
        // Dateigröße prüfen
        if (asset.file.size > MAX_FILE_SIZE) {
          throw new Error(`Datei ist zu groß. Maximum: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        }
        
        // MIME-Type prüfen
        if (asset.file.type && !ALLOWED_MIME_TYPES.includes(asset.file.type)) {
          throw new Error('Dateityp nicht unterstützt');
        }
      }
      
      // URI-Validierung
      if (asset.uri && !asset.uri.startsWith('file://') && !asset.uri.startsWith('content://')) {
        throw new Error('Ungültige Datei-URI');
      }
    }

    // URL-Validierung
    if ("url" in input && input.url) {
      try {
        new URL(input.url);
      } catch {
        throw new Error('Ungültige URL');
      }
    }

    // Base64-Validierung
    if ("base64" in input && input.base64) {
      if (typeof input.base64 !== 'string' || !input.base64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        throw new Error('Ungültiges Base64-Format');
      }
    }

    return true;
  }, []);

  // Sichere Fetch-Funktion mit Timeout
  const safeFetch = useCallback(async (url, options = {}) => {
    abortControllerRef.current = new AbortController();
    
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, 30000); // 30 Sekunden Timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal,
        headers: {
          'User-Agent': 'NichtRauchenApp/1.0.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload-Timeout: Verbindung zu langsam');
      }
      throw error;
    }
  }, []);

  const upload = useCallback(async (input) => {
    try {
      setLoading(true);
      setError(null);

      // Input validieren
      validateInput(input);

      let response;

      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        const asset = input.reactNativeAsset;

        if (asset.file) {
          const formData = new FormData();
          formData.append("file", asset.file);

          response = await safeFetch("/_create/api/upload/", {
            method: "POST",
            body: formData,
          });
        } else {
          // Fallback zu presigned Uploadcare upload
          const presignRes = await safeFetch("/_create/api/upload/presign/", {
            method: "POST",
          });

          if (!presignRes.ok) {
            throw new Error('Presign-Request fehlgeschlagen');
          }

          const { secureSignature, secureExpire } = await presignRes.json();

          if (!client) {
            throw new Error('Upload-Client nicht verfügbar');
          }

          const result = await client.uploadFile(asset, {
            fileName: asset.name ?? asset.uri.split("/").pop(),
            contentType: asset.mimeType,
            secureSignature,
            secureExpire
          });

          return { 
            url: `${process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL || ''}/${result.uuid}/`, 
            mimeType: result.mimeType || null 
          };
        }
      } else if ("url" in input) {
        response = await safeFetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await safeFetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await safeFetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }

      if (!response.ok) {
        let errorMessage = "Upload fehlgeschlagen";
        
        switch (response.status) {
          case 413:
            errorMessage = "Datei zu groß";
            break;
          case 400:
            errorMessage = "Ungültige Anfrage";
            break;
          case 401:
            errorMessage = "Nicht autorisiert";
            break;
          case 429:
            errorMessage = "Zu viele Anfragen - bitte warten";
            break;
          case 500:
            errorMessage = "Server-Fehler";
            break;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error('Keine URL in der Antwort erhalten');
      }

      return { url: data.url, mimeType: data.mimeType || null };
      
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error 
        ? uploadError.message 
        : typeof uploadError === "string" 
          ? uploadError 
          : "Unbekannter Upload-Fehler";
      
      setError(errorMessage);
      
      // Zeige Fehler nur in Development
      if (__DEV__) {
        Alert.alert('Upload-Fehler', errorMessage);
      }
      
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [validateInput, safeFetch]);

  // Cleanup-Funktion für AbortController
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return [upload, { loading, error, cancelUpload }];
}

export { useUpload };
export default useUpload;