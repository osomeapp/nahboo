'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, MapPin, User } from 'lucide-react'
import { useOnboarding, useOnboardingActions } from '@/lib/store'
import { detectPreferredLanguage, isRTLLanguage } from '@/lib/geolocation'
import type { Language, LocationData } from '@/types'

// Mock language data - in production this would come from Google Translate API
const MOCK_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', native_name: 'English', country_codes: ['US', 'GB', 'CA', 'AU'] },
  { code: 'es', name: 'Spanish', native_name: 'Español', country_codes: ['ES', 'MX', 'AR', 'CO'] },
  { code: 'fr', name: 'French', native_name: 'Français', country_codes: ['FR', 'CA', 'BE', 'CH'] },
  { code: 'de', name: 'German', native_name: 'Deutsch', country_codes: ['DE', 'AT', 'CH'] },
  { code: 'it', name: 'Italian', native_name: 'Italiano', country_codes: ['IT'] },
  { code: 'pt', name: 'Portuguese', native_name: 'Português', country_codes: ['PT', 'BR'] },
  { code: 'ru', name: 'Russian', native_name: 'Русский', country_codes: ['RU', 'BY', 'KZ'] },
  { code: 'ja', name: 'Japanese', native_name: '日本語', country_codes: ['JP'] },
  { code: 'ko', name: 'Korean', native_name: '한국어', country_codes: ['KR'] },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native_name: '简体中文', country_codes: ['CN'] },
  { code: 'ar', name: 'Arabic', native_name: 'العربية', country_codes: ['SA', 'AE', 'EG'], is_rtl: true },
  { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', country_codes: ['IN'] },
  { code: 'th', name: 'Thai', native_name: 'ไทย', country_codes: ['TH'] },
  { code: 'vi', name: 'Vietnamese', native_name: 'Tiếng Việt', country_codes: ['VN'] },
  { code: 'nl', name: 'Dutch', native_name: 'Nederlands', country_codes: ['NL', 'BE'] },
  { code: 'sv', name: 'Swedish', native_name: 'Svenska', country_codes: ['SE'] },
]

// Mock translations - in production this would come from translation service
const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    'chooseLanguage': 'Choose Your Language',
    'detectedLocation': 'Detected from your location',
    'whatCallYou': 'What should we call you?',
    'enterName': 'Enter your name',
    'next': 'Next',
    'skipForNow': 'Skip for now',
    'searchLanguages': 'Search languages...',
  },
  'es': {
    'chooseLanguage': 'Elige tu idioma',
    'detectedLocation': 'Detectado desde tu ubicación',
    'whatCallYou': '¿Cómo deberíamos llamarte?',
    'enterName': 'Ingresa tu nombre',
    'next': 'Siguiente',
    'skipForNow': 'Omitir por ahora',
    'searchLanguages': 'Buscar idiomas...',
  },
  'fr': {
    'chooseLanguage': 'Choisissez votre langue',
    'detectedLocation': 'Détecté depuis votre emplacement',
    'whatCallYou': 'Comment devons-nous vous appeler?',
    'enterName': 'Entrez votre nom',
    'next': 'Suivant',
    'skipForNow': 'Passer pour maintenant',
    'searchLanguages': 'Rechercher des langues...',
  },
  'de': {
    'chooseLanguage': 'Wählen Sie Ihre Sprache',
    'detectedLocation': 'Von Ihrem Standort erkannt',
    'whatCallYou': 'Wie sollen wir Sie nennen?',
    'enterName': 'Geben Sie Ihren Namen ein',
    'next': 'Weiter',
    'skipForNow': 'Vorerst überspringen',
    'searchLanguages': 'Sprachen suchen...',
  },
  'pt': {
    'chooseLanguage': 'Escolha seu idioma',
    'detectedLocation': 'Detectado da sua localização',
    'whatCallYou': 'Como devemos te chamar?',
    'enterName': 'Digite seu nome',
    'next': 'Próximo',
    'skipForNow': 'Pular por enquanto',
    'searchLanguages': 'Buscar idiomas...',
  },
  'ar': {
    'chooseLanguage': 'اختر لغتك',
    'detectedLocation': 'تم اكتشافه من موقعك',
    'whatCallYou': 'ماذا يجب أن نسميك؟',
    'enterName': 'أدخل اسمك',
    'next': 'التالي',
    'skipForNow': 'تخطي الآن',
    'searchLanguages': 'البحث في اللغات...',
  },
}

