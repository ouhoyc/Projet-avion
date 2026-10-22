A=[]
def a(**k): A.append(k)
a(id='prado',nom='Musée du Prado',emoji='🖼️',type='culture',quartier='Paseo del Prado',lat=40.413782,lng=-3.692127,prix=15,
 prix_detail=[['Entrée générale',15],['Moins de 18 ans','gratuit'],['Gratuit pour tous','lun.-sam. 18 h-20 h, dim. 17 h-19 h']],
 tarifs={'adulte':15,'enfants':[[17,0]]},reservation='conseille',reservation_delai='billet à heure fixe en ligne la veille ou le matin même ; les créneaux gratuits du soir font une longue file',
 duree='2 h 30 à 3 h',moment="À l'ouverture (10 h), ou en fin d'après-midi juste avant le créneau gratuit",enfants=True,
 texte="L'un des plus grands musées de peinture au monde. Ici, face à face : Les Ménines de Velázquez, Le Tres de Mayo et les « peintures noires » de Goya, Le Jardin des délices de Bosch. Deux heures suffisent pour voir les chefs-d'œuvre, une vie pour tout voir.",
 site_officiel='https://www.museodelprado.es/',note="Achetez sur le site officiel : les revendeurs vendent le même billet plus cher.",a_verifier=False)
a(id='reina-sofia',nom='Musée Reina Sofía (Guernica)',emoji='🎨',type='culture',quartier='Atocha',lat=40.407912,lng=-3.694557,prix=12,
 prix_detail=[['Entrée générale',12],['Moins de 18 ans','gratuit'],['Gratuit pour tous','lun., mer. à sam. 19 h-21 h, dim. 12 h 30-14 h 30']],
 tarifs={'adulte':12,'enfants':[[17,0]]},reservation='sur_place',reservation_delai='en ligne pour éviter la file, sinon sur place',
 duree='2 h',moment='En semaine le matin ; fermé le mardi',enfants=True,
 texte="Le Guernica de Picasso, immense et bouleversant, se découvre ici en vrai, entouré de Dalí et Miró. L'ancien hôpital du XVIIIe siècle est prolongé par une aile rouge de Jean Nouvel et ses ascenseurs de verre.",
 site_officiel='https://www.museoreinasofia.es/',a_verifier=False)
a(id='thyssen',nom='Musée Thyssen-Bornemisza',emoji='🖼️',type='culture',quartier='Paseo del Prado',lat=40.416041,lng=-3.694925,prix=14,
 prix_detail=[['Entrée générale',14],['Plus de 65 ans et étudiants',10],['Moins de 18 ans','gratuit'],['Pass Paseo del Arte (Prado + Reina Sofía + Thyssen)',32.8]],
 tarifs={'adulte':14,'enfants':[[17,0]]},reservation='sur_place',reservation_delai='sur place ou en ligne le jour même',
 duree='2 h',moment='Le lundi après-midi, la collection permanente est gratuite',enfants=True,
 texte="Huit siècles de peinture en une visite : primitifs italiens, Rembrandt, impressionnistes, Van Gogh, Hopper et Lichtenstein. Le musée qui comble les « trous » du Prado, dans un palais face à la fontaine de Neptune.",
 site_officiel='https://www.museothyssen.org/',a_verifier=False)
a(id='palacio-real',nom='Palais royal',emoji='🏰',type='culture',quartier='Ópera',lat=40.417955,lng=-3.714312,prix=18,
 prix_detail=[['Entrée générale',18],['5 à 16 ans, étudiants, plus de 65 ans',9],['Moins de 5 ans','gratuit'],['Avec les cuisines royales ou la Galerie des collections royales',24]],
 tarifs={'adulte':18,'enfants':[[4,0],[16,9]]},reservation='conseille',reservation_delai='billet à heure fixe en ligne quelques jours avant (la file sature dès le milieu de matinée)',
 duree='1 h 30 à 2 h',moment="À l'ouverture (10 h) ; le palais peut fermer sans préavis pour une cérémonie officielle",enfants=True,
 texte="Le plus grand palais royal d'Europe de l'Ouest : 3 418 pièces, dont une cinquantaine se visitent. Salle du trône, salon de Gasparini couvert de soie, armurerie royale et violons Stradivarius : le faste des rois d'Espagne, toujours utilisé pour les réceptions officielles.",
 site_officiel='https://www.patrimonionacional.es/',note="Gratuit du lundi au jeudi en fin d'après-midi pour les citoyens de l'UE (16 h-18 h d'octobre à mars, 17 h-19 h d'avril à septembre), mais la file est longue.",a_verifier=False)
