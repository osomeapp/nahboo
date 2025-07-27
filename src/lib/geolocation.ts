import type { LocationData, GeolocationResponse } from '@/types'

// Country to language mapping
const countryToLanguageMap: Record<string, string> = {
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
  'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es',
  'CL': 'es', 'EC': 'es', 'GT': 'es', 'CU': 'es', 'BO': 'es', 'DO': 'es',
  'HN': 'es', 'PY': 'es', 'SV': 'es', 'NI': 'es', 'CR': 'es', 'PA': 'es',
  'UY': 'es', 'PR': 'es',
  'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'LU': 'fr', 'MC': 'fr',
  'BR': 'pt', 'PT': 'pt', 'AO': 'pt', 'MZ': 'pt',
  'DE': 'de', 'AT': 'de',
  'IT': 'it', 'SM': 'it', 'VA': 'it',
  'RU': 'ru', 'BY': 'ru', 'KZ': 'ru',
  'CN': 'zh-CN', 'TW': 'zh-TW', 'HK': 'zh-HK', 'SG': 'zh-CN',
  'JP': 'ja',
  'KR': 'ko',
  'IN': 'hi', 'PK': 'ur', 'BD': 'bn',
  'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'MA': 'ar', 'DZ': 'ar', 'TN': 'ar',
  'LY': 'ar', 'SD': 'ar', 'SY': 'ar', 'IQ': 'ar', 'JO': 'ar', 'LB': 'ar',
  'KW': 'ar', 'QA': 'ar', 'BH': 'ar', 'OM': 'ar', 'YE': 'ar',
  'NL': 'nl', 'SE': 'sv', 'NO': 'no', 'DK': 'da', 'FI': 'fi',
  'PL': 'pl', 'CZ': 'cs', 'SK': 'sk', 'HU': 'hu', 'RO': 'ro',
  'GR': 'el', 'TR': 'tr', 'IL': 'he', 'TH': 'th', 'VN': 'vi',
  'ID': 'id', 'MY': 'ms', 'PH': 'tl', 'NG': 'en', 'KE': 'sw',
}

// Geolocation service configuration
const GEOLOCATION_SERVICES = [
  {
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/',
    parser: (data: Record<string, unknown>): GeolocationResponse => ({
      country_code: data.country_code as string,
      country_name: data.country_name as string,
      city: data.city as string,
      timezone: data.timezone as string,
      latitude: data.latitude as number,
      longitude: data.longitude as number,
    }),
  },
  {
    name: 'ipgeolocation.io',
    url: 'https://api.ipgeolocation.io/ipgeo?apiKey=free',
    parser: (data: Record<string, unknown>): GeolocationResponse => ({
      country_code: data.country_code2 as string,
      country_name: data.country_name as string,
      city: data.city as string,
      timezone: (data.time_zone as { name?: string })?.name,
      latitude: parseFloat(data.latitude as string),
      longitude: parseFloat(data.longitude as string),
    }),
  },
  {
    name: 'ip-api.com',
    url: 'http://ip-api.com/json/',
    parser: (data: Record<string, unknown>): GeolocationResponse => ({
      country_code: data.countryCode as string,
      country_name: data.country as string,
      city: data.city as string,
      timezone: data.timezone as string,
      latitude: data.lat as number,
      longitude: data.lon as number,
    }),
  },
]

/**
 * Detect user location using IP geolocation services
 */
export const detectUserLocation = async (): Promise<LocationData | null> => {
  for (const service of GEOLOCATION_SERVICES) {
    try {
      console.log(`Trying geolocation service: ${service.name}`)
      
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Set timeout to prevent hanging
        signal: AbortSignal.timeout(3000),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const parsedData = service.parser(data)

      if (parsedData.country_code) {
        const language = countryToLanguageMap[parsedData.country_code] || 'en'
        
        return {
          country: parsedData.country_name,
          country_code: parsedData.country_code,
          language,
          timezone: parsedData.timezone,
        }
      }
    } catch (error) {
      console.warn(`Geolocation service ${service.name} failed:`, error)
      continue
    }
  }

  console.warn('All geolocation services failed, using fallback')
  return null
}

