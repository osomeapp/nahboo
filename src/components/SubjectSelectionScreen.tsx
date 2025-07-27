'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, Code, Calculator, Palette, Briefcase, ArrowLeft, Sparkles } from 'lucide-react'
import { useOnboarding, useOnboardingActions } from '@/lib/store'
import type { Subject } from '@/types'

// Mock subject data with multi-language support
const MOCK_SUBJECTS: Subject[] = [
  {
    id: '1',
    name_key: 'programming',
    category: 'popular',
    keywords: ['coding', 'software', 'development', 'programming', 'web', 'app'],
    age_groups: ['teen', 'adult'],
    popularity_score: 95,
  },
  {
    id: '2',
    name_key: 'mathematics',
    category: 'academic',
    keywords: ['math', 'calculus', 'algebra', 'geometry', 'statistics'],
    age_groups: ['child', 'teen', 'adult'],
    popularity_score: 90,
  },
  {
    id: '3',
    name_key: 'dataScience',
    category: 'professional',
    keywords: ['data', 'analytics', 'machine learning', 'AI', 'statistics'],
    age_groups: ['teen', 'adult'],
    popularity_score: 85,
  },
  {
    id: '4',
    name_key: 'webDevelopment',
    category: 'popular',
    keywords: ['web', 'frontend', 'backend', 'javascript', 'html', 'css'],
    age_groups: ['teen', 'adult'],
    popularity_score: 88,
  },
  {
    id: '5',
    name_key: 'design',
    category: 'popular',
    keywords: ['ui', 'ux', 'graphic', 'visual', 'creative', 'art'],
    age_groups: ['teen', 'adult'],
    popularity_score: 80,
  },
  {
    id: '6',
    name_key: 'business',
    category: 'professional',
    keywords: ['management', 'entrepreneurship', 'marketing', 'finance'],
    age_groups: ['adult'],
    popularity_score: 75,
  },
  {
    id: '7',
    name_key: 'languages',
    category: 'hobby',
    keywords: ['spanish', 'french', 'german', 'japanese', 'chinese'],
    age_groups: ['child', 'teen', 'adult'],
    popularity_score: 82,
  },
  {
    id: '8',
    name_key: 'science',
    category: 'academic',
    keywords: ['physics', 'chemistry', 'biology', 'astronomy'],
    age_groups: ['child', 'teen', 'adult'],
    popularity_score: 78,
  },
]