a(id='almudena',nom="Cathédrale de l'Almudena et sa coupole",emoji='⛪',type='vue',quartier='Ópera',lat=40.415715,lng=-3.713604,prix=8,
 prix_detail=[['Cathédrale','gratuit (don conseillé)'],['Musée et coupole',8]],
 tarifs={'adulte':8,'enfants':[]},reservation='sur_place',reservation_delai='billet au guichet du musée, sans réservation',
 duree='1 h',moment='Le matin (musée ouvert 10 h-14 h 30, fermé le dimanche)',enfants=True,
 texte="Face au Palais royal, la cathédrale de Madrid cache un trésor : son intérieur aux plafonds colorés, et surtout la montée à la coupole, d'où l'on voit tout le palais, la Casa de Campo et les montagnes de Guadarrama.",
 site_officiel='https://catedraldelaalmudena.es/',a_verifier=True)
a(id='goya',nom='Ermitage San Antonio de la Florida (fresques de Goya)',emoji='🎨',type='culture',quartier='Príncipe Pío',lat=40.425391,lng=-3.72559,prix=0,
 prix_detail=[['Entrée','gratuit']],tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='entrée libre',
 duree='30 min',moment='Du mardi au dimanche, de 9 h 30 à 20 h',enfants=True,
 texte="La « chapelle Sixtine de Goya » : une petite église où le peintre a couvert la coupole de fresques en 1798, avec un miracle peuplé de Madrilènes de son époque. Goya y est enterré. Gratuit et souvent presque vide.",
 site_officiel='https://www.madrid.es/',a_verifier=True)
a(id='caixaforum',nom='CaixaForum et son jardin vertical',emoji='🌿',type='culture',quartier='Paseo del Prado',lat=40.411112,lng=-3.693571,prix=6,
 prix_detail=[['Jardin vertical (dehors)','gratuit'],['Expositions',6],['Moins de 16 ans','gratuit']],
 tarifs={'adulte':6,'enfants':[[15,0]]},reservation='sur_place',reservation_delai='sur place',
 duree='1 h',moment="N'importe quand ; le jardin se photographie mieux en matinée",enfants=True,
 texte="Une ancienne centrale électrique en brique qui semble flotter au-dessus du sol, signée Herzog & de Meuron, et à côté un mur de 24 m couvert de 15 000 plantes. Dedans, de belles expositions temporaires d'art et de design.",
 site_officiel='https://caixaforum.org/es/madrid',a_verifier=True)
a(id='circulo',nom='Terrasse du Círculo de Bellas Artes',emoji='🌇',type='vue',quartier='Gran Vía',lat=40.418304,lng=-3.696533,prix=6,
 prix_detail=[['Accès à la terrasse',6],['Tarif réduit (7-12 ans, plus de 65 ans…)',5]],
 tarifs={'adulte':6,'enfants':[[12,5]]},reservation='sur_place',reservation_delai='billet sur place ou en ligne le jour même',
 duree='45 min à 1 h',moment='Au coucher du soleil, quand la Gran Vía s\'allume',enfants=True,badges=['tendance'],
 texte="La plus belle vue sur le début de la Gran Vía et le dôme de l'édifice Metrópolis, à vos pieds, sous la statue de Minerve. On y prend un verre au coucher du soleil : c'est LA photo de Madrid.",
 site_officiel='https://www.circulobellasartes.com/azotea/',a_verifier=False)
