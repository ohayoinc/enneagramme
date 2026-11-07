<?php
/**
 * Inscription à l'infolettre via l'API Brevo (v3).
 *
 * La clé API n'est JAMAIS versionnée ni exposée au navigateur.
 * Elle est lue, dans l'ordre :
 *   1. ../../newsletter-config.php  (hors de public_html — recommandé)
 *   2. ./newsletter-config.php      (ignoré par git, bloqué en accès direct)
 *   3. variables d'environnement BREVO_API_KEY / BREVO_LIST_ID / BREVO_DOI_TEMPLATE_ID
 * Voir api/newsletter-config.example.php.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'message' => 'Méthode non autorisée.']);
}

// Configuration
$config = [];
foreach ([dirname(__DIR__, 2) . '/newsletter-config.php', __DIR__ . '/newsletter-config.php'] as $file) {
    if (is_readable($file)) { $config = require $file; break; }
}
$apiKey      = $config['api_key']         ?? getenv('BREVO_API_KEY') ?: '';
$listId      = (int) ($config['list_id']  ?? getenv('BREVO_LIST_ID') ?: 0);
$doiTemplate = (int) ($config['doi_template_id'] ?? getenv('BREVO_DOI_TEMPLATE_ID') ?: 0);
$redirectUrl = $config['doi_redirect_url'] ?? 'https://enneagramme.co/infolettre-confirmee.html';

if ($apiKey === '' || $listId <= 0) {
    error_log('[newsletter] Configuration Brevo manquante (api_key / list_id).');
    respond(500, ['ok' => false, 'message' => 'Inscription momentanément indisponible.']);
}

// Entrée (formulaire classique ou JSON)
$input = $_POST;
if (empty($input)) {
    $raw = json_decode(file_get_contents('php://input') ?: '', true);
    if (is_array($raw)) { $input = $raw; }
}

// Pot de miel anti-robots : champ invisible qui doit rester vide
if (!empty($input['site_web'] ?? '')) {
    respond(200, ['ok' => true, 'message' => 'Merci !']);
}

$email = trim((string) ($input['email'] ?? ''));
if ($email === '' || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, ['ok' => false, 'message' => 'Adresse courriel invalide.']);
}
if (empty($input['consentement'] ?? '')) {
    respond(422, ['ok' => false, 'message' => 'Merci de cocher la case de consentement.']);
}

// Double opt-in si un modèle de confirmation est configuré (recommandé : LCAP / Loi 25 / RGPD)
if ($doiTemplate > 0) {
    $endpoint = 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation';
    $payload  = [
        'email'          => $email,
        'includeListIds' => [$listId],
        'templateId'     => $doiTemplate,
        'redirectionUrl' => $redirectUrl,
    ];
    $successMessage = 'Merci ! Un courriel de confirmation vient de vous être envoyé.';
} else {
    $endpoint = 'https://api.brevo.com/v3/contacts';
    $payload  = [
        'email'         => $email,
        'listIds'       => [$listId],
        'updateEnabled' => true,
    ];
    $successMessage = 'Merci ! Votre inscription est confirmée.';
}

$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => [
        'accept: application/json',
        'content-type: application/json',
        'api-key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload),
]);
$response = curl_exec($ch);
$status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error    = curl_error($ch);
curl_close($ch);

if ($status >= 200 && $status < 300) {
    respond(200, ['ok' => true, 'message' => $successMessage]);
}

$data = json_decode((string) $response, true);
if (($data['code'] ?? '') === 'duplicate_parameter') {
    respond(200, ['ok' => true, 'message' => 'Vous êtes déjà inscrit·e. Merci !']);
}

error_log('[newsletter] Brevo HTTP ' . $status . ' ' . $error . ' ' . substr((string) $response, 0, 500));
respond(502, ['ok' => false, 'message' => 'Une erreur est survenue. Réessayez plus tard.']);
