<?php
// Copiez ce fichier en « config.php » (dans le même dossier) et remplissez les valeurs.
// config.php n'est PAS versionné dans git : il contient votre clé secrète.
//
// Obtenir la clé CallMeBot (2 minutes, gratuit) :
//   1. Ajoutez le numéro CallMeBot à vos contacts WhatsApp
//      (numéro indiqué sur https://www.callmebot.com/blog/free-api-whatsapp-messages/).
//   2. Envoyez-lui sur WhatsApp : I allow callmebot to send me messages
//   3. Vous recevez votre « apikey » en réponse.
return [
    // Votre numéro WhatsApp au format international, sans espaces (ex. +15145551234).
    'phone'  => '+1XXXXXXXXXX',
    // La clé reçue de CallMeBot.
    'apikey' => 'VOTRE_CLE',
    // Nombre max. de demandes acceptées par visiteur (adresse IP) par heure.
    'max_per_hour' => 5,
];
