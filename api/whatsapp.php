<?php
// Reçoit une demande du chatbot du site et la transmet sur WhatsApp via CallMeBot.
// Réponse JSON : {"ok":true} ou {"ok":false,"error":"..."}.

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'method']);
}

// N'accepter que les appels venant du site lui-même.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    reply(403, ['ok' => false, 'error' => 'origin']);
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    reply(500, ['ok' => false, 'error' => 'config']);
}
$config = require $configFile;

$data = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($data)) {
    reply(400, ['ok' => false, 'error' => 'json']);
}

// Pot de miel : champ invisible pour les humains, rempli par les robots.
if (!empty($data['website'])) {
    reply(200, ['ok' => true]);
}

function field(array $data, string $key, int $max): string {
    $v = isset($data[$key]) && is_string($data[$key]) ? $data[$key] : '';
    $v = trim(preg_replace('/[\x00-\x09\x0B-\x1F\x7F]/u', '', $v) ?? '');
    return mb_substr($v, 0, $max);
}

$besoin  = field($data, 'besoin', 60);
$prenom  = field($data, 'prenom', 60);
$canal   = field($data, 'canal', 20);
$contact = field($data, 'contact', 120);
$message = field($data, 'message', 1000);
$page    = field($data, 'page', 200);

if ($besoin === '' || $prenom === '' || $contact === '') {
    reply(422, ['ok' => false, 'error' => 'champs']);
}

// Limite anti-abus : N demandes par IP et par heure.
$ip      = $_SERVER['REMOTE_ADDR'] ?? 'inconnu';
$max     = (int)($config['max_per_hour'] ?? 5);
$store   = sys_get_temp_dir() . '/chatbot_wa_' . hash('sha256', $ip . __DIR__);
$now     = time();
$hits    = [];
if (is_file($store)) {
    $hits = array_filter(
        json_decode((string)file_get_contents($store), true) ?: [],
        fn($t) => is_int($t) && $t > $now - 3600
    );
}
if (count($hits) >= $max) {
    reply(429, ['ok' => false, 'error' => 'limite']);
}
$hits[] = $now;
file_put_contents($store, json_encode(array_values($hits)), LOCK_EX);

$lignes = [
    '*Nouvelle demande — enneagramme.co*',
    '',
    '*Besoin :* ' . $besoin,
    '*Prénom :* ' . $prenom,
    '*Contact (' . ($canal !== '' ? $canal : '?') . ') :* ' . $contact,
];
if ($message !== '') {
    $lignes[] = '*Message :* ' . $message;
}
if ($page !== '') {
    $lignes[] = '_Page : ' . $page . '_';
}
$texte = implode("\n", $lignes);

$url = 'https://api.callmebot.com/whatsapp.php?' . http_build_query([
    'phone'  => $config['phone'] ?? '',
    'text'   => $texte,
    'apikey' => $config['apikey'] ?? '',
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_CONNECTTIMEOUT => 5,
]);
$body   = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// CallMeBot répond 200 (« Message queued… ») en cas de succès, et un texte
// mentionnant « invalid » / « error » si la clé ou le numéro est mauvais.
if ($body === false || $status !== 200 || preg_match('/invalid|error/i', (string)$body)) {
    error_log('chatbot whatsapp: echec CallMeBot (HTTP ' . $status . ') ' . substr((string)$body, 0, 300));
    reply(502, ['ok' => false, 'error' => 'envoi']);
}

reply(200, ['ok' => true]);