// Mock translations for subjects
const SUBJECT_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    'programming': 'Programming',
    'mathematics': 'Mathematics',
    'dataScience': 'Data Science',
    'webDevelopment': 'Web Development',
    'design': 'UI/UX Design',
    'business': 'Business',
    'languages': 'Languages',
    'science': 'Science',
    'hiWhatLearn': 'Hi {{name}}! What would you like to learn?',
    'chooseSubjectDesc': 'Choose a subject you would like to focus on, or type your own',
    'searchPlaceholder': 'Search or type what you want to learn...',
    'popularSubjects': 'Popular Subjects',
    'back': 'Back',
    'continue': 'Continue',
    'customSubject': 'Custom: {{subject}}',
  },
  'es': {
    'programming': 'Programación',
    'mathematics': 'Matemáticas',
    'dataScience': 'Ciencia de Datos',
    'webDevelopment': 'Desarrollo Web',
    'design': 'Diseño UI/UX',
    'business': 'Negocios',
    'languages': 'Idiomas',
    'science': 'Ciencia',
    'hiWhatLearn': '¡Hola {{name}}! ¿Qué te gustaría aprender?',
    'chooseSubjectDesc': 'Elige una materia en la que te gustaría enfocarte, o escribe la tuya',
    'searchPlaceholder': 'Busca o escribe lo que quieres aprender...',
    'popularSubjects': 'Materias Populares',
    'back': 'Atrás',
    'continue': 'Continuar',
    'customSubject': 'Personalizado: {{subject}}',
  },
  'fr': {
    'programming': 'Programmation',
    'mathematics': 'Mathématiques',
    'dataScience': 'Science des Données',
    'webDevelopment': 'Développement Web',
    'design': 'Design UI/UX',
    'business': 'Affaires',
    'languages': 'Langues',
    'science': 'Science',
    'hiWhatLearn': 'Salut {{name}}! Qu\'aimeriez-vous apprendre?',
    'chooseSubjectDesc': 'Choisissez un sujet sur lequel vous aimeriez vous concentrer, ou tapez le vôtre',
    'searchPlaceholder': 'Recherchez ou tapez ce que vous voulez apprendre...',
    'popularSubjects': 'Sujets Populaires',
    'back': 'Retour',
    'continue': 'Continuer',
    'customSubject': 'Personnalisé: {{subject}}',
  },
  'de': {
    'programming': 'Programmierung',
    'mathematics': 'Mathematik',
    'dataScience': 'Datenwissenschaft',
    'webDevelopment': 'Webentwicklung',
    'design': 'UI/UX Design',
    'business': 'Geschäft',
    'languages': 'Sprachen',
    'science': 'Wissenschaft',
    'hiWhatLearn': 'Hallo {{name}}! Was möchten Sie lernen?',
    'chooseSubjectDesc': 'Wählen Sie ein Fach, auf das Sie sich konzentrieren möchten, oder geben Sie Ihr eigenes ein',
    'searchPlaceholder': 'Suchen oder geben Sie ein, was Sie lernen möchten...',
    'popularSubjects': 'Beliebte Fächer',
    'back': 'Zurück',
    'continue': 'Weiter',
    'customSubject': 'Benutzerdefiniert: {{subject}}',
  },
  'pt': {
    'programming': 'Programação',
    'mathematics': 'Matemática',
    'dataScience': 'Ciência de Dados',
    'webDevelopment': 'Desenvolvimento Web',
    'design': 'Design UI/UX',
    'business': 'Negócios',
    'languages': 'Idiomas',
    'science': 'Ciência',
    'hiWhatLearn': 'Oi {{name}}! O que você gostaria de aprender?',
    'chooseSubjectDesc': 'Escolha uma matéria na qual você gostaria de se focar, ou digite a sua própria',
    'searchPlaceholder': 'Pesquise ou digite o que você quer aprender...',
    'popularSubjects': 'Matérias Populares',
    'back': 'Voltar',
    'continue': 'Continuar',
    'customSubject': 'Personalizado: {{subject}}',
  },
  'ar': {
    'programming': 'البرمجة',
    'mathematics': 'الرياضيات',
    'dataScience': 'علوم البيانات',
    'webDevelopment': 'تطوير الويب',
    'design': 'تصميم واجهة المستخدم',
    'business': 'الأعمال',
    'languages': 'اللغات',
    'science': 'العلوم',
    'hiWhatLearn': 'مرحباً {{name}}! ماذا تريد أن تتعلم؟',
    'chooseSubjectDesc': 'اختر موضوعاً تريد التركيز عليه، أو اكتب موضوعك الخاص',
    'searchPlaceholder': 'ابحث أو اكتب ما تريد تعلمه...',
    'popularSubjects': 'المواضيع الشائعة',
    'back': 'رجوع',
    'continue': 'متابعة',
    'customSubject': 'مخصص: {{subject}}',
  },
}

// Subject icons mapping
const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'programming': Code,
  'mathematics': Calculator,
  'dataScience': Sparkles,
  'webDevelopment': Code,
  'design': Palette,
  'business': Briefcase,
  'languages': BookOpen,
  'science': BookOpen,
}

interface SubjectSelectionScreenProps {
  userName?: string
  onComplete: (subject: string) => void
  onBack: () => void
  isLoading?: boolean
}

