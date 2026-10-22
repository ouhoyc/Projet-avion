R=[]
def r(**k): R.append(k)
# --- petit
r(id='san-gines',nom='Chocolatería San Ginés',emoji='🍫',gamme='petit',genre='Chocolat chaud et churros',quartier='Sol',adresse='Pasadizo de San Ginés, 5, 28013 Madrid',lat=40.416934,lng=-3.706952,
 prix='5 à 10 €',prix_min=5,badges=['institution','tendance'],
 texte="Depuis 1894, on vient tremper des churros et des porras dans un chocolat épais comme une crème, à toute heure, même à 4 h du matin après une sortie. Miroirs, banquettes vertes et file d'attente qui avance vite : un rite madrilène.",
 reservation='sur_place',reservation_delai="pas de réservation ; file plus courte en milieu d'après-midi")
r(id='casa-labra',nom='Casa Labra',emoji='🐟',gamme='petit',genre='Beignets de morue',quartier='Sol',adresse='Calle de Tetuán, 12, 28013 Madrid',lat=40.417172,lng=-3.704593,
 prix='5 à 15 €',prix_min=5,badges=['institution'],
 texte="Une taverne de 1860 où l'on mange debout, au comptoir, sa spécialité : la « tajada de bacalao », un beignet de morue doré et croustillant, avec un petit verre de vin. C'est ici que fut fondé le parti socialiste espagnol en 1879.",
 reservation='sur_place',reservation_delai='pas de réservation : on commande au comptoir')
r(id='la-campana',nom='La Campana',emoji='🥖',gamme='petit',genre='Sandwich aux calamars',quartier='Plaza Mayor',adresse='Calle de Botoneras, 6, 28012 Madrid',lat=40.414912,lng=-3.706822,
 prix='5 à 12 €',prix_min=5,badges=[],
 texte="Le « bocadillo de calamares », un pain croustillant rempli de calamars frits, est LE sandwich de Madrid. Juste à côté de la Plaza Mayor, La Campana en sert parmi les meilleurs, à manger sur le pouce avec une bière.",
 reservation='sur_place',reservation_delai='pas de réservation ; souvent bondé à midi')
r(id='casa-dani',nom='Casa Dani',emoji='🍳',gamme='petit',genre='Tortilla espagnole',quartier='Salamanca (marché de la Paz)',adresse='Calle de Ayala, 28 (Mercado de la Paz), 28001 Madrid',lat=40.427024,lng=-3.685663,
 prix='5 à 15 €',prix_min=5,badges=[],
 texte="Dans le marché couvert de la Paz, ce comptoir fait l'une des tortillas les plus célèbres d'Espagne, coulante à cœur, primée plusieurs fois. Les Madrilènes viennent dès le matin pour une part avec un café, ou à midi pour le menu du jour.",
 reservation='sur_place',reservation_delai='pas de réservation ; venez avant 13 h 30')
r(id='takos',nom='Takos Al Pastor',emoji='🌮',gamme='petit',genre='Tacos mexicains',quartier='Gran Vía',adresse='Calle de la Salud, 13, 28013 Madrid',lat=40.419282,lng=-3.703437,
 prix='5 à 12 €',prix_min=5,badges=[],
 texte="La file d'attente la plus célèbre de Madrid : des tacos al pastor cuits à la broche, vendus 1,50 € pièce, à deux pas de la Gran Vía. Ambiance de cantine, rapide et pas chère, idéale entre deux visites.",
 reservation='sur_place',reservation_delai='pas de réservation : comptez 15 à 30 min de file')
r(id='san-miguel',nom='Marché de San Miguel',emoji='🏛️',gamme='petit',genre='Halle gourmande (tapas)',quartier='Plaza Mayor',adresse='Plaza de San Miguel, s/n, 28005 Madrid',lat=40.415379,lng=-3.70897,
 prix='15 à 30 €',prix_min=15,badges=['tendance'],
 texte="Une halle de fer et de verre de 1916 transformée en paradis des tapas : huîtres, jambon ibérique, croquetas, vermouth, le tout à picorer d'un stand à l'autre. Plus cher qu'un marché de quartier, mais le décor et l'ambiance valent le détour.",
 reservation='sur_place',reservation_delai='pas de réservation ; moins de monde avant midi')
