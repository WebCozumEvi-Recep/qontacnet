-- QNB Sanal POS: Terminal ID, API şifresi, para birimi ve dil
ALTER TABLE "SiteSettings" ADD COLUMN "qnbTerminalId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "qnbApiPassword" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "qnbCurrency" TEXT NOT NULL DEFAULT '949';
ALTER TABLE "SiteSettings" ADD COLUMN "qnbLang" TEXT NOT NULL DEFAULT 'tr';
