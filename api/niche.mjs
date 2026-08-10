// api/niche.mjs — 1 fichier = toutes les pages niches SEO
var NICHES = {
  tatouage: {
    fr: {
      title: "Tatouage IA Gratuit : Créez votre design en 10 secondes (2026)",
      meta: "Générateur de tatouages IA gratuit. 3 essais sans inscription. Styles réaliste, tribal, aquarelle, géométrique. Images libres de droits.",
      h1: "Tatouage IA gratuit : votre design en 10 secondes",
      intro: "Trouver le tatouage parfait prend des heures. Avec IA Pixora, décrivez votre idée et obtenez 4 designs uniques en 10 secondes. Gratuit, sans inscription, libre de droits.",
      h2a: "Comment créer un tatouage avec l'IA ?",
      steps: ["Décrivez votre idée en une phrase", "Choisissez un style (réaliste, tribal, aquarelle)", "Générez 4 variations instantanément", "Téléchargez votre design favori"],
      h2b: "Exemples de prompts tatouage",
      prompts: ["Loup géométrique, style dotwork, noir et gris, fond blanc", "Rose aquarelle avec papillon, couleurs vives", "Crâne mexicain jour des morts, couleurs vives, détaillé", "Dragon japonais traditionnel, encre noire, style irezumi"],
      faq: [["Le générateur de tatouage IA est-il gratuit ?", "Oui, 3 essais gratuits sans inscription, puis accès illimité."], ["Puis-je utiliser le design chez un tatoueur ?", "Oui, les images sont libres de droits."], ["Faut-il créer un compte ?", "Non, 3 générations sans compte."]]
    },
    en: {
      title: "Free AI Tattoo Generator: Create Your Design in 10 Seconds (2026)",
      meta: "Free AI tattoo generator. 3 tries, no signup. Realistic, tribal, watercolor, geometric styles. Royalty-free images.",
      h1: "Free AI tattoo: your design in 10 seconds",
      intro: "Finding the perfect tattoo takes hours. With IA Pixora, describe your idea and get 4 unique designs in 10 seconds. Free, no signup, royalty-free.",
      h2a: "How to create a tattoo with AI?",
      steps: ["Describe your idea in one sentence", "Pick a style (realistic, tribal, watercolor)", "Generate 4 variations instantly", "Download your favorite design"],
      h2b: "Tattoo prompt examples",
      prompts: ["Geometric wolf, dotwork style, black and grey, white background", "Watercolor rose with butterfly, vivid colors", "Mexican day of the dead skull, vivid colors, detailed", "Traditional japanese dragon, black ink, irezumi style"],
      faq: [["Is the AI tattoo generator free?", "Yes, 3 free tries without signup."], ["Can I use the design at a tattoo shop?", "Yes, images are royalty-free."], ["Do I need an account?", "No, 3 generations without account."]]
    }
  },
  avatar: {
    fr: {
      title: "Avatar Pro IA Gratuit : Photo professionnelle en 10 secondes (2026)",
      meta: "Créez votre avatar professionnel par IA gratuitement. Idéal LinkedIn, CV, WhatsApp. 3 essais sans inscription.",
      h1: "Avatar pro IA gratuit : votre photo professionnelle",
      intro: "Une photo pro coûte cher en studio. L'IA génère votre avatar professionnel en 10 secondes. Gratuit et sans inscription.",
      h2a: "Comment créer un avatar professionnel avec l'IA ?",
      steps: ["Décrivez votre apparence et votre style", "Choisissez un fond (bureau, studio, uni)", "Générez 4 portraits qualité studio", "Téléchargez votre avatar pro"],
      h2b: "Exemples de prompts avatar",
      prompts: ["Portrait professionnel, costume sombre, fond bureau flou", "Avatar LinkedIn, sourire confiant, fond uni gris", "Photo pro femme, tailleur bleu, lumière naturelle", "Portrait corporate, chemise blanche, réaliste 8K"],
      faq: [["L'avatar IA est-il gratuit ?", "Oui, 3 essais gratuits sans inscription."], ["Puis-je l'utiliser sur LinkedIn ?", "Oui, libre de droits pour usage professionnel."], ["La qualité est-elle suffisante pour un CV ?", "Oui, rendu qualité studio haute résolution."]]
    },
    en: {
      title: "Free Pro AI Avatar: Professional Photo in 10 Seconds (2026)",
      meta: "Create your professional AI avatar for free. Perfect for LinkedIn, CV, WhatsApp. 3 tries, no signup.",
      h1: "Free pro AI avatar: your professional photo",
      intro: "A pro photo is expensive at the studio. AI generates your professional avatar in 10 seconds. Free, no signup.",
      h2a: "How to create a professional avatar with AI?",
      steps: ["Describe your look and style", "Pick a background (office, studio, solid)", "Generate 4 studio-quality portraits", "Download your pro avatar"],
      h2b: "Avatar prompt examples",
      prompts: ["Professional portrait, dark suit, blurred office background", "LinkedIn avatar, confident smile, solid grey background", "Business woman photo, blue blazer, natural light", "Corporate portrait, white shirt, realistic 8K"],
      faq: [["Is the AI avatar free?", "Yes, 3 free tries without signup."], ["Can I use it on LinkedIn?", "Yes, royalty-free for professional use."], ["Is the quality good enough for a CV?", "Yes, studio-quality high resolution."]]
    }
  },  anime: {
    fr: {
      title: "Anime IA Gratuit : Créez votre personnage en 10 secondes (2026)",
      meta: "Générateur anime IA gratuit. Styles Ghibli, shonen, kawaii, cyberpunk. 3 essais sans inscription.",
      h1: "Anime IA gratuit : votre personnage en 10 secondes",
      intro: "Créez votre personnage anime unique en 10 secondes. Styles Ghibli, shonen, kawaii ou cyberpunk. Gratuit, sans inscription.",
      h2a: "Comment créer un personnage anime avec l'IA ?",
      steps: ["Décrivez votre personnage (cheveux, yeux, style)", "Choisissez une ambiance (Ghibli, shonen, kawaii)", "Générez 4 variations instantanément", "Téléchargez votre personnage"],
      h2b: "Exemples de prompts anime",
      prompts: ["Personnage anime style Ghibli, couleurs pastel, cerisiers", "Héros shonen, cheveux argentés, aura électrique", "Personnage kawaii, grands yeux, style chibi", "Anime cyberpunk, néons, ville nocturne"],
      faq: [["Le générateur anime est-il gratuit ?", "Oui, 3 essais sans inscription."], ["Puis-je utiliser mon personnage commercialement ?", "Oui, libre de droits."], ["Quels styles anime sont disponibles ?", "Ghibli, shonen, kawaii, cyberpunk, et plus."]]
    },
    en: {
      title: "Free AI Anime: Create Your Character in 10 Seconds (2026)",
      meta: "Free AI anime generator. Ghibli, shonen, kawaii, cyberpunk styles. 3 tries, no signup.",
      h1: "Free AI anime: your character in 10 seconds",
      intro: "Create your unique anime character in 10 seconds. Ghibli, shonen, kawaii or cyberpunk styles. Free, no signup.",
      h2a: "How to create an anime character with AI?",
      steps: ["Describe your character (hair, eyes, style)", "Pick a mood (Ghibli, shonen, kawaii)", "Generate 4 variations instantly", "Download your character"],
      h2b: "Anime prompt examples",
      prompts: ["Anime character Ghibli style, pastel colors, cherry blossoms", "Shonen hero, silver hair, electric aura", "Kawaii character, big eyes, chibi style", "Cyberpunk anime, neon, night city"],
      faq: [["Is the anime generator free?", "Yes, 3 tries without signup."], ["Can I use my character commercially?", "Yes, royalty-free."], ["Which anime styles are available?", "Ghibli, shonen, kawaii, cyberpunk, and more."]]
    }
  },
  logo: {
    fr: {
      title: "Logo IA Gratuit : Créez votre logo professionnel en 10 secondes (2026)",
      meta: "Générateur de logos IA gratuit pour entrepreneurs. Minimaliste, géométrique, vintage. 3 essais sans inscription.",
      h1: "Logo IA gratuit : votre logo professionnel",
      intro: "Un logo professionnel coûte des centaines d'euros. L'IA génère votre logo en 10 secondes. Gratuit et libre de droits.",
      h2a: "Comment créer un logo avec l'IA ?",
      steps: ["Décrivez votre activité et votre style", "Choisissez un type (minimaliste, géométrique, vintage)", "Générez 4 propositions de logo", "Téléchargez votre logo"],
      h2b: "Exemples de prompts logo",
      prompts: ["Logo minimaliste café, tasse géométrique, vectoriel", "Logo vintage barbier, cercle, typographie rétro", "Logo géométrique montagne, lignes fines, moderne", "Logo abstract tech, dégradé bleu, forme simple"],
      faq: [["Le logo IA est-il gratuit ?", "Oui, 3 essais sans inscription."], ["Puis-je utiliser le logo pour mon entreprise ?", "Oui, libre de droits commercial."], ["Le logo est-il haute résolution ?", "Oui, image haute résolution prête à l'emploi."]]
    },
    en: {
      title: "Free AI Logo: Create Your Professional Logo in 10 Seconds (2026)",
      meta: "Free AI logo generator for entrepreneurs. Minimalist, geometric, vintage. 3 tries, no signup.",
      h1: "Free AI logo: your professional logo",
      intro: "A professional logo costs hundreds of dollars. AI generates your logo in 10 seconds. Free and royalty-free.",
      h2a: "How to create a logo with AI?",
      steps: ["Describe your business and style", "Pick a type (minimalist, geometric, vintage)", "Generate 4 logo proposals", "Download your logo"],
      h2b: "Logo prompt examples",
      prompts: ["Minimalist coffee logo, geometric cup, vector", "Vintage barber logo, circle, retro typography", "Geometric mountain logo, thin lines, modern", "Abstract tech logo, blue gradient, simple shape"],
      faq: [["Is the AI logo free?", "Yes, 3 tries without signup."], ["Can I use the logo for my business?", "Yes, commercial royalty-free."], ["Is the logo high resolution?", "Yes, ready-to-use high resolution image."]]
    }
  },
  animaux: {
    fr: {      title: "Animaux IA Royaux : Portrait majestueux de votre animal (2026)",
      meta: "Transformez votre animal en portrait royal par IA. Chat, chien, cheval en roi ou reine. Gratuit, 3 essais sans inscription.",
      h1: "Animaux IA royaux : portrait majestueux",
      intro: "Transformez votre chat ou chien en roi de la Renaissance. Le style animal royal est viral sur les réseaux. Gratuit, sans inscription.",
      h2a: "Comment créer un portrait royal de votre animal ?",
      steps: ["Décrivez votre animal (race, couleurs)", "Choisissez un costume (roi, reine, général)", "Générez 4 portraits majestueux", "Téléchargez et partagez"],
      h2b: "Exemples de prompts animaux royaux",
      prompts: ["Chat en roi Renaissance, couronne dorée, peinture à l'huile", "Chien en général napoléonien, uniforme, dramatique", "Cheval royal, armure dorée, palais, épique", "Lapin en reine victorienne, robe élégante"],
      faq: [["Le portrait animal est-il gratuit ?", "Oui, 3 essais sans inscription."], ["Est-ce un bon cadeau ?", "Oui, très populaire pour anniversaires."], ["Quels animaux fonctionnent ?", "Chats, chiens, chevaux, lapins, oiseaux..."]]
    },
    en: {
      title: "Royal AI Animals: Majestic Portrait of Your Pet (2026)",
      meta: "Turn your pet into a royal AI portrait. Cat, dog, horse as king or queen. Free, 3 tries, no signup.",
      h1: "Royal AI animals: majestic portrait",
      intro: "Turn your cat or dog into a Renaissance king. The royal pet style is viral on social media. Free, no signup.",
      h2a: "How to create a royal portrait of your pet?",
      steps: ["Describe your pet (breed, colors)", "Pick a costume (king, queen, general)", "Generate 4 majestic portraits", "Download and share"],
      h2b: "Royal animal prompt examples",
      prompts: ["Cat as Renaissance king, golden crown, oil painting", "Dog as napoleonic general, uniform, dramatic", "Royal horse, golden armor, palace, epic", "Rabbit as victorian queen, elegant dress"],
      faq: [["Is the pet portrait free?", "Yes, 3 tries without signup."], ["Is it a good gift?", "Yes, very popular for birthdays."], ["Which animals work?", "Cats, dogs, horses, rabbits, birds..."]]
    }
  }
};

