// Auth (giriş/kayıt) sayfalarının client-safe metinleri. Bu sayfalar tamamen
// client bileşeni olduğundan server "tx()" kullanılamaz; metinler burada 5 dilde
// tutulur ve aktif dil çerezden (NEXT_LOCALE) okunur.

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

export type AuthText = {
  // ortak
  backHome: string;
  login: string;
  register: string;
  // login
  loginSubtitle: string;
  tabMember: string;
  tabCompany: string;
  tabAdmin: string;
  email: string;
  password: string;
  remember: string;
  errInvalid: string;
  loggingIn: string;
  captchaLabel: string;
  captchaWrong: string;
  noAccount: string;
  forgot: string;
  // register
  registerSubtitle: string;
  tabMemberReg: string;
  tabCompanyReg: string;
  firstName: string;
  firstNamePh: string;
  lastName: string;
  lastNamePh: string;
  companyName: string;
  companyNamePh: string;
  contactName: string;
  contactNamePh: string;
  sector: string;
  sectorSelect: string;
  sectorTech: string;
  sectorFinance: string;
  sectorHealth: string;
  sectorEducation: string;
  sectorRetail: string;
  sectorOther: string;
  passwordPh: string;
  passwordRepeat: string;
  passwordRepeatPh: string;
  passwordMismatch: string;
  kvkkPre: string;
  kvkkDoc: string;
  kvkkMid: string;
  kvkkTerms: string;
  kvkkPost: string;
  saving: string;
  haveAccount: string;
  // sözleşme popup
  modalLoading: string;
  modalAccept: string;
  modalClose: string;
  modalError: string;
};

const tr: AuthText = {
  backHome: "← Ana Sayfaya Dön",
  login: "Giriş Yap",
  register: "Kayıt Ol",
  loginSubtitle: "Hesabınıza giriş yapın",
  tabMember: "Üye",
  tabCompany: "Firma",
  tabAdmin: "Admin",
  email: "E-Posta",
  password: "Şifre",
  remember: "Beni Hatırla",
  errInvalid: "E-posta veya şifre hatalı.",
  loggingIn: "Giriş yapılıyor...",
  captchaLabel: "Doğrulama",
  captchaWrong: "Doğrulama yanlış. Lütfen tekrar deneyin.",
  noAccount: "Hesabınız yok mu?",
  forgot: "Şifremi Unuttum",
  registerSubtitle: "Yeni hesap oluşturun",
  tabMemberReg: "Üye Kaydı",
  tabCompanyReg: "Firma Kaydı",
  firstName: "Ad",
  firstNamePh: "Adınız",
  lastName: "Soyad",
  lastNamePh: "Soyadınız",
  companyName: "Firma Adı",
  companyNamePh: "Firma Adı A.Ş.",
  contactName: "Yetkili Ad",
  contactNamePh: "Ad Soyad",
  sector: "Sektör",
  sectorSelect: "Seçin",
  sectorTech: "Teknoloji",
  sectorFinance: "Finans",
  sectorHealth: "Sağlık",
  sectorEducation: "Eğitim",
  sectorRetail: "Perakende",
  sectorOther: "Diğer",
  passwordPh: "En az 6 karakter",
  passwordRepeat: "Şifre Tekrar",
  passwordRepeatPh: "Şifreyi tekrar girin",
  passwordMismatch: "Şifreler eşleşmiyor",
  kvkkPre: "",
  kvkkDoc: "KVKK Aydınlatma Metni",
  kvkkMid: "'ni ve ",
  kvkkTerms: "Kullanım Koşulları",
  kvkkPost: "'nı okudum, kabul ediyorum.",
  saving: "Kaydediliyor...",
  haveAccount: "Zaten hesabınız var mı?",
  modalLoading: "Yükleniyor...",
  modalAccept: "Okudum, Kabul Ediyorum",
  modalClose: "Kapat",
  modalError: "İçerik yüklenemedi.",
};