a(id='riu-360',nom='Rooftop 360° du Riu Plaza España',emoji='🌆',type='vue',quartier='Plaza de España',lat=40.424159,lng=-3.710706,prix=10,
 prix_detail=[['Entrée de 11 h à 17 h','≈ 5 €'],['Entrée de 17 h à minuit','≈ 10 €']],
 tarifs={'adulte':10,'enfants':[]},reservation='sur_place',reservation_delai="pas de réservation : file d'attente au pied de l'hôtel, plus courte en début d'après-midi",
 duree='1 h',moment="En début d'après-midi pour éviter la file ; au coucher du soleil pour la vue",enfants=True,badges=['tendance'],
 texte="Au 27e étage, une terrasse à 360° sur tout Madrid, avec sa passerelle de verre suspendue dans le vide, très photographiée. Vue sur le Palais royal, la cathédrale et la Gran Vía.",
 site_officiel='https://www.riu.com/',note="Les avis signalent une longue file et des boissons chères : venez plutôt en début d'après-midi.",a_verifier=True)
a(id='debod',nom='Temple de Debod au coucher du soleil',emoji='🌅',type='vue',quartier='Parque del Oeste',lat=40.424022,lng=-3.717769,prix=0,
 prix_detail=[['Parc et temple','gratuit']],tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='accès libre au parc',
 duree='45 min',moment='Au coucher du soleil',enfants=True,badges=['tendance'],
 texte="Un vrai temple égyptien de plus de 2 000 ans, offert par l'Égypte et remonté pierre par pierre au-dessus du Palais royal. Au coucher du soleil, il se reflète dans son bassin : le rendez-vous préféré des Madrilènes (et d'Instagram).",
 site_officiel='https://www.esmadrid.com/informacion-turistica/templo-de-debod',a_verifier=False)
a(id='faro',nom='Phare de Moncloa',emoji='🗼',type='vue',quartier='Moncloa',lat=40.436944,lng=-3.721667,prix=4,
 prix_detail=[['Adulte',4],['7 à 14 ans',2],['Moins de 7 ans',1]],tarifs={'adulte':4,'enfants':[[6,1],[14,2]]},
 reservation='sur_place',reservation_delai='sur place ou en ligne',duree='45 min',moment='Par temps clair, en fin de journée',enfants=True,
 texte="Une tour d'observation de 92 m, à deux pas de la cité universitaire : un ascenseur vitré vous monte en une minute au-dessus de tout Madrid, du Palais royal aux tours de la Castellana. Peu de monde, prix mini.",
 site_officiel='https://www.esmadrid.com/informacion-turistica/faro-de-moncloa',a_verifier=False)
a(id='cibeles',nom='Palais de Cibeles et son belvédère',emoji='🏛️',type='vue',quartier='Cibeles',lat=40.418888,lng=-3.692049,prix=4,
 prix_detail=[['Belvédère',4],['7 à 14 ans',2],['Bâtiment et expositions','gratuit']],tarifs={'adulte':4,'enfants':[[6,0],[14,2]]},
 reservation='conseille',reservation_delai='créneaux en ligne la veille (petits groupes)',duree='45 min',moment='Le soir, pour voir la fontaine et la Gran Vía s\'allumer',enfants=True,
 texte="L'ancienne poste, devenue mairie, est un palais blanc digne d'une cathédrale. Du belvédère, vue plongeante sur la fontaine de Cibeles, où les supporters du Real fêtent les titres, et sur l'axe Alcalá–Gran Vía.",
 site_officiel='https://www.centrocentro.org/',a_verifier=True)
a(id='retiro',nom='Parc du Retiro et Palais de cristal',emoji='🌳',type='balade',quartier='Retiro',lat=40.415258,lng=-3.683466,prix=0,
 prix_detail=[['Parc et Palais de cristal','gratuit'],['Barque sur le grand bassin (45 min, 4 pers.)','6 € en semaine, 8 € le week-end']],
 tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='accès libre ; barques sur place',duree='2 h',moment='Le dimanche matin, quand tout Madrid s\'y promène',enfants=True,badges=['tendance'],
 texte="Le poumon de Madrid, classé à l'Unesco : on rame sur le grand bassin face au monument d'Alphonse XII, puis on entre dans le Palais de cristal, une serre de verre et de fer posée au bord d'un lac. Le décor le plus partagé de la ville.",
 site_officiel='https://www.esmadrid.com/informacion-turistica/parque-del-retiro',note="Le grand bassin doit être vidé pour des travaux (calendrier pas encore fixé) : les barques peuvent être suspendues.",a_verifier=False)