/**
 * Get browser language preferences
 */
export const getBrowserLanguage = (): string => {
  // Check navigator.language first (most specific)
  if (navigator.language) {
    const lang = navigator.language.split('-')[0]
    return lang
  }

  // Check navigator.languages array
  if (navigator.languages && navigator.languages.length > 0) {
    for (const language of navigator.languages) {
      const lang = language.split('-')[0]
      return lang
    }
  }

  // Fallback to English
  return 'en'
}

/**
 * Detect user's preferred language using multiple methods
 */
export const detectPreferredLanguage = async (): Promise<{
  language: string
  method: 'geolocation' | 'browser' | 'fallback'
  locationData?: LocationData
}> => {
  try {
    // 1. Try IP geolocation (highest priority)
    const locationData = await detectUserLocation()
    if (locationData?.language) {
      return {
        language: locationData.language,
        method: 'geolocation',
        locationData,
      }
    }
  } catch (error) {
    console.warn('Geolocation detection failed:', error)
  }

  // 2. Fall back to browser language
  const browserLang = getBrowserLanguage()
  if (browserLang && browserLang !== 'en') {
    return {
      language: browserLang,
      method: 'browser',
    }
  }

  // 3. Default fallback
  return {
    language: 'en',
    method: 'fallback',
  }
}

/**
 * Get timezone-based language hint (additional context)
 */
export const getTimezoneLanguageHint = (): string | null => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Map some common timezones to likely languages
    const timezoneLanguageMap: Record<string, string> = {
      'America/New_York': 'en',
      'America/Los_Angeles': 'en',
      'America/Chicago': 'en',
      'America/Denver': 'en',
      'America/Toronto': 'en',
      'Europe/London': 'en',
      'Europe/Paris': 'fr',
      'Europe/Berlin': 'de',
      'Europe/Madrid': 'es',
      'Europe/Rome': 'it',
      'Europe/Amsterdam': 'nl',
      'Europe/Stockholm': 'sv',
      'Europe/Moscow': 'ru',
      'Asia/Tokyo': 'ja',
      'Asia/Seoul': 'ko',
      'Asia/Shanghai': 'zh-CN',
      'Asia/Hong_Kong': 'zh-HK',
      'Asia/Singapore': 'en',
      'Asia/Dubai': 'ar',
      'Australia/Sydney': 'en',
      'Australia/Melbourne': 'en',
    }

    return timezoneLanguageMap[timezone] || null
  } catch (error) {
    console.warn('Timezone detection failed:', error)
    return null
  }
}

/**
 * Check if a language is RTL (Right-to-Left)
 */
export const isRTLLanguage = (languageCode: string): boolean => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'iw']
  return rtlLanguages.includes(languageCode)
}

/**
 * Format language display name
 */
export const formatLanguageName = (languageCode: string, nativeName?: string): string => {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ja': '日本語',
    'ko': '한국어',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'nl': 'Nederlands',
    'sv': 'Svenska',
    'no': 'Norsk',
    'da': 'Dansk',
    'fi': 'Suomi',
    'pl': 'Polski',
    'cs': 'Čeština',
    'sk': 'Slovenčina',
    'hu': 'Magyar',
    'ro': 'Română',
    'el': 'Ελληνικά',
    'tr': 'Türkçe',
    'he': 'עברית',
    'id': 'Bahasa Indonesia',
    'ms': 'Bahasa Melayu',
    'tl': 'Filipino',
    'sw': 'Kiswahili',
    'bn': 'বাংলা',
    'ur': 'اردو',
  }

  return nativeName || languageNames[languageCode] || languageCode.toUpperCase()
}