const en: AuthText = {
  backHome: "← Back to Home",
  login: "Sign In",
  register: "Sign Up",
  loginSubtitle: "Sign in to your account",
  tabMember: "Member",
  tabCompany: "Company",
  tabAdmin: "Admin",
  email: "E-mail",
  password: "Password",
  remember: "Remember Me",
  errInvalid: "Incorrect e-mail or password.",
  loggingIn: "Signing in...",
  captchaLabel: "Verification",
  captchaWrong: "Verification failed. Please try again.",
  noAccount: "Don't have an account?",
  forgot: "Forgot Password",
  registerSubtitle: "Create a new account",
  tabMemberReg: "Member Sign-up",
  tabCompanyReg: "Company Sign-up",
  firstName: "First Name",
  firstNamePh: "Your first name",
  lastName: "Last Name",
  lastNamePh: "Your last name",
  companyName: "Company Name",
  companyNamePh: "Company Inc.",
  contactName: "Contact Name",
  contactNamePh: "Full Name",
  sector: "Sector",
  sectorSelect: "Select",
  sectorTech: "Technology",
  sectorFinance: "Finance",
  sectorHealth: "Healthcare",
  sectorEducation: "Education",
  sectorRetail: "Retail",
  sectorOther: "Other",
  passwordPh: "At least 6 characters",
  passwordRepeat: "Repeat Password",
  passwordRepeatPh: "Re-enter your password",
  passwordMismatch: "Passwords do not match",
  kvkkPre: "I have read and accept the ",
  kvkkDoc: "Privacy Notice",
  kvkkMid: " and the ",
  kvkkTerms: "Terms of Use",
  kvkkPost: ".",
  saving: "Saving...",
  haveAccount: "Already have an account?",
  modalLoading: "Loading...",
  modalAccept: "I Have Read and Accept",
  modalClose: "Close",
  modalError: "Content could not be loaded.",
};

const ar: AuthText = {
  backHome: "← العودة إلى الرئيسية",
  login: "تسجيل الدخول",
  register: "إنشاء حساب",
  loginSubtitle: "سجّل الدخول إلى حسابك",
  tabMember: "عضو",
  tabCompany: "شركة",
  tabAdmin: "مشرف",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  remember: "تذكّرني",
  errInvalid: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  loggingIn: "جارٍ تسجيل الدخول...",
  captchaLabel: "تحقّق",
  captchaWrong: "فشل التحقّق. يرجى المحاولة مرة أخرى.",
  noAccount: "ليس لديك حساب؟",
  forgot: "نسيت كلمة المرور",
  registerSubtitle: "أنشئ حسابًا جديدًا",
  tabMemberReg: "تسجيل عضو",
  tabCompanyReg: "تسجيل شركة",
  firstName: "الاسم",
  firstNamePh: "اسمك",
  lastName: "اللقب",
  lastNamePh: "لقبك",
  companyName: "اسم الشركة",
  companyNamePh: "شركة مثال",
  contactName: "اسم المسؤول",
  contactNamePh: "الاسم الكامل",
  sector: "القطاع",
  sectorSelect: "اختر",
  sectorTech: "التقنية",
  sectorFinance: "المالية",
  sectorHealth: "الصحة",
  sectorEducation: "التعليم",
  sectorRetail: "التجزئة",
  sectorOther: "أخرى",
  passwordPh: "6 أحرف على الأقل",
  passwordRepeat: "تأكيد كلمة المرور",
  passwordRepeatPh: "أعد إدخال كلمة المرور",
  passwordMismatch: "كلمتا المرور غير متطابقتين",
  kvkkPre: "لقد قرأت وأوافق على ",
  kvkkDoc: "إشعار الخصوصية",
  kvkkMid: " و",
  kvkkTerms: "شروط الاستخدام",
  kvkkPost: ".",
  saving: "جارٍ الحفظ...",
  haveAccount: "هل لديك حساب بالفعل؟",
  modalLoading: "جارٍ التحميل...",
  modalAccept: "قرأت وأوافق",
  modalClose: "إغلاق",
  modalError: "تعذّر تحميل المحتوى.",
};