a(id='centro',nom='Puerta del Sol, Plaza Mayor et Gran Vía',emoji='🚶',type='balade',quartier='Sol',lat=40.415511,lng=-3.707401,prix=0,
 prix_detail=[['Balade','gratuit']],tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='accès libre',duree='2 h',moment='En fin de journée, quand la ville sort',enfants=True,
 texte="Le Madrid des cartes postales en une boucle à pied : le kilomètre zéro de la Puerta del Sol, la Plaza Mayor et ses arcades rouges, puis la Gran Vía, les « Champs-Élysées » madrilènes bordés d'immeubles des années 1920 et de théâtres.",
 site_officiel='https://www.esmadrid.com/',a_verifier=False)
a(id='rastro',nom='El Rastro, le marché aux puces du dimanche',emoji='🛍️',type='balade',quartier='La Latina',lat=40.408,lng=-3.7075,prix=0,
 prix_detail=[['Entrée','gratuit']],tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='accès libre',duree='2 h',moment='Le dimanche (et jours fériés), de 9 h à 15 h ; avant 11 h pour éviter la foule',enfants=True,
 texte="Depuis plus de 400 ans, un millier d'étals envahissent chaque dimanche les rues en pente de La Latina : brocante, vinyles, vêtements, objets improbables. Ensuite, on fait comme les Madrilènes : l'apéritif dans les bars de la Cava Baja.",
 site_officiel='https://www.esmadrid.com/',note='Gardez votre sac devant vous : les pickpockets aiment la foule du Rastro.',a_verifier=False)
a(id='madrid-rio',nom='Madrid Río et Matadero',emoji='🚲',type='balade',quartier='Arganzuela',lat=40.4045,lng=-3.7155,prix=0,
 prix_detail=[['Parc et Matadero','gratuit (certaines expositions payantes)']],tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='accès libre',duree='2 h',moment="L'après-midi, à pied ou à vélo",enfants=True,
 texte="Une promenade de 10 km le long du Manzanares, avec ses ponts design, ses plages urbaines et ses jeux d'enfants, jusqu'au Matadero : d'anciens abattoirs devenus le grand centre culturel branché de Madrid.",
 site_officiel='https://www.mataderomadrid.org/',a_verifier=False)
a(id='letras',nom='Quartier des Lettres (Huertas)',emoji='📜',type='balade',quartier='Huertas',lat=40.414658,lng=-3.699555,prix=0,
 prix_detail=[['Balade','gratuit']],tarifs={'adulte':0,'enfants':[]},reservation='libre',reservation_delai='accès libre',duree='1 h 30',moment='En fin d\'après-midi, avant les tapas de la Plaza Santa Ana',enfants=True,
 texte="Le quartier où vécurent Cervantès, Lope de Vega et Quevedo : des citations dorées sont incrustées dans les pavés, entre librairies, bars à vermouth et la Plaza Santa Ana, l'une des places les plus vivantes le soir.",
 site_officiel='https://www.esmadrid.com/',a_verifier=False)
a(id='flamenco',nom='Spectacle de flamenco au Villa Rosa',emoji='💃',type='sortir',quartier='Plaza Santa Ana',lat=40.41463,lng=-3.70075,prix=40,
 prix_detail=[['Spectacle avec une boisson','≈ 35 à 45 €'],['Spectacle avec dîner','≈ 65 à 80 €']],tarifs={'adulte':40,'enfants':[]},
 reservation='indispensable',reservation_delai='quelques jours avant (complet le week-end)',duree='1 h',moment='Le soir (séances vers 20 h 30 et 22 h 30)',enfants=False,
 texte="Le plus ancien tablao du monde (1911), derrière une façade de céramiques peintes sur la Plaza Santa Ana. Guitare, chant et danse à quelques mètres de vous : une heure d'émotion pure, loin des spectacles pour touristes.",
 site_officiel='https://www.tablaoflamencovillarosa.com/',note="Le Corral de la Morería, plus célèbre, coûte à partir de 75 € le spectacle seul.",a_verifier=True)
