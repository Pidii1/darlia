// Bahasa Melayu. The app is written in English; when Malay is on, text on screen is swapped as it appears.
import { store } from './ui.js';
const MS = {
  // home
  'Edit like a pro. Looks, retouch, erase, cutouts, collages and more, all on your device.': 'Edit macam pro. Looks, retouch, padam objek, cutout, kolaj dan banyak lagi, semua dalam peranti anda.',
  'Open a photo': 'Buka gambar', 'Get the app': 'Dapatkan app', 'Try a sample': 'Cuba contoh', 'Collage': 'Kolaj', 'Batch edit': 'Edit pukal', 'or drop a photo anywhere': 'atau lepaskan gambar di mana-mana',
  'Recent': 'Terkini', 'Saved on this device': 'Disimpan dalam peranti ini', 'Project deleted': 'Projek dipadam', 'Opening…': 'Membuka…', 'Could not open that project': 'Tak dapat buka projek itu', 'Could not open that picture': 'Tak dapat buka gambar itu',
  '19 looks + your own': '19 looks + milik anda', 'Skin, face, eyes, teeth': 'Kulit, muka, mata, gigi', 'Remove objects': 'Buang objek', 'Swap the background': 'Tukar latar', 'Soft background': 'Latar kabur', 'Pro tone control': 'Kawalan ton pro', 'Push, grow, shrink': 'Tolak, besar, kecil', 'Edit one area': 'Edit satu kawasan', 'Instant, film, more': 'Instant, filem, lagi',
  'just now': 'baru tadi', 'yesterday': 'semalam',
  // tools
  'Looks': 'Looks', 'Adjust': 'Laras', 'Colour': 'Warna', 'Curves': 'Lengkung', 'Crop': 'Potong', 'Retouch': 'Retouch', 'Erase': 'Padam', 'Cutout': 'Cutout', 'Lens blur': 'Kabur lensa', 'Brush': 'Berus', 'Reshape': 'Bentuk', 'Text': 'Teks', 'Stickers': 'Pelekat', 'Draw': 'Lukis', 'Film fx': 'Kesan filem', 'Frame': 'Bingkai', 'Frames': 'Bingkai',
  'Export': 'Eksport', 'Edits': 'Edit', 'Copy edits': 'Salin edit', 'Paste edits': 'Tampal edit', 'Save as my look': 'Simpan sebagai look saya', 'Reset all edits': 'Set semula semua edit',
  'Looks, adjust, colour and curves': 'Looks, laras, warna dan lengkung', 'Use the copied edits on this photo': 'Guna edit yang disalin pada gambar ini', 'Copy edits from a photo first': 'Salin edit dari gambar dulu', 'Use it again on any photo': 'Guna semula pada mana-mana gambar', 'Back to the original photo': 'Kembali ke gambar asal',
  'Close': 'Tutup', 'Cancel': 'Batal', 'Save': 'Simpan', 'Apply': 'Guna', 'Reset': 'Set semula', 'Auto': 'Auto', 'Delete': 'Padam', 'Copy': 'Salin', 'Add': 'Tambah', 'Remove': 'Buang', 'Replace': 'Ganti', 'Move': 'Alih', 'Clear': 'Kosongkan', 'On': 'Hidup', 'Off': 'Mati', 'None': 'Tiada', 'Default': 'Asal',
  'Edits copied': 'Edit disalin', 'Edits pasted': 'Edit ditampal', 'All edits reset': 'Semua edit diset semula', 'Auto fix applied': 'Baiki auto digunakan', 'Look deleted': 'Look dipadam', 'Saved to My looks': 'Disimpan ke Look saya', 'Could not save': 'Tak dapat simpan',
  'Saves your looks, adjust, colour and curves settings.': 'Menyimpan tetapan looks, laras, warna dan lengkung anda.', 'My look': 'Look saya', 'Name': 'Nama',
  'Tap: before / after slider. Hold: original': 'Tekan: gelangsar sebelum / selepas. Tahan: asal', 'Before': 'Sebelum', 'After': 'Selepas', 'Zoom in': 'Zum masuk', 'Zoom out': 'Zum keluar', 'Fit': 'Muat', 'Home': 'Utama', 'Undo': 'Buat asal', 'Redo': 'Buat semula', 'More': 'Lagi',
  // looks + adjust
  'Save mine': 'Simpan saya', 'My looks': 'Look saya', 'Strength': 'Kekuatan', 'Basic': 'Asas', 'Signature': 'Istimewa', 'Film': 'Filem', 'Mood': 'Mood', 'Black & white': 'Hitam putih',
  'Light': 'Cahaya', 'Detail': 'Perincian', 'Effects': 'Kesan', 'Exposure': 'Dedahan', 'Contrast': 'Kontras', 'Highlights': 'Kawasan terang', 'Shadows': 'Bayang', 'Whites': 'Putih', 'Blacks': 'Hitam', 'Temperature': 'Suhu', 'Warmth': 'Kehangatan', 'Tint': 'Rona', 'Vibrance': 'Kerancakan', 'Saturation': 'Ketepuan', 'Clarity': 'Kejelasan', 'Sharpen': 'Tajamkan', 'Fade': 'Pudar', 'Vignette': 'Vignet', 'Grain': 'Bijian',
  'Colour mix': 'Campuran warna', 'Hue': 'Rona warna', 'Brightness': 'Kecerahan', 'Red': 'Merah', 'Orange': 'Oren', 'Yellow': 'Kuning', 'Green': 'Hijau', 'Aqua': 'Aqua', 'Blue': 'Biru', 'Purple': 'Ungu', 'Pink': 'Merah jambu',
  'Tap to add a point, drag to shape. Double-tap a point, or drag it out, to remove it.': 'Tekan untuk tambah titik, seret untuk bentuk. Tekan dua kali pada titik, atau seret keluar, untuk buang.', 'Presets': 'Pratetap',
  // crop
  'Crop & rotate': 'Potong & putar', 'Free': 'Bebas', 'Original': 'Asal', 'Straighten': 'Luruskan', 'Rotate': 'Putar', 'Flip': 'Terbalik', 'Flip up': 'Terbalik atas', 'Drag the corners or the box on the photo.': 'Seret bucu atau kotak pada gambar.',
  // retouch
  'Find faces': 'Cari muka', 'Finding faces…': 'Mencari muka…', 'Try again': 'Cuba lagi', 'Could not load the face tools here.': 'Alat muka tak dapat dimuatkan di sini.', 'The face model is missing.': 'Model muka tiada.',
  'No face found in this photo. Retouch works on clear, front-facing faces.': 'Tiada muka dijumpai. Retouch berfungsi pada muka yang jelas dan menghadap depan.',
  'Skin': 'Kulit', 'Smooth skin': 'Licinkan kulit', 'Brighten face': 'Cerahkan muka', 'Shape': 'Bentuk', 'Slim face': 'Rampingkan muka', 'Bigger eyes': 'Besarkan mata', 'Details': 'Butiran', 'Brighten eyes': 'Cerahkan mata', 'Whiten teeth': 'Putihkan gigi',
  // erase
  'Paint': 'Sapu', 'Spot fix': 'Baiki titik', 'Brush size': 'Saiz berus', 'Spot size': 'Saiz titik', 'Paint over what you want gone, then tap Erase.': 'Sapu pada benda yang anda mahu buang, kemudian tekan Padam.',
  'Tap a spot, a pimple or a speck of dust and it is fixed straight away. Zoom in for small spots.': 'Tekan pada titik, jerawat atau habuk dan ia terus dibaiki. Zum masuk untuk titik kecil.',
  'The first time, the eraser needs a moment to get ready.': 'Kali pertama, pemadam perlukan sedikit masa untuk bersedia.', 'Erasing…': 'Memadam…', 'Getting the eraser ready…': 'Menyediakan pemadam…', 'Erased': 'Dipadam', 'Paint over something first': 'Sapu pada sesuatu dulu', 'The eraser could not run here': 'Pemadam tak dapat berjalan di sini',
  // cutout
  'Remove background': 'Buang latar', 'Works best with people. Everything happens on your device.': 'Paling baik untuk gambar orang. Semuanya berlaku dalam peranti anda.', 'Finding the person and removing the background…': 'Mencari orang dan membuang latar…',
  'Background removed': 'Latar dibuang', 'Keep background': 'Kekalkan latar', 'New background': 'Latar baru', 'Transparent': 'Lutsinar', 'Photo': 'Gambar', 'Blur': 'Kabur', 'Your photo': 'Gambar anda', 'Yours': 'Milik anda',
  'Studio': 'Studio', 'Blush': 'Blush', 'Sunset': 'Senja', 'Night': 'Malam', 'Cream': 'Krim', 'Darlia': 'Darlia', 'Any colour': 'Sebarang warna',
  'Sticker': 'Pelekat', 'Make a sticker of the person': 'Jadikan orang itu pelekat', 'Cuts the person out with a white outline and a soft shadow, and puts it on your photo as a sticker.': 'Memotong orang itu dengan garis putih dan bayang lembut, dan letak pada gambar sebagai pelekat.',
  'Making your sticker…': 'Membuat pelekat anda…', 'No person found to make a sticker': 'Tiada orang dijumpai untuk dijadikan pelekat', 'Sticker added. It is also saved under Stickers → Yours': 'Pelekat ditambah. Ia juga disimpan di Pelekat → Milik anda', 'Could not find the person in this photo': 'Tak jumpa orang dalam gambar ini',
  // blur
  'Round': 'Bulat', 'Line': 'Garis', 'Sharp area': 'Kawasan tajam', 'Softness': 'Kelembutan', 'Angle': 'Sudut', 'Keep person sharp': 'Kekalkan orang tajam', 'Drag on the photo to move the sharp area.': 'Seret pada gambar untuk alih kawasan tajam.',
  'Blur the background like a big camera lens. Pick Round or Line, then drag on the photo to choose what stays sharp.': 'Kaburkan latar macam lensa kamera besar. Pilih Bulat atau Garis, kemudian seret pada gambar untuk pilih bahagian yang kekal tajam.',
  // brush
  'Show area': 'Tunjuk kawasan', 'Wipe': 'Lap', 'Pick for me': 'Pilihkan untuk saya', 'Person': 'Orang', 'Background': 'Latar', 'Sky': 'Langit',
  'These changes only touch the chosen area. Paint or wipe to fix the edges:': 'Perubahan ini hanya pada kawasan dipilih. Sapu atau lap untuk kemaskan tepi:', 'Pick an area above, or paint the area you want to change, then use the sliders.': 'Pilih kawasan di atas, atau sapu kawasan yang anda mahu ubah, kemudian guna gelangsar.',
  // reshape
  'Push': 'Tolak', 'Grow': 'Besar', 'Shrink': 'Kecil', 'Undo area': 'Asal kawasan', 'Drag on the photo. Changes are kept when you pick another tool.': 'Seret pada gambar. Perubahan disimpan bila anda pilih alat lain.', 'Reshape applied': 'Bentuk digunakan',
  // text
  'Add text': 'Tambah teks', 'Styles': 'Gaya', 'Font': 'Fon', 'Label': 'Label', 'Shadow': 'Bayang', 'Glow': 'Bercahaya', 'Label colour': 'Warna label', 'Size': 'Saiz', 'Curve': 'Lengkung', 'Spacing': 'Jarak', 'Outline': 'Garis luar', 'Outline colour': 'Warna garis luar', 'Your text': 'Teks anda',
  'Pick a style or add text, then drag it on the photo. Tap text to edit it.': 'Pilih gaya atau tambah teks, kemudian seret pada gambar. Tekan teks untuk edit.',
  'Classic': 'Klasik', 'Neon': 'Neon', 'Retro': 'Retro', 'Diary': 'Diari', 'Type': 'Taip', 'Elegant': 'Elegan', 'Rainbow': 'Pelangi',
  // stickers
  'Your own': 'Milik anda', 'Mirror': 'Cermin', 'Save PNG': 'Simpan PNG', 'Sticker saved': 'Pelekat disimpan', 'Tap a sticker to add it, then drag it on the photo. Make your own in Cutout.': 'Tekan pelekat untuk tambah, kemudian seret pada gambar. Buat sendiri dalam Cutout.',
  // draw
  'Undo line': 'Buang garis', 'Neon glow': 'Cahaya neon', 'Draw on the photo with your finger or mouse.': 'Lukis pada gambar dengan jari atau tetikus.',
  // fx
  'Shuffle': 'Rawak', 'Light leak': 'Kebocoran cahaya', 'Warm': 'Hangat', 'Rose': 'Mawar', 'Sun': 'Matahari', 'Cool': 'Sejuk', 'Leak strength': 'Kekuatan cahaya', 'Dust': 'Habuk', 'Scratches': 'Calar', 'Date stamp': 'Cop tarikh', 'Or type your own, e.g. 98 08 24': 'Atau taip sendiri, cth. 98 08 24',
  // frames
  'White': 'Putih', 'Black': 'Hitam', 'Instant': 'Instant', 'Rounded': 'Bulat bucu', 'Float': 'Terapung', 'Taped': 'Bertampal', 'Cinema': 'Sinema', 'Stamp': 'Setem', 'Border size': 'Saiz bingkai', 'Roundness': 'Kebulatan', 'Bar size': 'Saiz jalur', 'Border colour': 'Warna bingkai', 'Caption': 'Kapsyen', 'Write something': 'Tulis sesuatu',
  // export
  'Fit for': 'Muat untuk', 'Square': 'Segi empat', 'Post 4:5': 'Pos 4:5', 'Story 9:16': 'Story 9:16', 'Wide 16:9': 'Lebar 16:9', 'Empty space': 'Ruang kosong', 'Blurred photo': 'Gambar kabur', 'Crop to fill': 'Potong untuk penuh',
  'Full': 'Penuh', 'Large': 'Besar', 'Small': 'Kecil', 'Format': 'Format', 'Save photo': 'Simpan gambar', 'Photo saved': 'Gambar disimpan', 'Could not save the photo': 'Tak dapat simpan gambar', 'PNG (transparent)': 'PNG (lutsinar)',
  // collage
  'Edit as photo': 'Edit sebagai gambar', 'Pick 2 to 9 photos': 'Pilih 2 hingga 9 gambar', 'Layout': 'Susun atur', 'Corners': 'Bucu', 'Selected photo': 'Gambar dipilih', 'Zoom': 'Zum', 'Move to next': 'Alih ke seterusnya',
  'Drag a photo to move it inside its box. Tap a photo for more options.': 'Seret gambar untuk alih dalam kotaknya. Tekan gambar untuk pilihan lain.', 'Pick at least 2 photos to start.': 'Pilih sekurang-kurangnya 2 gambar untuk mula.',
  'Add a title, e.g. Summer 2026': 'Tambah tajuk, cth. Cuti 2026', 'Top': 'Atas', 'Middle': 'Tengah', 'Bottom': 'Bawah', 'Own strip': 'Jalur sendiri', 'Text size': 'Saiz teks', 'Opening photos…': 'Membuka gambar…', 'Add one more photo': 'Tambah satu lagi gambar', 'Collage saved': 'Kolaj disimpan',
  // batch
  'Pick photos': 'Pilih gambar', 'Use one look on many photos at once.': 'Guna satu look pada banyak gambar sekali gus.', 'Look for all': 'Look untuk semua', 'Save all': 'Simpan semua', 'Working…': 'Sedang proses…',
  'Language': 'Bahasa',
  // 1.2

  // 1.3
  'Rename': 'Tukar nama', 'This name is used for your saved photos and in Recent.': 'Nama ini digunakan untuk gambar yang disimpan dan dalam Terkini.', 'Renamed': 'Nama ditukar', 'Type a name first': 'Taip nama dulu', 'File name': 'Nama fail',
  'Make every photo': 'Jadikan setiap gambar', 'yours.': 'milik anda.', 'A beautiful photo editor that works right on your device.': 'Editor gambar yang cantik, terus dalam peranti anda.', 'or drop it here': 'atau lepaskan di sini', 'Sample photo': 'Gambar contoh', 'Project file': 'Fail projek',
  'Basics': 'Asas', 'Face': 'Muka', 'AI tools': 'Alat AI', 'Create': 'Cipta', 'Print': 'Cetak', 'White border': 'Bingkai putih', 'Square 5×5': 'Segi empat 5×5',
  'Raya': 'Raya', 'Merdeka': 'Merdeka', 'Wedding': 'Kahwin', 'Leave empty for the default words': 'Biar kosong untuk ayat asal', 'Packs': 'Pek', 'Cute': 'Comel',
  'Text on a path': 'Teks ikut garisan', 'Redraw path': 'Lukis semula garisan', 'Straight': 'Lurus', 'Draw a line on the photo for the text to follow': 'Lukis garisan pada gambar untuk teks ikut',
  'Enhance': 'Tajamkan', 'AI Enhance': 'Tajamkan AI', 'Sharper, same size': 'Lebih tajam, saiz sama', '2× bigger': '2× lebih besar', '4× bigger': '4× lebih besar', 'Enhanced': 'Siap ditajamkan', 'Enhance could not run here': 'Tajamkan tak dapat berjalan di sini',
  'Makes blurry, small or old photos sharper and cleaner with AI.': 'Jadikan gambar kabur, kecil atau lama lebih tajam dan bersih dengan AI.', 'The first time, the AI needs a moment to get ready. Bigger photos take longer.': 'Kali pertama, AI perlukan sedikit masa. Gambar besar ambil masa lebih lama.',
  'This photo is already big. Enhance works best on photos under 2000 px, like screenshots, old photos or small downloads.': 'Gambar ini sudah besar. Tajamkan paling sesuai untuk gambar bawah 2000 px, macam tangkap layar, gambar lama atau muat turun kecil.', 'Getting the AI ready…': 'Menyediakan AI…',
  'Scan': 'Imbas', 'Scan document': 'Imbas dokumen', 'Find page': 'Cari halaman', 'Whole photo': 'Seluruh gambar', 'Clean up': 'Bersihkan', 'Make scan': 'Buat imbasan', 'Making scan…': 'Membuat imbasan…', 'Scan ready': 'Imbasan siap',
  'Turn a photo of a page, receipt or whiteboard into a flat, clean scan. Drag the corners onto the page.': 'Tukar gambar halaman, resit atau papan putih jadi imbasan rata dan bersih. Seret bucu ke atas halaman.',
  'Sky': 'Langit', 'Finding the sky…': 'Mencari langit…', 'Blue sky': 'Langit biru', 'Cotton candy': 'Gula kapas', 'Starry night': 'Malam berbintang', 'Storm': 'Ribut', 'Golden hour': 'Senja keemasan', 'Tap a sky to start.': 'Tekan langit untuk mula.',
  'Swap a dull sky for a new one. Works best on outdoor photos with open sky at the top.': 'Tukar langit yang suram dengan yang baru. Paling baik untuk gambar luar dengan langit terbuka di atas.', 'Not perfect at the edges? Use Brush → Sky with a wipe to fix it.': 'Tepi tak kemas? Guna Berus → Langit dengan lap untuk baiki.',
  'Effects': 'Kesan', 'Colour splash': 'Percikan warna', 'Keep person in colour': 'Kekalkan warna orang', 'Everything turns black and white except the colour you pick.': 'Semua jadi hitam putih kecuali warna yang anda pilih.', 'Colour range': 'Julat warna',
  'Glitch': 'Glitch', 'RGB split': 'Pecahan RGB', 'VHS tape': 'Pita VHS', 'Art style': 'Gaya seni', 'Pencil sketch': 'Lakaran pensel', 'Watercolour': 'Cat air', 'Pop art': 'Pop art', 'Cartoon': 'Kartun',
  'Reduce shine': 'Kurangkan kilat', 'Makeup': 'Solekan', 'Lipstick': 'Gincu', 'Eyeshadow': 'Pembayang mata', 'Hair colour': 'Warna rambut', 'Find hair': 'Cari rambut', 'Finding the hair…': 'Mencari rambut…', 'Colour strength': 'Kekuatan warna', 'Could not find the hair': 'Tak jumpa rambut',
  'Body': 'Badan', 'Slim body': 'Rampingkan badan', 'Longer legs': 'Panjangkan kaki', 'Body works on full or half-body photos of one person.': 'Badan berfungsi pada gambar penuh atau separuh badan seorang.',
  'Vertical tilt': 'Condong menegak', 'Horizontal tilt': 'Condong melintang', 'Auto straighten': 'Lurus auto', 'Already straight': 'Sudah lurus', 'Guides': 'Panduan', 'Thirds': 'Pertiga', 'Golden': 'Emas', 'Grid': 'Grid', 'Centre': 'Tengah',
  'Texture': 'Tekstur', 'Paper': 'Kertas', 'Fabric': 'Kain', 'Bokeh': 'Bokeh', 'Sparkle': 'Kilauan', 'Texture strength': 'Kekuatan tekstur', 'Double exposure': 'Dedahan berganda', 'Add a second photo': 'Tambah gambar kedua', 'Dark': 'Gelap', 'Overlay': 'Tindih', 'Soft': 'Lembut', 'Invert': 'Songsang', 'Fade edges': 'Pudarkan tepi', 'Change': 'Tukar', 'Mix': 'Campur',
  'Gradient': 'Gradien', '3D depth': 'Kedalaman 3D', '3D colour': 'Warna 3D', 'Sunset': 'Senja', 'Candy': 'Gula-gula', 'Layers': 'Lapisan', 'Lock': 'Kunci', 'Forward': 'Ke depan', 'Backward': 'Ke belakang', 'Drawing': 'Lukisan',
  'Pick from photo': 'Ambil dari gambar', 'Tap the photo to pick a colour': 'Tekan gambar untuk ambil warna',
  'Suggested for this photo': 'Dicadangkan untuk gambar ini', 'Add from code': 'Tambah dari kod', 'Share this look': 'Kongsi look ini', 'Add a look from a code': 'Tambah look dari kod', 'Paste a code a friend shared with you. It starts with RG1.': 'Tampal kod yang dikongsi kawan. Ia bermula dengan RG1.', 'Add look': 'Tambah look',
  'That code does not look right': 'Kod itu nampak tak betul', 'Look added to My looks': 'Look ditambah ke Look saya', 'Code copied. Send it to a friend': 'Kod disalin. Hantar kepada kawan', 'Copy this code and send it.': 'Salin kod ini dan hantar.', 'Shared look': 'Look dikongsi',
  'Also save film fx, frame, effects and lens blur': 'Simpan juga kesan filem, bingkai, kesan dan kabur lensa', 'Travel': 'Kembara', 'Café': 'Kafe', 'Night': 'Malam',
  'History': 'Sejarah', 'See every step and jump back': 'Lihat setiap langkah dan kembali', 'Tap a step to go back to it. You can still go forward again.': 'Tekan langkah untuk kembali ke situ. Anda masih boleh ke depan semula.', 'Erase / enhance / scan': 'Padam / tajamkan / imbas', 'Crop & rotate': 'Potong & putar', 'Text & stickers': 'Teks & pelekat', 'Edit': 'Edit',
  'Colour palette': 'Palet warna', 'The main colours of this photo': 'Warna utama gambar ini', 'Tap a colour to copy its code.': 'Tekan warna untuk salin kodnya.', 'Save palette': 'Simpan palet', 'Palette saved': 'Palet disimpan',
  'Album': 'Album', 'Put this photo in an album': 'Letak gambar ini dalam album', 'Group photos from one event, like a wedding or a trip.': 'Kumpulkan gambar dari satu majlis, macam kahwin atau percutian.', 'No album': 'Tiada album', 'New album name': 'Nama album baru', 'All': 'Semua', 'Removed from album': 'Dibuang dari album',
  'Send project file': 'Hantar fail projek', 'Keep editing on another phone or computer': 'Sambung edit di phone atau komputer lain', 'Project file saved. Open it in Darlia on the other device': 'Fail projek disimpan. Buka dalam Darlia di peranti lain', 'Open project file': 'Buka fail projek', 'That is not a Darlia project file': 'Itu bukan fail projek Darlia', 'Could not make the file': 'Tak dapat buat fail',
  'Light mode': 'Mod terang', 'Dark mode': 'Mod gelap', 'Look of the app': 'Rupa app', 'Theme': 'Tema',
  'Moving GIF': 'GIF bergerak', 'JPG quality': 'Kualiti JPG', 'Sparkles': 'Kilauan', 'Snow': 'Salji', 'Confetti': 'Konfeti', 'Hearts': 'Hati', 'Instagram grid': 'Grid Instagram', '3 posts': '3 pos', '6 posts': '6 pos', '9 posts': '9 pos',
  'Extras': 'Tambahan', 'Watermark': 'Tera air', 'Edit watermark': 'Edit tera air', 'Keep camera info': 'Simpan info kamera', 'Remove location': 'Buang lokasi', 'Mockups': 'Mockup', 'Share': 'Kongsi', 'This photo has no camera info': 'Gambar ini tiada info kamera',
  'Your name or logo, added to photos when you export.': 'Nama atau logo anda, ditambah pada gambar bila eksport.', 'Logo': 'Logo', 'Pick logo (PNG works best)': 'Pilih logo (PNG paling sesuai)', 'Change logo': 'Tukar logo', 'Position': 'Kedudukan', 'Opacity': 'Kelegapan', 'Watermark saved': 'Tera air disimpan', 'Logo too big to save': 'Logo terlalu besar untuk disimpan', 'e.g. @yourname': 'cth. @namaanda',
  'See your photo on products. Tap one to save it.': 'Lihat gambar anda pada produk. Tekan untuk simpan.', 'Making mockups…': 'Membuat mockup…', 'T-shirt: white': 'Baju: putih', 'T-shirt: black': 'Baju: hitam', 'Mockup saved': 'Mockup disimpan',
  'Wall poster': 'Poster dinding', 'T-shirt': 'Baju-T', 'Mug': 'Mug', 'Phone': 'Telefon', 'Tote bag': 'Beg tote', 'Canvas print': 'Cetakan kanvas',
  'Video': 'Video', 'Pick a video': 'Pilih video', 'Up to 60 seconds. Everything happens on your device.': 'Sehingga 60 saat. Semuanya berlaku dalam peranti anda.', 'Save video': 'Simpan video', 'Look': 'Look', 'Saving…': 'Menyimpan…', 'Video saved': 'Video disimpan',
  'Saving plays the clip once through, so it takes as long as the video.': 'Menyimpan akan main klip sekali, jadi ambil masa sepanjang video.', 'This browser cannot save videos': 'Pelayar ini tak boleh simpan video', 'Only the first 60 seconds will be saved': 'Hanya 60 saat pertama akan disimpan',
  'Templates': 'Templat', 'Title': 'Tajuk', 'Polaroid wall': 'Dinding polaroid', 'Film strip': 'Jalur filem', 'Magazine': 'Majalah', 'Minimal': 'Minimal', 'Birthday': 'Hari jadi',
  'Pick a tool': 'Pilih alat', 'All the tools are in the bar. Start with Looks for a quick style, or Adjust to fine-tune.': 'Semua alat ada di bar. Mula dengan Looks untuk gaya pantas, atau Laras untuk halusi.', 'Zoom in': 'Zum masuk',
  'Pinch with two fingers, or scroll on a computer. Double-tap to jump in and out.': 'Cubit dengan dua jari, atau skrol di komputer. Tekan dua kali untuk zum laju.', 'Before and after': 'Sebelum dan selepas', 'Tap the compare button for a slider. Hold it to see the original.': 'Tekan butang banding untuk gelangsar. Tahan untuk lihat asal.',
  'Saved for you': 'Disimpan untuk anda', 'Every edit is saved on this device. Find your photos under Recent on the home screen.': 'Setiap edit disimpan dalam peranti ini. Cari gambar anda di Terkini pada skrin utama.', 'Skip': 'Langkau', 'Next': 'Seterusnya', 'Start editing': 'Mula edit', 'Noise reduction': 'Kurangkan hingar',
};
const PAT = [
  [/^(\d+) faces? found\.$/, (m) => `${m[1]} muka dijumpai.`], [/^(\d+) photos?$/, (m) => `${m[1]} gambar`], [/^(\d+) photos? saved$/, (m) => `${m[1]} gambar disimpan`],
  [/^Photo (\d+) of (\d+)…$/, (m) => `Gambar ${m[1]} daripada ${m[2]}…`], [/^(\d+) min ago$/, (m) => `${m[1]} minit lalu`], [/^(\d+) h ago$/, (m) => `${m[1]} jam lalu`], [/^(\d+) days ago$/, (m) => `${m[1]} hari lalu`],
  [/^Getting the eraser ready… (\d+)%$/, (m) => `Menyediakan pemadam… ${m[1]}%`], [/^My look (\d+)$/, (m) => `Look saya ${m[1]}`],
];
export let LANG = store.get('lang', (navigator.language || '').toLowerCase().startsWith('ms') ? 'ms' : 'en');
function tr(t) {
  const k = t.trim(); if (!k) return null;
  if (MS[k]) return MS[k];
  for (const [re, f] of PAT) { const m = k.match(re); if (m) return f(m); }
  // sentence by sentence
  const parts = k.split(/(?<=[.:!?])\s+/); if (parts.length > 1) { const out = parts.map((p) => MS[p] || null); if (out.every(Boolean)) return out.join(' '); }
  return null;
}
const ORIG = new WeakMap();
function doNode(n) {
  if (n.nodeType === 3) {
    if (n.parentElement && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement.tagName)) return;
    const cur = n.nodeValue, en = ORIG.get(n); let src = cur;
    if (en && en.ms === cur) src = en.en; // already translated
    if (LANG === 'ms') { const t = tr(src); if (t) { const out = src.replace(src.trim(), t); if (out !== cur) { ORIG.set(n, { en: src, ms: out }); n.nodeValue = out; } } }
    else if (en && en.ms === cur) n.nodeValue = en.en;
    return;
  }
  if (n.nodeType !== 1) return;
  for (const a of ['title', 'placeholder', 'aria-label']) {
    if (!n.hasAttribute(a)) continue; const key = 'data-en-' + a, en = n.getAttribute(key) || n.getAttribute(a);
    if (LANG === 'ms') { const t = tr(en); if (t) { n.setAttribute(key, en); n.setAttribute(a, t); } } else if (n.hasAttribute(key)) n.setAttribute(a, en);
  }
  for (const c of n.childNodes) doNode(c);
}
let obs = null;
export function startI18n() {
  document.documentElement.lang = LANG;
  doNode(document.body);
  if (obs) return;
  obs = new MutationObserver((ms) => { if (LANG !== 'ms') return; obs.disconnect(); for (const m of ms) { if (m.type === 'characterData') doNode(m.target); else m.addedNodes.forEach(doNode); if (m.type === 'attributes') doNode(m.target); } obs.observe(document.body, OPTS); });
  obs.observe(document.body, OPTS);
}
const OPTS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder'] };
export function setLang(l) { LANG = l; store.set('lang', l); document.documentElement.lang = l; doNode(document.body); }
export const t = (s) => (LANG === 'ms' ? tr(s) || s : s);