# --- moyen
r(id='botin',nom='Sobrino de Botín',emoji='🐖',gamme='moyen',genre='Cochon de lait rôti',quartier='Plaza Mayor',adresse='Calle de Cuchilleros, 17, 28005 Madrid',lat=40.414193,lng=-3.707976,
 prix='45 à 60 €',prix_min=45,badges=['institution','tendance'],
 texte="Le plus vieux restaurant du monde selon le Guinness (1725) : son four à bois n'est jamais éteint, Goya y aurait fait la plonge et Hemingway l'a rendu célèbre. On y vient pour le cochon de lait rôti, à la peau qui craque, dans des caves voûtées.",
 reservation='indispensable',reservation_delai='1 à 2 semaines avant (pour les caves, précisez-le)')
r(id='casa-lucio',nom='Casa Lucio',emoji='🍳',gamme='moyen',genre='Œufs cassés (huevos rotos)',quartier='La Latina',adresse='Calle de la Cava Baja, 35, 28005 Madrid',lat=40.412084,lng=-3.709636,
 prix='40 à 55 €',prix_min=40,badges=['institution'],
 texte="Rois, stars d'Hollywood et présidents sont passés goûter ses célèbres « huevos rotos » : des œufs au plat cassés sur des frites maison, un plat simple devenu mythique. Une adresse de la Cava Baja, la rue des tavernes.",
 reservation='conseille',reservation_delai='quelques jours avant, surtout le week-end')
r(id='malacatin',nom='Malacatín',emoji='🍲',gamme='moyen',genre='Cocido madrilène',quartier='La Latina',adresse='Calle de la Ruda, 5, 28005 Madrid',lat=40.410313,lng=-3.707668,
 prix='25 à 40 €',prix_min=25,badges=['institution'],
 texte="Depuis 1895, une taverne aux murs couverts de souvenirs taurins qui sert le cocido, le pot-au-feu de Madrid, en trois services : soupe, pois chiches et légumes, puis viandes. Portions énormes : venez affamé, à midi.",
 reservation='conseille',reservation_delai='quelques jours avant (déjeuner surtout ; fermé le dimanche)')
r(id='bel-mondo',nom='Bel Mondo',emoji='🍝',gamme='moyen',genre='Trattoria italienne',quartier='Salamanca',adresse='Calle de Velázquez, 39, 28001 Madrid',lat=40.426063,lng=-3.68432,
 prix='30 à 45 €',prix_min=30,badges=['tendance'],
 texte="Une immense trattoria sur deux étages façon jardin d'hiver, sous des centaines de plantes suspendues et de lustres : l'un des décors les plus photographiés de Madrid, du groupe Big Mamma. Pizzas napolitaines et pâtes généreuses.",
 reservation='conseille',reservation_delai='en ligne quelques jours avant, ou file sans réservation')
r(id='bacira',nom='Bacira',emoji='🍣',gamme='moyen',genre='Cuisine fusion (Méditerranée, Japon, Pérou)',quartier='Chamberí',adresse='Calle del Castillo, 16, 28010 Madrid',lat=40.433787,lng=-3.699074,
 prix='40 à 55 €',prix_min=40,badges=['recompense'],recompense='Bib Gourmand Michelin',
 texte="Trois jeunes chefs mélangent les saveurs de la Méditerranée, du Japon et d'Amérique latine dans des assiettes à partager. Le Guide Michelin le distingue pour son excellent rapport qualité-prix.",
 reservation='indispensable',reservation_delai='1 à 2 semaines avant')
r(id='secretos',nom='Bodega de los Secretos',emoji='🕯️',gamme='moyen',genre='Cuisine espagnole dans une cave voûtée',quartier='Huertas',adresse='Calle de San Blas, 4, 28014 Madrid',lat=40.410678,lng=-3.694723,
 prix='40 à 55 €',prix_min=40,badges=[],
 texte="On dîne dans des alcôves creusées sous une cave du XVIIe siècle, éclairées aux bougies : le restaurant le plus romantique (et le plus photogénique) de Madrid, à deux pas du Prado. Cuisine espagnole moderne.",
 reservation='indispensable',reservation_delai='1 semaine avant (demandez une alcôve)')