a(id='hammam',nom='Bains arabes Hammam Al Ándalus',emoji='🛁',type='sortir',quartier='Plaza Mayor',lat=40.41438,lng=-3.704393,prix=60,
 prix_detail=[['Bains (1 h 30) avec massage de 15 min','≈ 60 €'],['Avec massage de 30 min','≈ 75 €']],tarifs={'adulte':60,'enfants':[]},
 reservation='indispensable',reservation_delai='quelques jours avant (créneaux limités)',duree='1 h 30',moment='En fin de journée, après la marche',enfants=False,
 texte="Sous les voûtes de briques d'une maison du XVIIe siècle, des bassins d'eau froide, tiède et chaude éclairés à la bougie, et un thé à la menthe pour finir. La pause parfaite après une journée de musées, à deux pas de la Plaza Mayor.",
 site_officiel='https://madrid.hammamalandalus.com/',a_verifier=True)
a(id='bernabeu',nom='Visite du stade Santiago Bernabéu',emoji='🏟️',type='sport',quartier='Chamartín',lat=40.452207,lng=-3.689333,prix=37,
 prix_detail=[['Tour Classic, en ligne dès',37],['Au guichet',40],['Visite guidée, dès',56],['Moins de 5 ans','gratuit']],
 tarifs={'adulte':37,'enfants':[[4,0]]},reservation='conseille',reservation_delai='quelques jours avant (prix qui montent selon la date)',duree='1 h 30',moment='En semaine ; la visite est très réduite les jours de match',enfants=True,
 texte="Le nouveau Bernabéu, avec son toit rétractable et son écran à 360°, est devenu une attraction en soi. La visite passe par le musée et ses 15 Ligues des champions, une vue panoramique sur la pelouse et le banc des joueurs.",
 site_officiel='https://www.realmadrid.com/es-ES/tour-bernabeu',a_verifier=False)
a(id='real',nom='Match du Real Madrid',emoji='⚽',type='sport',quartier='Chamartín',lat=40.45302,lng=-3.688375,prix=90,
 prix_detail=[['Billet de championnat','≈ 70 à 150 €'],['Grands matchs (Barça, Ligue des champions)','bien plus cher']],tarifs={'adulte':90,'enfants':[]},
 reservation='indispensable',reservation_delai="dès la mise en vente sur le site du club (souvent 1 à 2 semaines avant)",duree='3 h',moment='Les soirs de match',enfants=True,club='Real Madrid',
 texte="Le club le plus titré d'Europe dans le stade le plus spectaculaire du moment : 80 000 spectateurs sous le toit fermé, l'hymne « Hala Madrid » repris par tout le stade. Un souvenir à vie, même sans être fan de foot.",
 site_officiel='https://www.realmadrid.com/',note="Achetez uniquement sur le site officiel du club : les revendeurs pratiquent des prix énormes, et les billets nominatifs peuvent être refusés.",a_verifier=True)
a(id='atletico',nom="Match de l'Atlético de Madrid",emoji='⚽',type='sport',quartier='San Blas',lat=40.436198,lng=-3.599533,prix=50,
 prix_detail=[['Billet de championnat','≈ 30 à 150 €']],tarifs={'adulte':50,'enfants':[]},
 reservation='conseille',reservation_delai='dès la mise en vente sur le site du club',duree='3 h',moment='Les soirs de match',enfants=True,club='Atlético Madrid',
 texte="L'autre grand club de Madrid, celui du peuple et de l'intensité, dans le moderne Metropolitano. Ambiance brûlante et billets souvent plus faciles (et moins chers) à trouver que pour le Real.",
 site_officiel='https://www.atleticodemadrid.com/',note='Achetez sur le site officiel du club.',a_verifier=True)
a(id='toledo',nom='Excursion à Tolède',emoji='🏯',type='nature',quartier='Tolède (33 min en train)',lat=39.8628,lng=-4.0273,prix=28,
 prix_detail=[['Train Avant aller-retour depuis Atocha','≈ 22,50 à 28 €'],['Cathédrale et monuments','en plus, selon les visites']],tarifs={'adulte':28,'enfants':[]},
 reservation='conseille',reservation_delai='train à réserver quelques jours avant (places limitées)',duree='La journée',moment='Partez tôt, avant les groupes',enfants=True,
 texte="La « ville des trois cultures » perchée au-dessus du Tage : ruelles médiévales, cathédrale gothique, synagogues et tableaux du Greco. À 33 minutes de train seulement, la plus belle excursion depuis Madrid.",
 site_officiel='https://turismo.toledo.es/',a_verifier=True)