// ===== ESPAGNOL (ES) =====
var ES = {
  tatouage: {
    title: "Tatuaje IA Gratis: Crea tu diseño en 10 segundos (2026)",
    meta: "Generador de tatuajes IA gratuito. 3 pruebas sin registro. Estilos realista, tribal, acuarela, geométrico. Imágenes libres de derechos.",
    h1: "Tatuaje IA gratis: tu diseño en 10 segundos",
    intro: "Encontrar el tatuaje perfecto lleva horas. Con IA Pixora, describe tu idea y obtén 4 diseños únicos en 10 segundos. Gratis, sin registro, libre de derechos.",
    h2a: "¿Cómo crear un tatuaje con IA?",
    steps: ["Describe tu idea en una frase", "Elige un estilo (realista, tribal, acuarela)", "Genera 4 variaciones al instante", "Descarga tu diseño favorito"],
    h2b: "Ejemplos de prompts de tatuaje",
    prompts: ["Lobo geométrico, estilo dotwork, negro y gris, fondo blanco", "Rosa acuarela con mariposa, colores vivos", "Calavera mexicana día de los muertos, colores vivos, detallada", "Dragón japonés tradicional, tinta negra, estilo irezumi"],
    faq: [["¿Es gratis el generador de tatuajes IA?", "Sí, 3 pruebas gratis sin registro y luego acceso ilimitado."], ["¿Puedo usar el diseño en un estudio de tatuajes?", "Sí, las imágenes son libres de derechos."], ["¿Necesito crear una cuenta?", "No, 3 generaciones sin cuenta."]]
  },
  avatar: {
    title: "Avatar Pro IA Gratis: Foto profesional en 10 segundos (2026)",
    meta: "Crea tu avatar profesional con IA gratis. Ideal para LinkedIn, CV, WhatsApp. 3 pruebas sin registro.",
    h1: "Avatar pro IA gratis: tu foto profesional",
    intro: "Una foto profesional cuesta caro en estudio. La IA genera tu avatar profesional en 10 segundos. Gratis y sin registro.",
    h2a: "¿Cómo crear un avatar profesional con IA?",
    steps: ["Describe tu aspecto y tu estilo", "Elige un fondo (oficina, estudio, liso)", "Genera 4 retratos calidad estudio", "Descarga tu avatar pro"],
    h2b: "Ejemplos de prompts de avatar",
    prompts: ["Retrato profesional, traje oscuro, fondo de oficina desenfocado", "Avatar LinkedIn, sonrisa segura, fondo gris liso", "Foto profesional mujer, blazer azul, luz natural", "Retrato corporativo, camisa blanca, realista 8K"],
    faq: [["¿Es gratis el avatar IA?", "Sí, 3 pruebas gratis sin registro."], ["¿Puedo usarlo en LinkedIn?", "Sí, libre de derechos para uso profesional."], ["¿La calidad sirve para un CV?", "Sí, calidad de estudio en alta resolución."]]
  },
  anime: {
    title: "Anime IA Gratis: Crea tu personaje en 10 segundos (2026)",    meta: "Generador de anime IA gratuito. Estilos Ghibli, shonen, kawaii, cyberpunk. 3 pruebas sin registro.",
    h1: "Anime IA gratis: tu personaje en 10 segundos",
    intro: "Crea tu personaje de anime único en 10 segundos. Estilos Ghibli, shonen, kawaii o cyberpunk. Gratis, sin registro.",
    h2a: "¿Cómo crear un personaje de anime con IA?",
    steps: ["Describe tu personaje (pelo, ojos, estilo)", "Elige un ambiente (Ghibli, shonen, kawaii)", "Genera 4 variaciones al instante", "Descarga tu personaje"],
    h2b: "Ejemplos de prompts de anime",
    prompts: ["Personaje anime estilo Ghibli, colores pastel, cerezos en flor", "Héroe shonen, pelo plateado, aura eléctrica", "Personaje kawaii, ojos grandes, estilo chibi", "Anime cyberpunk, neones, ciudad nocturna"],
    faq: [["¿Es gratis el generador de anime?", "Sí, 3 pruebas sin registro."], ["¿Puedo usar mi personaje comercialmente?", "Sí, libre de derechos."], ["¿Qué estilos de anime hay?", "Ghibli, shonen, kawaii, cyberpunk y más."]]
  },
  logo: {
    title: "Logo IA Gratis: Crea tu logo profesional en 10 segundos (2026)",
    meta: "Generador de logos IA gratuito para emprendedores. Minimalista, geométrico, vintage. 3 pruebas sin registro.",
    h1: "Logo IA gratis: tu logo profesional",
    intro: "Un logo profesional cuesta cientos de euros. La IA genera tu logo en 10 segundos. Gratis y libre de derechos.",
    h2a: "¿Cómo crear un logo con IA?",
    steps: ["Describe tu negocio y tu estilo", "Elige un tipo (minimalista, geométrico, vintage)", "Genera 4 propuestas de logo", "Descarga tu logo"],
    h2b: "Ejemplos de prompts de logo",
    prompts: ["Logo minimalista cafetería, taza geométrica, vectorial", "Logo vintage barbería, círculo, tipografía retro", "Logo geométrico montaña, líneas finas, moderno", "Logo abstracto tech, degradado azul, forma simple"],
    faq: [["¿Es gratis el logo IA?", "Sí, 3 pruebas sin registro."], ["¿Puedo usar el logo para mi empresa?", "Sí, libre de derechos comerciales."], ["¿El logo es de alta resolución?", "Sí, imagen en alta resolución lista para usar."]]
  },
  animaux: {
    title: "Animales IA Reales: Retrato majestuoso de tu mascota (2026)",
    meta: "Convierte a tu mascota en un retrato real con IA. Gato, perro, caballo como rey o reina. Gratis, 3 pruebas sin registro.",
    h1: "Animales IA reales: retrato majestuoso",
    intro: "Convierte a tu gato o perro en un rey del Renacimiento. El estilo mascota real es viral en redes. Gratis, sin registro.",
    h2a: "¿Cómo crear un retrato real de tu mascota?",
    steps: ["Describe tu mascota (raza, colores)", "Elige un disfraz (rey, reina, general)", "Genera 4 retratos majestuosos", "Descarga y comparte"],
    h2b: "Ejemplos de prompts de animales reales",
    prompts: ["Gato como rey del Renacimiento, corona dorada, óleo", "Perro como general napoleónico, uniforme, dramático", "Caballo real, armadura dorada, palacio, épico", "Conejo como reina victoriana, vestido elegante"],
    faq: [["¿Es gratis el retrato de mascota?", "Sí, 3 pruebas sin registro."], ["¿Es un buen regalo?", "Sí, muy popular para cumpleaños."], ["¿Qué animales funcionan?", "Gatos, perros, caballos, conejos, aves..."]]
  }
};
for (var esKey in ES) { if (NICHES[esKey]) { NICHES[esKey].es = ES[esKey]; } }