const bg: AuthText = {
  backHome: "← Към началото",
  login: "Вход",
  register: "Регистрация",
  loginSubtitle: "Влезте в профила си",
  tabMember: "Член",
  tabCompany: "Компания",
  tabAdmin: "Админ",
  email: "Имейл",
  password: "Парола",
  remember: "Запомни ме",
  errInvalid: "Грешен имейл или парола.",
  loggingIn: "Влизане...",
  captchaLabel: "Проверка",
  captchaWrong: "Неуспешна проверка. Моля, опитайте отново.",
  noAccount: "Нямате профил?",
  forgot: "Забравена парола",
  registerSubtitle: "Създайте нов профил",
  tabMemberReg: "Регистрация на член",
  tabCompanyReg: "Регистрация на компания",
  firstName: "Име",
  firstNamePh: "Вашето име",
  lastName: "Фамилия",
  lastNamePh: "Вашата фамилия",
  companyName: "Име на компанията",
  companyNamePh: "Компания ООД",
  contactName: "Име на отговорника",
  contactNamePh: "Име и фамилия",
  sector: "Сектор",
  sectorSelect: "Изберете",
  sectorTech: "Технологии",
  sectorFinance: "Финанси",
  sectorHealth: "Здравеопазване",
  sectorEducation: "Образование",
  sectorRetail: "Търговия",
  sectorOther: "Друго",
  passwordPh: "Поне 6 символа",
  passwordRepeat: "Повтори паролата",
  passwordRepeatPh: "Въведете паролата отново",
  passwordMismatch: "Паролите не съвпадат",
  kvkkPre: "Прочетох и приемам ",
  kvkkDoc: "Декларацията за поверителност",
  kvkkMid: " и ",
  kvkkTerms: "Условията за ползване",
  kvkkPost: ".",
  saving: "Запазване...",
  haveAccount: "Вече имате профил?",
  modalLoading: "Зареждане...",
  modalAccept: "Прочетох и приемам",
  modalClose: "Затвори",
  modalError: "Съдържанието не може да се зареди.",
};

const ru: AuthText = {
  backHome: "← На главную",
  login: "Войти",
  register: "Регистрация",
  loginSubtitle: "Войдите в свой аккаунт",
  tabMember: "Участник",
  tabCompany: "Компания",
  tabAdmin: "Админ",
  email: "E-mail",
  password: "Пароль",
  remember: "Запомнить меня",
  errInvalid: "Неверный e-mail или пароль.",
  loggingIn: "Вход...",
  captchaLabel: "Проверка",
  captchaWrong: "Проверка не пройдена. Попробуйте снова.",
  noAccount: "Нет аккаунта?",
  forgot: "Забыли пароль",
  registerSubtitle: "Создайте новый аккаунт",
  tabMemberReg: "Регистрация участника",
  tabCompanyReg: "Регистрация компании",
  firstName: "Имя",
  firstNamePh: "Ваше имя",
  lastName: "Фамилия",
  lastNamePh: "Ваша фамилия",
  companyName: "Название компании",
  companyNamePh: "ООО «Компания»",
  contactName: "Имя ответственного",
  contactNamePh: "Имя и фамилия",
  sector: "Отрасль",
  sectorSelect: "Выберите",
  sectorTech: "Технологии",
  sectorFinance: "Финансы",
  sectorHealth: "Здравоохранение",
  sectorEducation: "Образование",
  sectorRetail: "Розница",
  sectorOther: "Другое",
  passwordPh: "Минимум 6 символов",
  passwordRepeat: "Повтор пароля",
  passwordRepeatPh: "Введите пароль ещё раз",
  passwordMismatch: "Пароли не совпадают",
  kvkkPre: "Я прочитал(а) и принимаю ",
  kvkkDoc: "Уведомление о конфиденциальности",
  kvkkMid: " и ",
  kvkkTerms: "Условия использования",
  kvkkPost: ".",
  saving: "Сохранение...",
  haveAccount: "Уже есть аккаунт?",
  modalLoading: "Загрузка...",
  modalAccept: "Прочитал(а) и принимаю",
  modalClose: "Закрыть",
  modalError: "Не удалось загрузить содержимое.",
};

export const AUTH_TEXT: Record<Locale, AuthText> = { tr, en, ar, bg, ru };

/** Client tarafında NEXT_LOCALE çerezinden aktif dili okur. */
export function readLocaleFromCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match ? decodeURIComponent(match[1]) : undefined;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
