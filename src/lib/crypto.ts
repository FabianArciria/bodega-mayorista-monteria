/**
 * Módulo de Encriptación y Protección de Datos Personales (PII)
 * Cumplimiento con Ley 1581 de 2012 (Habeas Data Colombia) y estándares AES-256
 */

const ENCRYPTION_PREFIX = 'enc::v1::';
const SECRET_KEY_RAW = 
  process.env.NEXT_PUBLIC_DATA_ENCRYPTION_KEY || 
  process.env.DATA_ENCRYPTION_KEY || 
  'bodega_monteria_super_secret_aes256_key_cordoba_2026';

/**
 * Deriva una clave de 256 bits a partir de la llave secreta
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_KEY_RAW),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('bodega_monteria_salt_2026'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encripta un dato sensible (teléfono, documento, dirección) con AES-256-GCM
 */
export async function encryptSensitiveData(plainText: string): Promise<string> {
  if (!plainText || plainText.startsWith(ENCRYPTION_PREFIX)) return plainText;

  try {
    const key = await getCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    // Combinar IV (12 bytes) + CipherText
    const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertextBuffer), iv.length);

    // Convertir a base64
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    const base64 = btoa(binary);

    return `${ENCRYPTION_PREFIX}${base64}`;
  } catch (error) {
    console.error('Error al encriptar datos personales:', error);
    return plainText;
  }
}

/**
 * Desencripta un dato sensible encriptado con AES-256-GCM
 */
export async function decryptSensitiveData(encryptedData: string): Promise<string> {
  if (!encryptedData || !encryptedData.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedData;
  }

  try {
    const base64 = encryptedData.replace(ENCRYPTION_PREFIX, '');
    const binary = atob(base64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const key = await getCryptoKey();
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.warn('No se pudo desencriptar el dato (clave no coincide o dato alterado)');
    return '*** Protegido ***';
  }
}

/**
 * Verifica si un dato está actualmente encriptado
 */
export function isEncrypted(value?: string | null): boolean {
  if (!value) return false;
  return value.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Enmascara datos sensibles para visualización segura en interfaces de usuario
 */
export function maskSensitiveData(type: 'phone' | 'document' | 'address', value?: string | null): string {
  if (!value) return 'No registrado';
  
  // Si está encriptado, mostrar indicador seguro
  if (isEncrypted(value)) {
    return '🔒 [Dato Encriptado con AES-256]';
  }

  const str = value.trim();

  if (type === 'phone') {
    if (str.length < 7) return '***';
    return `${str.slice(0, 3)} *** ${str.slice(-4)}`;
  }

  if (type === 'document') {
    if (str.length < 5) return '***';
    return `${str.slice(0, 3)}****${str.slice(-2)}`;
  }

  if (type === 'address') {
    const parts = str.split(' ');
    if (parts.length <= 2) return `${str.slice(0, 4)} ****`;
    return `${parts.slice(0, 2).join(' ')} **** ${parts.slice(-1)}`;
  }

  return str;
}
