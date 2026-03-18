import type { ILanguage } from '../interfaces/languages.interface'

export const LANGUAGES: ILanguage[] = [
  // ── A ──────────────────────────────────────────────────────────────────────
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)' },
  { code: 'ar-MA', name: 'Arabic (Morocco)', nativeName: 'العربية (المغرب)' },
  { code: 'ar-DZ', name: 'Arabic (Algeria)', nativeName: 'العربية (الجزائر)' },
  { code: 'ar-IQ', name: 'Arabic (Iraq)', nativeName: 'العربية (العراق)' },
  { code: 'ar-SY', name: 'Arabic (Syria)', nativeName: 'العربية (سوريا)' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },

  // ── B ──────────────────────────────────────────────────────────────────────
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)', nativeName: 'বাংলা (বাংলাদেশ)' },
  { code: 'bn-IN', name: 'Bengali (India)', nativeName: 'বাংলা (ভারত)' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },

  // ── C ──────────────────────────────────────────────────────────────────────
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文(简体)' },
  { code: 'zh-CN', name: 'Chinese (Simplified, China)', nativeName: '中文(简体, 中国)' },
  { code: 'zh-SG', name: 'Chinese (Simplified, Singapore)', nativeName: '中文(简体, 新加坡)' },
  { code: 'zh-TW', name: 'Chinese (Traditional, Taiwan)', nativeName: '中文(繁體, 台灣)' },
  { code: 'zh-HK', name: 'Chinese (Traditional, Hong Kong)', nativeName: '中文(繁體, 香港)' },
  { code: 'zh-MO', name: 'Chinese (Traditional, Macao)', nativeName: '中文(繁體, 澳門)' },
  { code: 'co', name: 'Corsican', nativeName: 'Corsu' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },

  // ── D ──────────────────────────────────────────────────────────────────────
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'nl-NL', name: 'Dutch (Netherlands)', nativeName: 'Nederlands (Nederland)' },
  { code: 'nl-BE', name: 'Dutch (Belgium)', nativeName: 'Nederlands (België)' },

  // ── E ──────────────────────────────────────────────────────────────────────
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'en-US', name: 'English (United States)', nativeName: 'English (US)' },
  { code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English (UK)' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)' },
  { code: 'en-NZ', name: 'English (New Zealand)', nativeName: 'English (New Zealand)' },
  { code: 'en-IE', name: 'English (Ireland)', nativeName: 'English (Ireland)' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)' },
  { code: 'en-ZA', name: 'English (South Africa)', nativeName: 'English (South Africa)' },
  { code: 'en-SG', name: 'English (Singapore)', nativeName: 'English (Singapore)' },
  { code: 'en-NG', name: 'English (Nigeria)', nativeName: 'English (Nigeria)' },
  { code: 'en-PH', name: 'English (Philippines)', nativeName: 'English (Philippines)' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },

  // ── F ──────────────────────────────────────────────────────────────────────
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)' },
  { code: 'fr-BE', name: 'French (Belgium)', nativeName: 'Français (Belgique)' },
  { code: 'fr-CH', name: 'French (Switzerland)', nativeName: 'Français (Suisse)' },
  { code: 'fr-LU', name: 'French (Luxembourg)', nativeName: 'Français (Luxembourg)' },
  { code: 'fy', name: 'Frisian', nativeName: 'Frysk' },

  // ── G ──────────────────────────────────────────────────────────────────────
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)' },
  { code: 'de-LU', name: 'German (Luxembourg)', nativeName: 'Deutsch (Luxemburg)' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },

  // ── H ──────────────────────────────────────────────────────────────────────
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },

  // ── I ──────────────────────────────────────────────────────────────────────
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano (Italia)' },
  { code: 'it-CH', name: 'Italian (Switzerland)', nativeName: 'Italiano (Svizzera)' },

  // ── J ──────────────────────────────────────────────────────────────────────
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },

  // ── K ──────────────────────────────────────────────────────────────────────
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' },

  // ── L ──────────────────────────────────────────────────────────────────────
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'la', name: 'Latin', nativeName: 'Latina' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },

  // ── M ──────────────────────────────────────────────────────────────────────
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'ms-MY', name: 'Malay (Malaysia)', nativeName: 'Bahasa Melayu (Malaysia)' },
  { code: 'ms-BN', name: 'Malay (Brunei)', nativeName: 'Bahasa Melayu (Brunei)' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'mi', name: 'Maori', nativeName: 'Māori' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ' },

  // ── N ──────────────────────────────────────────────────────────────────────
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'nb', name: 'Norwegian Bokmål', nativeName: 'Norsk bokmål' },
  { code: 'nn', name: 'Norwegian Nynorsk', nativeName: 'Norsk nynorsk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'ny', name: 'Nyanja (Chichewa)', nativeName: 'Nyanja' },

  // ── O ──────────────────────────────────────────────────────────────────────
  { code: 'or', name: 'Odia (Oriya)', nativeName: 'ଓଡ଼ିଆ' },

  // ── P ──────────────────────────────────────────────────────────────────────
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },

  // ── R ──────────────────────────────────────────────────────────────────────
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'ro-RO', name: 'Romanian (Romania)', nativeName: 'Română (România)' },
  { code: 'ro-MD', name: 'Romanian (Moldova)', nativeName: 'Română (Moldova)' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },

  // ── S ──────────────────────────────────────────────────────────────────────
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa' },
  { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig' },
  { code: 'sr', name: 'Serbian (Cyrillic)', nativeName: 'Српски' },
  { code: 'sr-Latn', name: 'Serbian (Latin)', nativeName: 'Srpski (latinica)' },
  { code: 'sr-Cyrl', name: 'Serbian (Cyrillic)', nativeName: 'Српски (ћирилица)' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)' },
  { code: 'es-CO', name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)' },
  { code: 'es-CL', name: 'Spanish (Chile)', nativeName: 'Español (Chile)' },
  { code: 'es-PE', name: 'Spanish (Peru)', nativeName: 'Español (Perú)' },
  { code: 'es-VE', name: 'Spanish (Venezuela)', nativeName: 'Español (Venezuela)' },
  { code: 'es-EC', name: 'Spanish (Ecuador)', nativeName: 'Español (Ecuador)' },
  { code: 'es-BO', name: 'Spanish (Bolivia)', nativeName: 'Español (Bolivia)' },
  { code: 'es-UY', name: 'Spanish (Uruguay)', nativeName: 'Español (Uruguay)' },
  { code: 'es-PY', name: 'Spanish (Paraguay)', nativeName: 'Español (Paraguay)' },
  { code: 'es-CR', name: 'Spanish (Costa Rica)', nativeName: 'Español (Costa Rica)' },
  { code: 'es-419', name: 'Spanish (Latin America)', nativeName: 'Español (Latinoamérica)' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'sv-SE', name: 'Swedish (Sweden)', nativeName: 'Svenska (Sverige)' },
  { code: 'sv-FI', name: 'Swedish (Finland)', nativeName: 'Svenska (Finland)' },

  // ── T ──────────────────────────────────────────────────────────────────────
  { code: 'tl', name: 'Filipino (Tagalog)', nativeName: 'Filipino' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татар' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen' },

  // ── U ──────────────────────────────────────────────────────────────────────
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە' },
  { code: 'uz', name: 'Uzbek', nativeName: "O'zbek" },

  // ── V ──────────────────────────────────────────────────────────────────────
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },

  // ── W ──────────────────────────────────────────────────────────────────────
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },

  // ── X ──────────────────────────────────────────────────────────────────────
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },

  // ── Y ──────────────────────────────────────────────────────────────────────
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },

  // ── Z ──────────────────────────────────────────────────────────────────────
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
]