var UI = {
  fr: { back: "← IA Pixora", try: "Essayer gratuitement", create: "Créer mon image gratuite", gallery: "Voir la galerie publique", faq: "FAQ" },
  en: { back: "← IA Pixora", try: "Try for free", create: "Create my free image", gallery: "View public gallery", faq: "FAQ" },
  es: { back: "← IA Pixora", try: "Probar gratis", create: "Crear mi imagen gratis", gallery: "Ver galería pública", faq: "FAQ" },
  de: { back: "← IA Pixora", try: "Kostenlos testen", create: "Mein Bild erstellen", gallery: "Galerie ansehen", faq: "FAQ" },
  pt: { back: "← IA Pixora", try: "Testar grátis", create: "Criar minha imagem grátis", gallery: "Ver galeria pública", faq: "FAQ" }
};
var FLAGS = { fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", de: "🇩🇪", pt: "🇧🇷" };

function buildPage(d, lang, niche, allLangs) {
  var ui = UI[lang] || UI.en;

  var langBar = "<p style='margin:12px 0'>";
  for (var i2 = 0; i2 < allLangs.length; i2++) {
    var ll = allLangs[i2];
    langBar += "<a href='https://iapixora.com/niche/" + ll + "/" + niche + "' style='margin-right:14px;text-decoration:" + (ll === lang ? "underline" : "none") + ";font-weight:700'>" + (FLAGS[ll] || "🌐") + " " + ll.toUpperCase() + "</a>";  }
  langBar += "</p>";

  var hreflang = "";
  for (var i = 0; i < allLangs.length; i++) {
    var l = allLangs[i];
    hreflang += '<link rel="alternate" hreflang="' + l + '" href="https://iapixora.com/niche/' + l + '/' + niche + '">';
  }
  hreflang += '<link rel="alternate" hreflang="x-default" href="https://iapixora.com/niche/en/' + niche + '">';

  var faqJson = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": d.faq.map(function (f) {
      return { "@type": "Question", "name": f[0], "acceptedAnswer": { "@type": "Answer", "text": f[1] } };
    })
  };

  var stepsHtml = "";
  for (var s = 0; s < d.steps.length; s++) { stepsHtml += "<li><strong>" + (s + 1) + ".</strong> " + d.steps[s] + "</li>"; }
  var promptsHtml = "";
  for (var p = 0; p < d.prompts.length; p++) { promptsHtml += "<li>" + d.prompts[p] + "</li>"; }
  var faqHtml = "";
  for (var f = 0; f < d.faq.length; f++) { faqHtml += "<h3>" + d.faq[f][0] + "</h3><p>" + d.faq[f][1] + "</p>"; }

  return "<!DOCTYPE html><html lang='" + lang + "'><head>" +
    "<meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'>" +
    "<title>" + d.title + "</title>" +
    "<meta name='description' content='" + d.meta + "'>" +
    "<link rel='canonical' href='https://iapixora.com/niche/" + lang + "/" + niche + "'>" +
    hreflang +
    "<script type='application/ld+json'>" + JSON.stringify(faqJson) + "</script>" +
    "<style>body{background:#050507;color:#FAFAFA;font-family:Inter,sans-serif;line-height:1.6;margin:0;padding:20px;max-width:800px;margin:0 auto}h1{color:#8B5CF6}h2{color:#EC4899;margin-top:32px}a{color:#8B5CF6}li{margin:8px 0}.cta{display:inline-block;background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin:20px 0}</style>" +
    "</head><body>" +
    langBar +
    "<p><a href='https://iapixora.com'>" + ui.back + "</a></p>" +
    "<h1>" + d.h1 + "</h1>" +
    "<p>" + d.intro + "</p>" +
    "<a class='cta' href='https://iapixora.com'>" + ui.try + "</a>" +
    "<h2>" + d.h2a + "</h2><ol>" + stepsHtml + "</ol>" +
    "<h2>" + d.h2b + "</h2><ul>" + promptsHtml + "</ul>" +
    "<h2>" + ui.faq + "</h2>" + faqHtml +
    "<a class='cta' href='https://iapixora.com'>" + ui.create + "</a>" +
    "<p><a href='https://iapixora.com/gallery.html'>" + ui.gallery + "</a></p>" +
    "</body></html>";
}

export default function (req, res) {
  try {
    var lang = String(req.query.lang || "fr").toLowerCase();    var niche = String(req.query.niche || "").toLowerCase();
    var n = NICHES[niche];
    var d = n && n[lang];

    res.setHeader("Content-Type", "text/html; charset=utf-8");

    if (!d) {
      res.statusCode = 404;
      res.end("<h1>404</h1><p>Page introuvable. <a href='https://iapixora.com'>Retour IA Pixora</a></p>");
      return;
    }

    res.statusCode = 200;
    res.end(buildPage(d, lang, niche, Object.keys(n)));
  } catch (e) {
    res.statusCode = 500;
    res.end("Erreur");
  }
}