a(id='segovia',nom='Excursion à Ségovie',emoji='🏰',type='nature',quartier='Ségovie (30 min en train)',lat=40.948,lng=-4.1184,prix=30,
 prix_detail=[['Train aller-retour depuis Chamartín','≈ 20 €'],['Alcázar (palais et musée)',7],['Alcázar avec la tour',10]],tarifs={'adulte':30,'enfants':[]},
 reservation='conseille',reservation_delai='train à réserver quelques jours avant',duree='La journée',moment='En semaine, départ le matin',enfants=True,
 texte="Un aqueduc romain de 2 000 ans haut de 28 mètres, au cœur de la ville, et l'Alcázar qui a inspiré le château de Blanche-Neige. Sur place, goûtez le cochon de lait, la grande spécialité.",
 site_officiel='https://www.turismodesegovia.com/',note="La gare à grande vitesse est à 15 min de bus du centre (ligne 11 ou 12).",a_verifier=True)
a(id='escorial',nom="Monastère de l'Escurial",emoji='⛪',type='nature',quartier='San Lorenzo de El Escorial (1 h)',lat=40.5891,lng=-4.1477,prix=22,
 prix_detail=[['Entrée générale',18],['Étudiants, plus de 65 ans',9],['Train de banlieue C-3 aller-retour','≈ 8 €']],tarifs={'adulte':22,'enfants':[[4,0]]},
 reservation='conseille',reservation_delai='billet en ligne quelques jours avant',duree='La demi-journée',moment='Le matin ; fermé le lundi',enfants=True,
 texte="Le gigantesque monastère-palais de Philippe II, au pied des montagnes : une bibliothèque aux plafonds peints, le panthéon des rois d'Espagne en marbre et bronze, et des jardins avec vue sur toute la plaine.",
 site_officiel='https://www.patrimonionacional.es/',a_verifier=True)
a(id='zoo',nom='Zoo Aquarium de Madrid',emoji='🐼',type='nature',quartier='Casa de Campo',lat=40.408956,lng=-3.761229,prix=25,
 prix_detail=[['Entrée en ligne, dès','≈ 20 €'],['Au guichet','plus cher']],tarifs={'adulte':25,'enfants':[[2,0]]},
 reservation='conseille',reservation_delai='en ligne pour avoir le meilleur prix',duree='La demi-journée',moment='Le matin, quand les animaux sont actifs',enfants=True,
 texte="Pandas géants, dauphins, gorilles et requins dans un grand parc de la Casa de Campo : la sortie préférée des familles, avec des spectacles d'oiseaux et d'otaries.",
 site_officiel='https://www.zoomadrid.com/',a_verifier=True)
a(id='botanico',nom='Jardin botanique royal',emoji='🌸',type='nature',quartier='Paseo del Prado',lat=40.411106,lng=-3.691127,prix=4,
 prix_detail=[['Entrée générale',4],['Moins de 18 ans','gratuit']],tarifs={'adulte':4,'enfants':[[17,0]]},reservation='sur_place',reservation_delai='sur place',
 duree='1 h',moment='Au printemps et en automne, après le Prado',enfants=True,
 texte="Juste à côté du Prado, un jardin du XVIIIe siècle en terrasses : 5 000 espèces, des serres, des allées d'arbres centenaires. Une pause verte et calme pour 4 € au milieu des grands musées.",
 site_officiel='https://rjb.csic.es/',a_verifier=True)
a(id='arqueologico',nom="Musée archéologique national",emoji='🏺',type='culture',quartier='Salamanca',lat=40.423,lng=-3.6886,prix=3,
 prix_detail=[['Entrée générale',3],['Moins de 18 ans et plus de 65 ans','gratuit']],tarifs={'adulte':3,'enfants':[[17,0]]},reservation='sur_place',reservation_delai='sur place',
 duree='1 h 30',moment='Le samedi après-midi et le dimanche matin, c\'est gratuit',enfants=True,
 texte="La Dame d'Elche, mystérieux buste ibère de 2 500 ans, les trésors wisigoths et une copie grandeur nature des peintures d'Altamira : toute l'histoire de l'Espagne pour 3 €.",
 site_officiel='https://www.man.es/',a_verifier=False)
print(len(A))
