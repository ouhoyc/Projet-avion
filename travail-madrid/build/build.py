import json,sys
sys.path.insert(0,'/tmp/claude-0/mad/build')
exec(open('/tmp/claude-0/mad/build/acts.py').read())
exec(open('/tmp/claude-0/mad/build/restos.py').read())
PH=json.load(open('/tmp/claude-0/mad/photos.json'))
Q=[
 {'id':'sol','nom':'Sol et Madrid des Habsbourg','lat':40.4155,'lng':-3.7065,'texte':"Entre la Puerta del Sol, la Plaza Mayor et le Palais royal : tout se fait à pied, et la Gran Vía est à deux pas. Idéal pour un premier séjour, mais bruyant le soir et plus cher."},
 {'id':'letras','nom':'Quartier des Lettres (Huertas)','lat':40.4143,'lng':-3.6985,'texte':"Entre la Plaza Santa Ana et le Prado : rues piétonnes, bars à tapas, et les trois grands musées à 5 minutes à pied. Le meilleur compromis entre culture et sorties."},
 {'id':'malasana','nom':'Malasaña et Chueca','lat':40.4245,'lng':-3.701,'texte':"Les quartiers jeunes et branchés au nord de la Gran Vía : boutiques vintage, cafés, bars et vie nocturne jusque tard. Parfait pour sortir, moins pour dormir tôt."},
 {'id':'salamanca','nom':'Salamanca et Retiro','lat':40.4245,'lng':-3.684,'texte':"Le Madrid élégant : grandes avenues, boutiques de luxe et restaurants chics, avec le parc du Retiro à côté. Calme et sûr, à une ou deux stations de métro du centre."},
 {'id':'latina','nom':'La Latina et Lavapiés','lat':40.4105,'lng':-3.7065,'texte':"Le Madrid populaire : la Cava Baja et ses tavernes, le Rastro le dimanche, puis Lavapiés, multiculturel et artiste. Des hôtels souvent moins chers, à 10 minutes à pied de la Plaza Mayor."},
]
for x in A:
    p=PH.get(x['id'],{}).get('photo')
    if p: x['photo']=p
    else: print('pas de photo',x['id'])
for x in R:
    p=PH.get('r-'+x['id'],{}).get('photo')
    if p: x['photo']={**p,**({'illustration':True} if x.get('illustration') else {})}
    else: print('pas de photo resto',x['id'])
G={'city_code':'MAD','statut':'préparé en autonomie, prix estimés au 22/10/2026','verifie_le':'2026-10-22',
 'reservation_legende':{"indispensable": "Réserver à l'avance (souvent complet sur place)", "conseille": "Réserver conseillé (moins cher ou moins d'attente)", "sur_place": "Sur place possible", "libre": "Accès libre"},
 'activites':A,'quartiers':Q,'hotel_petit_prix_max':100,'restaurants':R}
json.dump(G,open('/home/user/Projet-avion/guides/MAD.json','w'),ensure_ascii=False,indent=1)
print('ok',len(A),len(R))
