<?php
/**
 * Modèle de configuration de l'infolettre Brevo.
 *
 * 1. Copier ce fichier sous le nom « newsletter-config.php »,
 *    idéalement AU-DESSUS de public_html sur Hostinger
 *    (ex. /home/uXXXX/domains/enneagramme.co/newsletter-config.php),
 *    sinon dans ce dossier api/ (le fichier est ignoré par git et bloqué par .htaccess).
 * 2. Renseigner les valeurs ci-dessous. Ne jamais versionner la vraie clé.
 */
return [
    // Brevo > SMTP & API > Clés API
    'api_key'          => 'xkeysib-...',
    // Brevo > Contacts > Listes : identifiant numérique de la liste « Infolettre »
    'list_id'          => 0,
    // Optionnel (recommandé) : ID du modèle « Double opt-in » (Brevo > Modèles).
    // 0 = ajout direct à la liste sans courriel de confirmation.
    'doi_template_id'  => 0,
    // Page affichée après le clic sur le lien de confirmation
    'doi_redirect_url' => 'https://enneagramme.co/infolettre-confirmee.html',
];
