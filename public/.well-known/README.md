# assetlinks.json - הוראות מילוי

הקובץ `assetlinks.json` מקשר בין הדומיין moms-ok.com לאפליקציית האנדרואיד,
מסיר את שורת הכתובת של הדפדפן וגורם ל-TWA להיראות כמו אפליקציה נייטיב.

## מה צריך למלא (אחרי יצירת החבילה ב-PWABuilder)

1. **package_name** - שם החבילה של האפליקציה. ב-PWABuilder זה מופיע כ-Package ID
   (למשל `com.momsok.app`). לעדכן בקובץ אם בחרת שם אחר.

2. **sha256_cert_fingerprints** - טביעת האצבע SHA-256 של מפתח החתימה. מקבלים אותה
   מ-PWABuilder (במסך ההורדה, תחת "signing key" / "SHA-256 fingerprint"), או
   מ-Play Console אחרי שמפעילים Play App Signing (App integrity > App signing key
   certificate > SHA-256). להעתיק ולהחליף את `REPLACE_WITH_...`.

אם משתמשים ב-Play App Signing (מומלץ), יש **שתי** טביעות אצבע - של מפתח ההעלאה
(upload key) ושל מפתח החתימה של גוגל. עדיף לשים את **שתיהן** במערך, למשל:

```json
"sha256_cert_fingerprints": [
  "AA:BB:CC:...:upload",
  "11:22:33:...:google"
]
```

## בדיקה

אחרי דיפלוי, לוודא שהקובץ נגיש ב:
https://moms-ok.com/.well-known/assetlinks.json

תגידי לי מה ה-package name ומה ה-fingerprint ואני אעדכן את הקובץ סופית.