export default function SubjectSelectionScreen({ userName, onComplete, onBack, isLoading = false }: SubjectSelectionScreenProps) {
  const onboarding = useOnboarding()
  const { setData } = useOnboardingActions()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [isCustomSubject, setIsCustomSubject] = useState(false)
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>(MOCK_SUBJECTS)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get current translations
  const t = useCallback((key: string, replacements?: Record<string, string>) => {
    let translation = SUBJECT_TRANSLATIONS[onboarding.language]?.[key] || 
                     SUBJECT_TRANSLATIONS['en'][key] || key
    
    // Handle template replacements
    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        translation = translation.replace(`{{${key}}}`, value)
      })
    }
    
    return translation
  }, [onboarding.language])

  // Filter subjects based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubjects(MOCK_SUBJECTS.slice(0, 6)) // Show top 6 popular subjects
      setSuggestions([])
      setIsCustomSubject(false)
      return
    }

    const query = searchQuery.toLowerCase()
    
    // Filter existing subjects
    const matchingSubjects = MOCK_SUBJECTS.filter(subject => {
      const translatedName = t(subject.name_key).toLowerCase()
      return translatedName.includes(query) || 
             subject.keywords.some(keyword => keyword.toLowerCase().includes(query))
    })

    setFilteredSubjects(matchingSubjects)
    
    // Generate AI-powered suggestions (mock implementation)
    const mockSuggestions = generateSubjectSuggestions(query)
    setSuggestions(mockSuggestions)
    
    // Check if this is a custom subject
    const exactMatch = matchingSubjects.find(subject => 
      t(subject.name_key).toLowerCase() === query
    )
    setIsCustomSubject(!exactMatch && query.length > 2)
  }, [searchQuery, onboarding.language, t])

  // Mock AI suggestion generator
  const generateSubjectSuggestions = (query: string): string[] => {
    const suggestionMap: Record<string, string[]> = {
      'cook': ['Cooking', 'Baking', 'Culinary Arts', 'Food Science'],
      'music': ['Music Theory', 'Piano', 'Guitar', 'Music Production'],
      'photo': ['Photography', 'Photo Editing', 'Portrait Photography', 'Digital Art'],
      'write': ['Creative Writing', 'Technical Writing', 'Copywriting', 'Journalism'],
      'fit': ['Fitness', 'Nutrition', 'Personal Training', 'Yoga'],
      'market': ['Digital Marketing', 'Social Media Marketing', 'Content Marketing'],
      'game': ['Game Development', 'Game Design', 'Unity', 'Unreal Engine'],
    }

    for (const [key, suggestions] of Object.entries(suggestionMap)) {
      if (query.includes(key)) {
        return suggestions
      }
    }

    return []
  }

  // Handle subject selection
  const handleSubjectSelect = (subjectKey: string, isCustom: boolean = false) => {
    const subject = isCustom ? searchQuery : t(subjectKey)
    setSelectedSubject(subject)
    setData({ subject, custom_subject: isCustom ? searchQuery : undefined })
    
    // Auto-advance after selection with a slight delay
    setTimeout(() => {
      onComplete(subject)
    }, 600)
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setSelectedSubject('')
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedSubject) {
      onComplete(selectedSubject)
    } else if (searchQuery.trim()) {
      handleSubjectSelect(searchQuery, true)
    }
  }

  const isRTL = onboarding.language === 'ar'

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 relative"
      >
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 rounded-t-2xl overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            initial={{ width: '33%' }}
            animate={{ width: '66%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <BookOpen className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('hiWhatLearn', { name: onboarding.name || 'there' })}
          </h1>
          <p className="text-gray-600">
            {t('chooseSubjectDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Custom Subject Option */}
          <AnimatePresence>
            {isCustomSubject && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  type="button"
                  onClick={() => handleSubjectSelect(searchQuery, true)}
                  className={`w-full p-4 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all text-left ${
                    selectedSubject === searchQuery ? 'border-purple-500 bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-400 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-purple-700">
                        {t('customSubject', { subject: searchQuery })}
                      </div>
                      <div className="text-sm text-gray-500">
                        We&apos;ll create personalized content for you
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-medium text-gray-700 mb-3">✨ AI Suggestions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSubjectSelect(suggestion, true)}
                      className="p-3 text-left rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                    >
                      <div className="font-medium text-blue-700 text-sm">{suggestion}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Popular Subjects Grid */}
          {!searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('popularSubjects')}
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredSubjects.map((subject, index) => {
                  const IconComponent = SUBJECT_ICONS[subject.name_key] || BookOpen
                  const isSelected = selectedSubject === t(subject.name_key)
                  
                  return (
                    <motion.button
                      key={subject.id}
                      type="button"
                      onClick={() => handleSubjectSelect(subject.name_key)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`p-4 rounded-xl border-2 hover:shadow-lg transition-all text-left ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 shadow-lg' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-purple-500' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className={`font-semibold text-center ${
                          isSelected ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {t(subject.name_key)}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Filtered Results for Search */}
          {searchQuery && !isCustomSubject && filteredSubjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
              <div className="space-y-2">
                {filteredSubjects.map((subject) => {
                  const IconComponent = SUBJECT_ICONS[subject.name_key] || BookOpen
                  const isSelected = selectedSubject === t(subject.name_key)
                  
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => handleSubjectSelect(subject.name_key)}
                      className={`w-full p-4 rounded-xl border-2 hover:shadow-md transition-all text-left ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-purple-500' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className={`font-semibold ${
                          isSelected ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {t(subject.name_key)}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex space-x-3 pt-6"
          >
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors border-2 border-gray-200 hover:border-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>
            
            <button
              type="submit"
              disabled={!selectedSubject && !searchQuery.trim()}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedSubject || searchQuery.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('continue')} →
            </button>
          </motion.div>
        </form>

        {/* Selection feedback */}
        <AnimatePresence>
          {selectedSubject && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center"
            >
              <div className="text-green-700 font-medium">
                ✅ Selected: {selectedSubject}
              </div>
              <div className="text-green-600 text-sm">
                Proceeding to your personalized learning feed...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}