# --- haut
r(id='diverxo',nom='DiverXO',emoji='🐷',gamme='haut',genre='Cuisine créative avant-gardiste',quartier='Chamartín',adresse='Calle del Padre Damián, 23 (hôtel NH Eurobuilding), 28036 Madrid',lat=40.457905,lng=-3.686108,
 prix='≈ 450 € (menu)',prix_min=450,badges=['recompense'],recompense="3 étoiles Michelin · élu meilleur chef du monde (Best Chef Awards)",
 texte="Le spectacle culinaire de Dabiz Muñoz, chef à la crête iroquoise élu meilleur chef du monde : des plats-tableaux peints sur l'assiette, mêlant Espagne et Asie, servis comme un show. Une expérience unique, et le prix qui va avec.",
 reservation='indispensable',reservation_delai='plusieurs mois avant, à l\'ouverture des réservations en ligne')
r(id='coque',nom='Coque',emoji='🍷',gamme='haut',genre='Grande cuisine castillane',quartier='Chamberí',adresse='Calle del Marqués de Riscal, 11, 28010 Madrid',lat=40.430682,lng=-3.690451,
 prix='≈ 300 à 365 € (menu)',prix_min=300,badges=['recompense'],recompense='2 étoiles Michelin',
 texte="Les frères Sandoval font voyager le repas dans plusieurs pièces : apéritif au bar, cave à vins, cuisine, puis salle. Leur cochon de lait laqué revisite la tradition castillane avec une précision d'orfèvre.",
 reservation='indispensable',reservation_delai='3 à 4 semaines avant')
r(id='dstage',nom='DSTAgE',emoji='🔥',gamme='haut',genre='Cuisine créative sans frontières',quartier='Chueca',adresse='Calle de Regueros, 8, 28004 Madrid',lat=40.424603,lng=-3.696359,
 prix='≈ 200 € (menu)',prix_min=200,badges=['recompense'],recompense='2 étoiles Michelin',
 texte="Dans un ancien atelier de briques et d'acier, Diego Guerrero cuisine sans règles entre Espagne, Japon et Mexique, sous les yeux des clients. Une adresse étoilée décontractée, au cœur du quartier branché de Chueca.",
 reservation='indispensable',reservation_delai='3 à 4 semaines avant')
r(id='streetxo',nom='StreetXO',emoji='🥢',gamme='haut',genre='Street food fusion',quartier='Salamanca',adresse='Calle de Serrano, 47, 28001 Madrid',lat=40.430151,lng=-3.687601,
 prix='60 à 90 €',prix_min=60,badges=[],
 texte="La version « street food » de DiverXO : un comptoir survolté où les cuisiniers envoient sous vos yeux des plats asiatiques explosifs, servis sur du papier. Le moyen de goûter Dabiz Muñoz sans payer 450 €.",
 reservation='conseille',reservation_delai='quelques jours avant (une partie du comptoir sans réservation)')
r(id='ten-con-ten',nom='Ten Con Ten',emoji='🥂',gamme='haut',genre='Cuisine de marché, adresse mondaine',quartier='Salamanca',adresse='Calle de Ayala, 6, 28001 Madrid',lat=40.427846,lng=-3.68851,
 prix='50 à 70 €',prix_min=50,badges=[],
 texte="Le rendez-vous chic du quartier de Salamanca : déco de serre élégante, bar à cocktails animé et clientèle de Madrilènes bien habillés. On y vient autant pour l'ambiance que pour sa cuisine de produits.",
 reservation='indispensable',reservation_delai='1 semaine avant (week-end très demandé)')
r(id='horcher',nom='Horcher',emoji='🦌',gamme='haut',genre='Cuisine classique et gibier',quartier='Retiro',adresse='Calle de Alfonso XII, 6, 28014 Madrid',lat=40.418671,lng=-3.689043,
 prix='90 à 130 €',prix_min=90,badges=['institution'],
 texte="Depuis 1943, face au parc du Retiro, un salon à l'ancienne avec boiseries et service en gants blancs : gibier, strogonoff flambé en salle et baumkuchen en dessert. Un voyage dans le Madrid aristocratique.",
 reservation='indispensable',reservation_delai='1 semaine avant ; veste conseillée pour les messieurs')
print(len(R))
