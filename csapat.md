# SOULVIBE FESTIVAL 2026 - Csapatfelosztás és Expo Tech Stack

Ez a dokumentum rögzíti a 4 fős csapat szerepköreit, a feladatok elosztását és a mai napra (hétfő) kitűzött technikai mikro-mérföldköveket az Expo keretrendszerben.

---

## 1. Szerepkörök és Feladatmegosztás

### 🎨 1. UX/UI Dizájner & Projektmenedzser (A "Vibe" Felelős) -- Levi

_Felelős a 20 pontos dizájn kategóriáért, a felhasználói élményért és a csütörtöki bemutatóért._

- **Fő feladatok:**
  - Felskicceli a képernyőket sötét módban (fekete háttér, neon-zöld és elektromos lila gombok).
  - Kiválasztja az arculathoz passzoló ikonokat az `expo` online ikonkeresőjéből (pl. Ionicons, MaterialIcons).
  - Megírja a fiktív, hangulatos szövegeket (fellépők leírásai, gasztró standok ajánlatai, szponzorok bemutatása).
  - Felépíti a csütörtöki prezentáció sztoriját és elkészíti a diavetítést.

### 📱 2. Frontend Fejlesztő "A" (Navigáció & Statikus Képernyők) -- Balazs?

_Felelős az alkalmazás vázáért, az első benyomásért és a vizuális koherenciáért._

- **Fő feladatok:**
  - Beállítja az **Expo Router** vagy **React Navigation** alapú Tab-navigációt az alkalmazás alján (_Kezdőlap, Program, Térkép, Kedvencek, Info_).
  - Megírja a **Főképernyőt** a fesztivál nevével, dátumával és a látványos borítóképpel/animációval.
  - Elkészíti az **Info és Támogatói** felületet (beemelve az 5 kötelező szponzor logóját).
  - Lekódolja a **Gasztró szekció** statikus kártyás felületeit (TrapGrill, Wired Pizza, stb.).

### ⚙️ 3. Frontend Fejlesztő "B" (Adatvezérelt & Komplex Funkciók) -- Levi?

_Felelős a dinamikus listákért, a személyre szabott menetrendért és a szerdai kríziskártyáért._

- **Fő feladatok:**
  - Elkészíti a **Részletes programtábla** felületet `FlatList` vagy `SectionList` használatával (napok és színpadok szerinti szűréssel).
  - Legenerálja a **Fellépők adatlapjait** a dizájner által megírt szövegekkel és képekkel.
  - Lekódolja a **Kedvencek / Saját menetrend** logikáját (pl. React Context vagy Zustand segítségével, hogy a szívecskére kattintva a koncert átkerüljön a személyes listába).
  - Készenlétben áll szerda reggel a **Kríziskártya** funkciójának azonnali lefejlesztésére.

### 💾 4. Backend Fejlesztő / Tech Lead (Az Adatmotor) -- Vili

_Felelős a technikai stabilitásért (25 pont) és a gördülékeny adatfolyamért._

- **Fő feladatok:**
  - Inicializálja az Expo projektet, beállítja a TypeScriptet és a közös GitHub repót.
  - Beköti a Firebase vagy Supabase SDK-t az Expo appba.
  - Strukturálja a JSON adatmodelleket (koncertek, fellépők, gasztró standok), és feltölti vele a felhőalapú adatbázist.
  - _(Opcionális extra pontért):_ Beállítja az `expo-sqlite` vagy `async-storage` csomagot, hogy a programtábla offline is elérhető legyen.

---