interface LanguageNameScreenProps {
  onComplete: (data: { name: string; language: string }) => void
}

export default function LanguageNameScreen({ onComplete }: LanguageNameScreenProps) {
  const onboarding = useOnboarding()
  const { setData, setLanguage } = useOnboardingActions()
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDetecting, setIsDetecting] = useState(true)
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null)
  const [userName, setUserName] = useState(onboarding.name || '')
  const [selectedLanguage, setSelectedLanguage] = useState(onboarding.language || 'en')
  
  const nameInputRef = useRef<HTMLInputElement>(null)
  const languageSearchRef = useRef<HTMLInputElement>(null)

  // Detect user's preferred language on component mount
  useEffect(() => {
    const performDetection = async () => {
      setIsDetecting(true)
      try {
        const result = await detectPreferredLanguage()
        
        if (result.locationData) {
          setDetectedLocation(result.locationData)
        }
        
        // Only auto-set language if user hasn't already selected one
        if (onboarding.language === 'en' && result.language !== 'en') {
          setSelectedLanguage(result.language)
          setLanguage(result.language)
          setData({ language: result.language, detected_location: result.locationData })
        }
      } catch (error) {
        console.warn('Language detection failed:', error)
      } finally {
        setIsDetecting(false)
      }
    }

    performDetection()
  }, [onboarding.language, setLanguage, setData]) // Include dependencies

  // Get current translations
  const t = (key: string) => {
    return MOCK_TRANSLATIONS[selectedLanguage]?.[key] || MOCK_TRANSLATIONS['en'][key] || key
  }

  // Filter languages based on search query
  const filteredLanguages = MOCK_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle language selection
  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    setLanguage(languageCode)
    setData({ language: languageCode })
    setIsLanguageDropdownOpen(false)
    setSearchQuery('')
    
    // Focus name input after language selection
    setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim()) {
      setData({ name: userName.trim() })
      onComplete({ name: userName.trim(), language: selectedLanguage })
    }
  }

  // Get selected language data
  const selectedLanguageData = MOCK_LANGUAGES.find(lang => lang.code === selectedLanguage)
  const isRTL = selectedLanguageData?.is_rtl || isRTLLanguage(selectedLanguage)

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative"
      >
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-t-2xl overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: '33%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Globe className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('chooseLanguage')}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {selectedLanguageData?.native_name || 'English'}
                  </div>
                  {detectedLocation && selectedLanguage === detectedLocation.language && (
                    <div className="text-sm text-blue-600 flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{t('detectedLocation')}</span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Language Dropdown */}
            <AnimatePresence>
              {isLanguageDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-64 overflow-hidden"
                >
                  {/* Search input */}
                  <div className="p-3 border-b border-gray-100">
                    <input
                      ref={languageSearchRef}
                      type="text"
                      placeholder={t('searchLanguages')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  
                  {/* Language list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredLanguages.map((language) => (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => handleLanguageSelect(language.code)}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          language.code === selectedLanguage ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{language.native_name}</div>
                          <div className="text-sm text-gray-500">{language.name}</div>
                        </div>
                        {detectedLocation && language.country_codes?.includes(detectedLocation.country_code) && (
                          <MapPin className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Name Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-500" />
              <span>{t('whatCallYou')}</span>
            </h2>
            
            <input
              ref={nameInputRef}
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t('enterName')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
              autoFocus={!isDetecting}
            />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex space-x-3 pt-4"
          >
            <button
              type="button"
              onClick={() => onComplete({ name: '', language: selectedLanguage })}
              className="flex-1 p-4 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400"
            >
              ⏭️ {t('skipForNow')}
            </button>
            
            <button
              type="submit"
              disabled={!userName.trim()}
              className={`flex-1 p-4 rounded-xl font-semibold transition-all ${
                userName.trim()
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('next')} →
            </button>
          </motion.div>
        </form>

        {/* Loading indicator for language detection */}
        {isDetecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-2xl"
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Detecting your location...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}